import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import path from "path";
import fs from "fs";
import type { Scene } from "@prisma/client";
import { resolvePublicAudioPath } from "@/lib/renderer/v2/timeline-music";

import { renderV2 } from "@/lib/renderer/v2/render";

type TransitionType = "fade" | "slide" | "zoom" | "none";

type TimelineTransition = {
  transitionType: TransitionType;
  transitionDuration: number;
};

export async function POST(req: Request) {
  console.log("================================");
  console.log("🚀 RENDER STARTED");
  console.log("================================");

  let videoId: string | null = null;
  let tempDir: string | null = null;

  try {
    // =====================================================
    // 1. AUTHENTICATION
    // =====================================================

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    // =====================================================
    // 2. REQUEST BODY
    // =====================================================

    const body = await req.json();

    videoId = body.videoId;

    if (!videoId) {
      return NextResponse.json(
        {
          error: "videoId required",
        },
        {
          status: 400,
        }
      );
    }

    console.log("VIDEO ID:", videoId);

    // =====================================================
    // 3. GET USER
    // =====================================================

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // 4. GET VIDEO + TIMELINE SCENES
    // =====================================================

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: user.id,
      },

      include: {
        scenes: {
          orderBy: {
            order: "asc",
          },

          include: {
            generatedImages: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        },
      },
    });

    if (!video) {
      return NextResponse.json(
        {
          error: "Video not found",
        },
        {
          status: 404,
        }
      );
    }

    console.log("================================");
    console.log("VIDEO FOUND");
    console.log("VIDEO ID:", video.id);
    console.log("STATUS:", video.status);
    console.log("SCENES:", video.scenes.length);
    console.log("VOICE:", video.voiceUrl);
    console.log("CAPTIONS:", video.captionsUrl);
    console.log("================================");

    // =====================================================
    // PREVENT DUPLICATE RENDERING
    // =====================================================

    if (video.status === "rendering") {
      return NextResponse.json(
        {
          error: "Video is already rendering.",
        },
        {
          status: 409,
        }
      );
    }

    // =====================================================
    // 5. VALIDATE TIMELINE SCENES
    // =====================================================

    if (!video.scenes.length) {
      return NextResponse.json(
        {
          error:
            "No timeline scenes found. Generate images before rendering.",
        },
        {
          status: 400,
        }
      );
    }

    console.log("================================");
    console.log("TIMELINE VALIDATION");
    console.log("================================");

    for (const scene of video.scenes) {
      console.log(`Scene ${scene.order + 1}:`);
      console.log("Scene ID:", scene.id);

      const images = scene.generatedImages ?? [];

      console.log("Generated Images:", images.length);

      if (images.length === 0) {
        return NextResponse.json(
          {
            error: `Scene ${scene.order + 1} has no generated images.`,
          },
          {
            status: 400,
          }
        );
      }

      console.log(
        "Image URLs:",
        images.map((image: { imageUrl: string }) => image.imageUrl)
      );

      console.log("================================");
    }

    console.log("================================");
    console.log("✅ ALL SCENES HAVE IMAGES");
    console.log("================================");

    // =====================================================
    // REQUIRE VOICE
    // =====================================================

    if (!video.voiceUrl) {
      return NextResponse.json(
        {
          error: "Generate voice before rendering.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // REQUIRE CAPTIONS
    // =====================================================

    if (!video.captionsUrl) {
      return NextResponse.json(
        {
          error: "Generate captions before rendering.",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // MARK VIDEO AS RENDERING
    // =====================================================

    await prisma.video.update({
      where: {
        id: video.id,
      },

      data: {
        status: "rendering",
      },
    });

    console.log("🎬 VIDEO STATUS: rendering");

    // =====================================================
    // OUTPUT DIRECTORY
    // =====================================================

    const outputDir = path.join(
      process.cwd(),
      "public",
      "renders"
    );

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, {
        recursive: true,
      });
    }

    const outputPath = path.join(
      outputDir,
      `${video.id}.mp4`
    );

    // =====================================================
    // TEMP DIRECTORY
    // =====================================================

    tempDir = path.join(
      process.cwd(),
      "tmp",
      video.id
    );

    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, {
        recursive: true,
        force: true,
      });
    }

    fs.mkdirSync(tempDir, {
      recursive: true,
    });

    console.log("TEMP DIRECTORY:", tempDir);

    // =====================================================
    // 6. COPY CAPTIONS
    // =====================================================

    const captionsAssPath = path.join(
      tempDir,
      "captions.ass"
    );

    const sourceAss = path.join(
      process.cwd(),
      "public",
      video.captionsUrl.replace(/^\/+/, "")
    );

    console.log("================================");
    console.log("CAPTIONS");
    console.log("SOURCE:", sourceAss);
    console.log("DESTINATION:", captionsAssPath);
    console.log("================================");

    if (!fs.existsSync(sourceAss)) {
      throw new Error(
        `ASS missing: ${sourceAss}`
      );
    }

    fs.copyFileSync(
      sourceAss,
      captionsAssPath
    );

    console.log(
      "✅ Captions copied successfully"
    );

    // =====================================================
    // 7. COPY SCENE IMAGES IN TIMELINE ORDER
    // =====================================================

    const imagesDir = path.join(
      tempDir,
      "images"
    );

    fs.mkdirSync(
      imagesDir,
      {
        recursive: true,
      }
    );

    console.log("================================");
    console.log("COPYING TIMELINE IMAGES");
    console.log("================================");

    for (
      let index = 0;
      index < video.scenes.length;
      index++
    ) {
      const scene = video.scenes[index];

      const image =
        scene.generatedImages?.[0];

      if (!image) {
        throw new Error(
          `Scene ${scene.order + 1} has no generated image.`
        );
      }

      const sourceImage = path.join(
        process.cwd(),
        "public",
        image.imageUrl.replace(
          /^\/+/,
          ""
        )
      );

      if (!fs.existsSync(sourceImage)) {
        throw new Error(
          `Image missing for scene ${
            scene.order + 1
          }: ${sourceImage}`
        );
      }

      const ext =
        path.extname(sourceImage) ||
        ".jpg";

      const destination =
        path.join(
          imagesDir,
          `image-${index}${ext}`
        );

      console.log(
        `🎬 Scene ${scene.order + 1}`
      );

      console.log(
        "Scene ID:",
        scene.id
      );

      console.log(
        "Image ID:",
        image.id
      );

      console.log(
        "Source:",
        sourceImage
      );

      console.log(
        "Destination:",
        destination
      );

      fs.copyFileSync(
        sourceImage,
        destination
      );

      console.log(
        `✅ Scene ${scene.order + 1} image copied`
      );
    }

    console.log("================================");
    console.log(
      `✅ ${video.scenes.length} TIMELINE IMAGES COPIED`
    );
    console.log("================================");

    // =====================================================
    // VERIFY IMAGE COUNT
    // =====================================================

    const copiedImages =
      fs.readdirSync(imagesDir);

    console.log(
      "COPIED IMAGE FILES:",
      copiedImages
    );

    if (
      copiedImages.length !==
      video.scenes.length
    ) {
      throw new Error(
        `Timeline mismatch: ${video.scenes.length} scenes but ${copiedImages.length} copied images.`
      );
    }

    // =====================================================
    // 8. COPY VOICE
    // =====================================================

    const voicePath =
      path.join(
        tempDir,
        "voice.mp3"
      );

    const voiceSource =
      path.join(
        process.cwd(),
        "public",
        video.voiceUrl.replace(
          /^\/+/,
          ""
        )
      );

    console.log("================================");
    console.log("VOICE");
    console.log(
      "SOURCE:",
      voiceSource
    );
    console.log(
      "DESTINATION:",
      voicePath
    );
    console.log("================================");

    if (!fs.existsSync(voiceSource)) {
      throw new Error(
        `Voice missing: ${voiceSource}`
      );
    }

    fs.copyFileSync(
      voiceSource,
      voicePath
    );

    console.log(
      "✅ Voice copied successfully"
    );

    // =====================================================
    // 9. BUILD RENDER TRANSITION SETTINGS
    // =====================================================

    console.log("================================");
    console.log("🎞️ TIMELINE TRANSITIONS");
    console.log("================================");

    const timelineTransitions: TimelineTransition[] =
      video.scenes
        .slice(0, -1)
        .map(
          (
            scene: Scene,
            _sceneIndex: number
          ): TimelineTransition => {
            const rawType =
              scene.transitionType;

            const transitionType: TransitionType =
              rawType === "fade" ||
              rawType === "slide" ||
              rawType === "zoom" ||
              rawType === "none"
                ? rawType
                : "fade";

            const rawDuration =
              Number(
                scene.transitionDuration
              );

            const transitionDuration =
              Number.isFinite(
                rawDuration
              )
                ? rawDuration
                : 0.8;

            return {
              transitionType,
              transitionDuration,
            };
          }
        );

    console.table(
      timelineTransitions.map(
        (
          transition: TimelineTransition,
          index: number
        ) => ({
          boundary:
            `${index + 1} → ${index + 2}`,

          type:
            transition.transitionType,

          duration:
            transition.transitionDuration,
        })
      )
    );

    console.log("================================");

    // =====================================================
    // START RENDER V2
    // =====================================================

    console.log("================================");
    console.log("🎬 STARTING RENDER V2");
    console.log("================================");

    console.log(
      "Timeline scenes:",
      video.scenes.length
    );

    console.log(
      "Images directory:",
      imagesDir
    );

    console.log(
      "Voice:",
      voicePath
    );

    console.log(
      "Captions:",
      captionsAssPath
    );

    console.log(
      "Output:",
      outputPath
    );

    console.log("================================");

    // =====================================================
    // RENDER
    // =====================================================

    const renderResult = await renderV2({
  videoId: video.id,
  imagesDir,
  voicePath,
  captionsPath: captionsAssPath,
  workingDir: tempDir,
  output: outputPath,

  timelineSceneDurations:
    video.scenes.map(
      (scene: { duration: number }) =>
        scene.duration
    ),
});

    // =====================================================
    // VERIFY RENDER TIMELINE RESULT
    // =====================================================

    console.log("================================");
    console.log(
      "RENDER TIMELINE RESULT"
    );
    console.log("================================");

    console.log(
      "Final durations:",
      renderResult.finalDurations
    );

    console.log(
      "Final timeline duration:",
      renderResult.totalDuration
    );

    console.log(
      "Database scene count:",
      video.scenes.length
    );

    console.log(
      "Renderer scene count:",
      renderResult.finalDurations.length
    );

    console.log("================================");

    if (
      renderResult.finalDurations.length !==
      video.scenes.length
    ) {
      throw new Error(
        `Timeline result mismatch: renderer returned ${renderResult.finalDurations.length} durations for ${video.scenes.length} database scenes.`
      );
    }

    // =====================================================
    // VERIFY EVERY FINAL DURATION
    // =====================================================

    for (
      let index = 0;
      index <
      renderResult.finalDurations.length;
      index++
    ) {
      const duration =
        renderResult.finalDurations[index];

      if (
        !Number.isFinite(duration) ||
        duration <= 0
      ) {
        throw new Error(
          `Invalid final duration for scene ${
            index + 1
          }: ${duration}`
        );
      }
    }

    // =====================================================
    // VERIFY OUTPUT
    // =====================================================

    console.log("================================");
    console.log("VERIFYING OUTPUT");
    console.log(
      "OUTPUT:",
      outputPath
    );
    console.log("================================");

    if (!fs.existsSync(outputPath)) {
      throw new Error(
        "Renderer finished but output video does not exist."
      );
    }

    console.log(
      "✅ Render output verified"
    );

    // =====================================================
    // FINAL DATABASE UPDATE
    // =====================================================

    const videoUrl =
      `/renders/${video.id}.mp4`;

    // =====================================================
    // PERSIST FINAL TIMELINE DURATIONS
    // =====================================================

    console.log("================================");
    console.log("💾 PERSISTING FINAL TIMELINE");
    console.log("================================");

    console.log(
      "Original durations:",
      video.scenes.map(
        (
          scene: Scene
        ): number =>
          scene.duration
      )
    );

    console.log(
      "Final renderer durations:",
      renderResult.finalDurations
    );

    await prisma.$transaction(
      video.scenes.map(
        (
          scene: Scene,
          index: number
        ) =>
          prisma.scene.update({
            where: {
              id: scene.id,
            },

            data: {
              duration:
                renderResult.finalDurations[
                  index
                ],
            },
          })
      )
    );

    console.log(
      "✅ FINAL TIMELINE DURATIONS SAVED"
    );

    console.log("================================");

    // =====================================================
    // VERIFY SAVED TIMELINE
    // =====================================================

    const savedScenes =
      await prisma.scene.findMany({
        where: {
          videoId:
            video.id,
        },

        orderBy: {
          order: "asc",
        },

        select: {
          id: true,
          order: true,
          duration: true,
        },
      });

    console.log("================================");
    console.log(
      "💾 SAVED TIMELINE VERIFICATION"
    );
    console.log("================================");

    console.table(
      savedScenes.map(
        (
          scene: {
            id: string;
            order: number;
            duration: number;
          }
        ) => ({
          scene:
            scene.order + 1,

          sceneId:
            scene.id,

          duration:
            Number(
              scene.duration.toFixed(
                3
              )
            ),
        })
      )
    );

    console.log("================================");

    // =====================================================
    // UPDATE VIDEO
    // =====================================================

    await prisma.video.update({
      where: {
        id: video.id,
      },

      data: {
        videoUrl,
        status:
          "completed",
      },
    });

    console.log("================================");
    console.log("🎬 RENDER COMPLETE");
    console.log(
      "VIDEO URL:",
      videoUrl
    );

    console.log(
      "FINAL TIMELINE DURATION:",
      renderResult.totalDuration
    );

    console.log(
      "STATUS: completed"
    );

    console.log("================================");

    // =====================================================
    // CLEAN TEMP FILES
    // =====================================================

    if (
      tempDir &&
      fs.existsSync(tempDir)
    ) {
      console.log(
        "🧹 Cleaning temporary render files..."
      );

      fs.rmSync(
        tempDir,
        {
          recursive: true,
          force: true,
        }
      );

      console.log(
        "✅ Temporary render files cleaned"
      );
    }

    // =====================================================
    // SUCCESS RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      videoUrl,

      status:
        "completed",

      scenesRendered:
        video.scenes.length,

      timeline: {
        totalDuration:
          renderResult.totalDuration,

        sceneDurations:
          renderResult.finalDurations,
      },
    });
  } catch (error: unknown) {
    console.error("================================");
    console.error("❌ RENDER ERROR");

    if (error instanceof Error) {
      console.error(
        error.message
      );

      console.error(
        error.stack
      );
    } else {
      console.error(error);
    }

    console.error("================================");

    // =====================================================
    // CLEAN TEMP FILES
    // =====================================================

    if (
      tempDir &&
      fs.existsSync(tempDir)
    ) {
      try {
        console.log(
          "🧹 Cleaning temporary files after failure..."
        );

        fs.rmSync(
          tempDir,
          {
            recursive: true,
            force: true,
          }
        );

        console.log(
          "✅ Temporary files cleaned"
        );
      } catch (cleanupError) {
        console.error(
          "❌ Failed to clean temporary files:",
          cleanupError
        );
      }
    }

    // =====================================================
    // MARK VIDEO AS FAILED
    // =====================================================

    try {
      if (videoId) {
        const session =
          await auth();

        if (
          session?.user?.email
        ) {
          const user =
            await prisma.user.findUnique({
              where: {
                email:
                  session.user.email,
              },

              select: {
                id: true,
              },
            });

          if (user) {
            await prisma.video.updateMany({
              where: {
                id: videoId,
                userId:
                  user.id,
              },

              data: {
                status:
                  "failed",
              },
            });

            console.log(
              "❌ VIDEO STATUS: failed"
            );
          }
        }
      }
    } catch (
      statusError
    ) {
      console.error(
        "Failed to update render failure status:",
        statusError
      );
    }

    // =====================================================
    // ERROR RESPONSE
    // =====================================================

    const message =
      error instanceof Error
        ? error.message
        : "Render failed";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}