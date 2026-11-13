import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import path from "path";
import fs from "fs";
import axios from "axios";
import sharp from "sharp";

import { runRenderPipeline } from "@/lib/renderer/render-pipeline";
import { parseASS } from "@/lib/renderer/subtitle-parser";
import { buildSemanticScenes } from "@/lib/renderer/semantic-scenes";

// =====================================================
// TYPES
// =====================================================

type RenderPipeline = ReturnType<typeof runRenderPipeline>;

type RenderScene = RenderPipeline["scenes"][number];

export async function POST(req: Request) {
  let videoId: string | null = null;

  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // =====================================================
    // REQUEST
    // =====================================================

    const body = await req.json();

    videoId = body.videoId;

    if (!videoId) {
      return NextResponse.json(
        { error: "videoId required" },
        { status: 400 }
      );
    }

    // =====================================================
    // USER
    // =====================================================

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // =====================================================
    // VIDEO
    // =====================================================

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: user.id,
      },
    });

    if (!video?.script) {
      return NextResponse.json(
        { error: "Video not found or script missing" },
        { status: 404 }
      );
    }

    // =====================================================
    // PRODUCTION SAFETY
    // =====================================================

    const blockedStatuses = [
      "generating_images",
      "generating_voice",
      "rendering",
    ];

    if (blockedStatuses.includes(video.status)) {
      return NextResponse.json(
        {
          error: `Video is currently ${video.status.replace(
            "_",
            " "
          )}. Please wait until it finishes.`,
        },
        { status: 409 }
      );
    }

    // =====================================================
    // MARK GENERATION AS STARTED
    // =====================================================

    await prisma.video.update({
      where: {
        id: video.id,
      },
      data: {
        status: "generating_images",
      },
    });

    console.log("================================");
    console.log("🎨 IMAGE GENERATION STARTED");
    console.log("VIDEO ID:", video.id);
    console.log("================================");

    // =====================================================
    // REMOVE OLD DATA
    // IMPORTANT:
    // Delete GeneratedImages first because they reference Scene.
    // =====================================================

    await prisma.generatedImage.deleteMany({
      where: {
        videoId: video.id,
      },
    });

    await prisma.scene.deleteMany({
      where: {
        videoId: video.id,
      },
    });

    console.log("🗑️ Previous scenes and images removed");

    // =====================================================
    // BUILD RENDER PIPELINE
    // =====================================================

    let renderPipeline: RenderPipeline | null = null;

    const captionsPath = path.join(
      process.cwd(),
      "tmp",
      video.id,
      "captions.ass"
    );

    // =====================================================
    // CAPTIONS AVAILABLE
    // =====================================================

    if (fs.existsSync(captionsPath)) {
      console.log("✅ captions.ass found");
      console.log("🎬 Using semantic subtitle scenes");

      const subtitles = parseASS(captionsPath);

      const semanticScenes = buildSemanticScenes(
        subtitles,
        8
      );

      renderPipeline =
        runRenderPipeline(semanticScenes);
    } else {
      // =====================================================
      // NO CAPTIONS
      // =====================================================

      console.log("⚠️ captions.ass not found");
      console.log("🎬 Building scenes from script");

      const scriptSentences = video.script
        .split(".")
        .map((sentence: string) => sentence.trim())
        .filter((sentence: string) => sentence.length > 0)
        .slice(0, 8);

      const semanticScenes = scriptSentences.map(
        (sentence: string, index: number) => ({
          text: sentence,
          start: index * 3,
          end: index * 3 + 3,
          duration: 3,
        })
      );

      renderPipeline =
        runRenderPipeline(semanticScenes);
    }

    // =====================================================
    // SAFETY CHECK
    // =====================================================

    if (!renderPipeline) {
      throw new Error(
        "Hollywood Render Pipeline was not created."
      );
    }

    console.log("================================");
    console.log("🎬 HOLLYWOOD SCENES");
    console.log(
      "TOTAL SCENES:",
      renderPipeline.totalScenes
    );
    console.log("================================");

    console.table(
      renderPipeline.scenes.map(
        (scene: RenderScene) => ({
          scene: scene.id,
          duration: `${scene.duration}s`,
          shot: scene.camera.shot,
          movement: scene.camera.movement,
        })
      )
    );

    // =====================================================
    // IMAGE DIRECTORY
    // =====================================================

    const imageDir = path.join(
      process.cwd(),
      "public",
      "images",
      video.id
    );

    if (!fs.existsSync(imageDir)) {
      fs.mkdirSync(imageDir, {
        recursive: true,
      });
    }

    // =====================================================
    // GENERATE SCENES + IMAGES
    // =====================================================

    const generatedImages = [];

    for (const scene of renderPipeline.scenes as RenderScene[]) {
      console.log(
        `\n🎬 Rendering Scene ${scene.id + 1}`
      );

      const imagePrompt = scene.prompt;

      console.log(
        "\n========== FINAL HOLLYWOOD PROMPT ==========\n"
      );

      console.log(imagePrompt);

      // ===================================================
      // CREATE SCENE FIRST
      // ===================================================

      const savedScene = await prisma.scene.create({
  data: {
    order: scene.id,
    text: scene.narration || "",
    imagePrompt,
    duration: scene.duration,
    videoId: video.id,
  },
});

      console.log(
        `🎬 Scene saved: ${savedScene.id}`
      );

      // ===================================================
      // POLLINATIONS IMAGE URL
      // ===================================================

      const imageUrl =
  `https://gen.pollinations.ai/image/${encodeURIComponent(
    imagePrompt
  )}?model=flux&width=1080&height=1920`;

      console.log("🖼️ Generating image...");

      // ===================================================
      // DOWNLOAD IMAGE
      // ===================================================

      const response = await axios.get(imageUrl, {
  responseType: "arraybuffer",
  headers: {
    Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
  },
  timeout: 120000,
});
      // ===================================================
      // FILE
      // ===================================================

      const filename = `image-${scene.id}.jpg`;

      const filepath = path.join(
        imageDir,
        filename
      );

      // ===================================================
      // NORMALIZE IMAGE
      // ===================================================

      await sharp(response.data)
        .resize(1080, 1920, {
          fit: "cover",
          position: "centre",
        })
        .jpeg({
          quality: 92,
          mozjpeg: true,
        })
        .toFile(filepath);

      // ===================================================
      // VERIFY IMAGE
      // ===================================================

      const meta = await sharp(filepath).metadata();

      console.log(
        `🖼️ ${meta.width} x ${meta.height}`
      );

      // ===================================================
      // SAVE IMAGE WITH PERMANENT SCENE CONNECTION
      // ===================================================

      const image =
        await prisma.generatedImage.create({
          data: {
            prompt: imagePrompt,

            imageUrl: `/images/${video.id}/${filename}`,

            userId: user.id,

            videoId: video.id,

            // ⭐ IMPORTANT CONNECTION
            sceneId: savedScene.id,
          },
        });

      generatedImages.push({
        ...image,
        sceneId: savedScene.id,
      });

      console.log(
        `✅ Scene ${scene.id + 1}/${renderPipeline.totalScenes}`
      );

      console.log(
        `🔗 Scene ${savedScene.id} → Image ${image.id}`
      );
    }

    // =====================================================
    // MARK GENERATION COMPLETE
    // =====================================================

    const updatedVideo =
      await prisma.video.update({
        where: {
          id: video.id,
        },
        data: {
          status: "images_ready",
        },
      });

    console.log("================================");
    console.log("🎨 IMAGE GENERATION COMPLETE");
    console.log(
      "Images generated:",
      generatedImages.length
    );
    console.log(
      "Scenes created:",
      renderPipeline.totalScenes
    );
    console.log(
      "STATUS:",
      updatedVideo.status
    );
    console.log("================================");

    return NextResponse.json({
      success: true,

      imageCount: generatedImages.length,

      sceneCount: renderPipeline.totalScenes,

      images: generatedImages,

      status: updatedVideo.status,
    });
  } catch (error: unknown) {
    console.error(
      "========== IMAGE ERROR =========="
    );

    console.error(error);

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }

    console.error(
      "================================"
    );

    // =====================================================
    // MARK GENERATION AS FAILED
    // =====================================================

    try {
      if (videoId) {
        const session = await auth();

        if (session?.user?.email) {
          const user =
            await prisma.user.findUnique({
              where: {
                email: session.user.email,
              },
            });

          if (user) {
            await prisma.video.updateMany({
              where: {
                id: videoId,
                userId: user.id,
              },
              data: {
                status: "failed",
              },
            });
          }
        }
      }
    } catch (statusError) {
      console.error(
        "Failed to update failure status:",
        statusError
      );
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to generate images";

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}