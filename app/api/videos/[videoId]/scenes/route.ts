import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type {
  GeneratedImage,
  Prisma,
  Scene,
} from "@prisma/client";

interface RouteContext {
  params: Promise<{
    videoId: string;
  }>;
}

interface GeneratedImageData {
  id: string;
  imageUrl: string;
  prompt: string;
  sceneId: string | null;
}

interface SceneWithImage {
  id: string;
  order: number;
  text: string;
  imagePrompt: string;
  duration: number;
  transitionType: "fade" | "slide" | "zoom" | "none";
  transitionDuration: number;
  motionOverride: string | null;
  generatedImage: GeneratedImageData | null;
 audioUrl: string | null;
audioDuration: number | null;
audioStartTime: number | null;
audioTrimStart: number;
audioTrimEnd: number | null;
audioVolume: number;
audioMuted: boolean;
}

interface IncomingScene {
  id?: string;
  sourceSceneId?: string;
  text: string;
  imagePrompt: string;
  duration: number;
  transitionType?: "fade" | "slide" | "zoom" | "none";
  transitionDuration?: number;
  motionOverride?: string | null;

  audioStartTime?: number | null;
  audioTrimStart?: number | null;
  audioTrimEnd?: number | null;
  audioVolume?: number | null;
  audioMuted?: boolean | null;
}

// =====================================================
// GET SCENES + GENERATED IMAGES
// =====================================================

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  try {
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

    const { videoId } = await params;

    console.log("================================");
    console.log("TIMELINE GET");
    console.log("VIDEO ID:", videoId);

    // =====================================================
    // VERIFY VIDEO OWNERSHIP
    // =====================================================

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        user: {
          email: session.user.email,
        },
      },
      select: {
        id: true,
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

    // =====================================================
    // GET SCENES
    // =====================================================

    const prismaScenes =
      await prisma.scene.findMany({
        where: {
          videoId,
        },
        orderBy: {
          order: "asc",
        },
      });

    // =====================================================
    // GET GENERATED IMAGES
    // =====================================================

    const prismaImages =
      await prisma.generatedImage.findMany({
        where: {
          videoId,
          sceneId: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    // =====================================================
    // CREATE IMAGE LOOKUP
    // =====================================================

    const imagesBySceneId =
      new Map<
        string,
        GeneratedImageData
      >();

    prismaImages.forEach(
      (image: GeneratedImage) => {
        if (image.sceneId) {
          imagesBySceneId.set(
            image.sceneId,
            {
              id: image.id,
              imageUrl: image.imageUrl,
              prompt: image.prompt,
              sceneId: image.sceneId,
            }
          );
        }
      }
    );

    // =====================================================
    // BUILD RESPONSE
    // =====================================================

    const scenesWithImages: SceneWithImage[] =
  prismaScenes.map(
    (scene: Scene) => ({
      id: scene.id,
      order: scene.order,
      text: scene.text,
      imagePrompt: scene.imagePrompt,
      duration: scene.duration,

      transitionType:
        scene.transitionType as SceneWithImage[
          "transitionType"
        ],

      transitionDuration:
        scene.transitionDuration,

      motionOverride:
        scene.motionOverride ?? null,

      generatedImage:
        imagesBySceneId.get(
          scene.id
        ) ?? null,

      audioUrl:
        scene.audioUrl ?? null,

      audioDuration:
        scene.audioDuration ?? null,

        audioStartTime:
  scene.audioStartTime ?? null,

audioTrimStart:
  scene.audioTrimStart ?? 0,

audioTrimEnd:
  scene.audioTrimEnd ?? null,

audioVolume:
  scene.audioVolume ?? 1,

audioMuted:
  scene.audioMuted ?? false,
    })
  );

    console.log(
      "SCENES:",
      scenesWithImages.length
    );

    console.log(
      "CONNECTED IMAGES:",
      scenesWithImages.filter(
        (scene) =>
          scene.generatedImage !== null
      ).length
    );

    console.log("================================");

    return NextResponse.json({
      scenes: scenesWithImages,
    });
  } catch (error) {
    console.error(
      "GET /api/videos/[videoId]/scenes error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load scenes",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// PUT / SAVE SCENES
//
// FEATURES:
//
// ✅ Update existing scenes
// ✅ Create split scenes
// ✅ Preserve images on reorder
// ✅ Preserve images on trim
// ✅ Copy images on split
// ✅ Delete images when scenes are deleted
// =====================================================

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
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

    const { videoId } = await params;

    console.log("================================");
    console.log("TIMELINE SAVE STARTED");
    console.log("VIDEO ID:", videoId);
    console.log("================================");

    // =====================================================
    // VERIFY VIDEO OWNERSHIP
    // =====================================================

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        user: {
          email: session.user.email,
        },
      },
      select: {
        id: true,
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

    // =====================================================
    // READ BODY
    // =====================================================

    const body = await request.json();

    if (!Array.isArray(body.scenes)) {
      return NextResponse.json(
        {
          error: "scenes must be an array",
        },
        {
          status: 400,
        }
      );
    }

    const incomingScenes =
      body.scenes as IncomingScene[];

    // =====================================================
    // VALIDATE
    // =====================================================

    for (
      let index = 0;
      index < incomingScenes.length;
      index++
    ) {
      const scene =
        incomingScenes[index];

      if (
        typeof scene.text !== "string" ||
        typeof scene.imagePrompt !== "string"
      ) {
        return NextResponse.json(
          {
            error: `Invalid scene at index ${index}`,
          },
          {
            status: 400,
          }
        );
      }

      if (
        typeof scene.duration !== "number" ||
        !Number.isFinite(scene.duration) ||
        scene.duration < 1
      ) {
        return NextResponse.json(
          {
            error: `Invalid duration at scene ${
              index + 1
            }`,
          },
          {
            status: 400,
          }
        );
      }
    }

    // =====================================================
    // GET EXISTING SCENES
    // =====================================================

    const existingScenes =
      await prisma.scene.findMany({
        where: {
          videoId,
        },
        select: {
          id: true,
        },
      });

    const existingSceneIds =
      new Set<string>(
        existingScenes.map(
          (scene: { id: string }) =>
            scene.id
        )
      );

    // =====================================================
    // IDENTIFY EXISTING SCENE IDs
    //
    // temp-* IDs are frontend IDs created by Split.
    // =====================================================

    const incomingExistingIds =
      new Set<string>(
        incomingScenes
          .filter(
            (scene: IncomingScene) =>
              Boolean(scene.id) &&
              !scene.id!.startsWith("temp-") &&
              existingSceneIds.has(
                scene.id!
              )
          )
          .map(
            (scene: IncomingScene) =>
              scene.id!
          )
      );

    // =====================================================
    // IDENTIFY SCENES THAT WILL BE DELETED
    // =====================================================

    const sceneIdsToDelete =
      existingScenes
        .filter(
          (scene: { id: string }) =>
            !incomingExistingIds.has(
              scene.id
            )
        )
        .map(
          (scene: { id: string }) =>
            scene.id
        );

    // =====================================================
    // TRANSACTION
    // =====================================================

    await prisma.$transaction(
      async (
        tx: Prisma.TransactionClient
      ) => {
        // =================================================
        // UPDATE EXISTING SCENES
        // =================================================

        for (
          let index = 0;
          index < incomingScenes.length;
          index++
        ) {
          const scene =
            incomingScenes[index];

          const isExisting =
            Boolean(scene.id) &&
            !scene.id!.startsWith(
              "temp-"
            ) &&
            existingSceneIds.has(
              scene.id!
            );

          if (
            isExisting &&
            scene.id
          ) {
            await tx.scene.update({
              where: {
                id: scene.id,
              },
              data: {
                order: index,
                text: scene.text,
                imagePrompt:
                  scene.imagePrompt,
                duration: Math.max(
                  1,
                  scene.duration
                ),
                transitionType: scene.transitionType ?? "fade",
                transitionDuration:
                  scene.transitionType === "none"
                    ? 0
                    : Number.isFinite(scene.transitionDuration)
                      ? Math.max(0, scene.transitionDuration!)
                      : 0.8,

                      motionOverride:
  scene.motionOverride ?? null,

  audioStartTime:
  typeof scene.audioStartTime === "number" &&
  Number.isFinite(scene.audioStartTime)
    ? Math.max(0, scene.audioStartTime)
    : null,

audioTrimStart:
  typeof scene.audioTrimStart === "number" &&
  Number.isFinite(scene.audioTrimStart)
    ? Math.max(0, scene.audioTrimStart)
    : 0,

audioTrimEnd:
  typeof scene.audioTrimEnd === "number" &&
  Number.isFinite(scene.audioTrimEnd)
    ? Math.max(0, scene.audioTrimEnd)
    : null,

audioVolume:
  typeof scene.audioVolume === "number" &&
  Number.isFinite(scene.audioVolume)
    ? Math.min(
        1,
        Math.max(0, scene.audioVolume)
      )
    : 1,

audioMuted:
  scene.audioMuted === true,
              },
            });
          }
        }

        // =================================================
        // CREATE NEW SCENES
        //
        // Store sourceSceneId → newSceneId mappings.
        // This is needed for image copying during Split.
        // =================================================

        const splitSceneMap =
          new Map<
            string,
            string[]
          >();

        for (
          let index = 0;
          index < incomingScenes.length;
          index++
        ) {
          const scene =
            incomingScenes[index];

          const isExisting =
            Boolean(scene.id) &&
            !scene.id!.startsWith(
              "temp-"
            ) &&
            existingSceneIds.has(
              scene.id!
            );

          if (!isExisting) {
            const createdScene =
              await tx.scene.create({
                data: {
                  order: index,
                  text: scene.text,
                  imagePrompt:
                    scene.imagePrompt,
                  duration: Math.max(
                    1,
                    scene.duration
                  ),
                  transitionType: scene.transitionType ?? "fade",
                  transitionDuration:
                    scene.transitionType === "none"
                      ? 0
                      : Number.isFinite(scene.transitionDuration)
                        ? Math.max(0, scene.transitionDuration!)
                        : 0.8,

                        motionOverride:
  scene.motionOverride ?? null,

  audioStartTime:
  typeof scene.audioStartTime === "number" &&
  Number.isFinite(scene.audioStartTime)
    ? Math.max(0, scene.audioStartTime)
    : null,

audioTrimStart:
  typeof scene.audioTrimStart === "number" &&
  Number.isFinite(scene.audioTrimStart)
    ? Math.max(0, scene.audioTrimStart)
    : 0,

audioTrimEnd:
  typeof scene.audioTrimEnd === "number" &&
  Number.isFinite(scene.audioTrimEnd)
    ? Math.max(0, scene.audioTrimEnd)
    : null,

audioVolume:
  typeof scene.audioVolume === "number" &&
  Number.isFinite(scene.audioVolume)
    ? Math.min(
        1,
        Math.max(0, scene.audioVolume)
      )
    : 1,

audioMuted:
  scene.audioMuted === true,
  
                  videoId,
                },
              });

            // =============================================
            // REMEMBER SPLIT SOURCE
            // =============================================

            if (
              scene.sourceSceneId &&
              existingSceneIds.has(
                scene.sourceSceneId
              )
            ) {
              const current =
                splitSceneMap.get(
                  scene.sourceSceneId
                ) ?? [];

              current.push(
                createdScene.id
              );

              splitSceneMap.set(
                scene.sourceSceneId,
                current
              );
            }
          }
        }

        // =================================================
        // COPY IMAGES WHEN A SCENE WAS SPLIT
        // =================================================

        for (
          const [
            sourceSceneId,
            newSceneIds,
          ] of splitSceneMap.entries()
        ) {
          const sourceImages =
            await tx.generatedImage.findMany({
              where: {
                videoId,
                sceneId: sourceSceneId,
              },
            });

          if (
            sourceImages.length === 0
          ) {
            continue;
          }

          console.log(
            "SPLIT IMAGE SOURCE:",
            sourceSceneId
          );

          console.log(
            "NEW SPLIT SCENES:",
            newSceneIds.length
          );

          // =============================================
          // COPY EACH IMAGE TO EVERY NEW SPLIT SCENE
          // =============================================

          for (
            const newSceneId of newSceneIds
          ) {
            for (
              const image of sourceImages
            ) {
              await tx.generatedImage.create({
                data: {
                  prompt: image.prompt,
                  imageUrl: image.imageUrl,
                  userId: image.userId,
                  videoId: image.videoId,
                  sceneId: newSceneId,
                },
              });
            }
          }
        }

        // =================================================
        // DELETE IMAGES FOR SCENES BEING REMOVED
        //
        // This prevents orphaned GeneratedImage records.
        // =================================================

        if (
          sceneIdsToDelete.length > 0
        ) {
          await tx.generatedImage.deleteMany({
            where: {
              videoId,
              sceneId: {
                in: sceneIdsToDelete,
              },
            },
          });

          console.log(
            "DELETED SCENE IMAGES:",
            sceneIdsToDelete.length
          );
        }

        // =================================================
        // DELETE REMOVED SCENES
        // =================================================

        if (
          sceneIdsToDelete.length > 0
        ) {
          await tx.scene.deleteMany({
            where: {
              id: {
                in: sceneIdsToDelete,
              },
              videoId,
            },
          });

          console.log(
            "DELETED SCENES:",
            sceneIdsToDelete.length
          );
        }
      }
    );

    // =====================================================
    // GET FINAL SAVED SCENES
    // =====================================================

    const prismaSavedScenes =
      await prisma.scene.findMany({
        where: {
          videoId,
        },
        orderBy: {
          order: "asc",
        },
      });

    // =====================================================
    // GET FINAL GENERATED IMAGES
    // =====================================================

    const prismaImages =
      await prisma.generatedImage.findMany({
        where: {
          videoId,
          sceneId: {
            not: null,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    // =====================================================
    // CREATE IMAGE LOOKUP
    // =====================================================

    const imagesBySceneId =
      new Map<
        string,
        GeneratedImageData
      >();

    prismaImages.forEach(
      (image: GeneratedImage) => {
        if (image.sceneId) {
          imagesBySceneId.set(
            image.sceneId,
            {
              id: image.id,
              imageUrl: image.imageUrl,
              prompt: image.prompt,
              sceneId: image.sceneId,
            }
          );
        }
      }
    );

    // =====================================================
    // BUILD RESPONSE
    // =====================================================

    const scenesWithImages: SceneWithImage[] =
      prismaSavedScenes.map(
        (scene: Scene) => ({
          id: scene.id,
          order: scene.order,
          text: scene.text,
          imagePrompt:
            scene.imagePrompt,
          duration: scene.duration,
          transitionType: scene.transitionType as SceneWithImage["transitionType"],
          transitionDuration: scene.transitionDuration,
          motionOverride: scene.motionOverride ?? null,
          generatedImage:
            imagesBySceneId.get(
              scene.id
            ) ?? null,
          audioUrl: scene.audioUrl ?? null,
          audioDuration: scene.audioDuration ?? null,

          audioStartTime:
  scene.audioStartTime ?? null,

audioTrimStart:
  scene.audioTrimStart ?? 0,

audioTrimEnd:
  scene.audioTrimEnd ?? null,

audioVolume:
  scene.audioVolume ?? 1,

audioMuted:
  scene.audioMuted ?? false,
        })
      );

    console.log("================================");
    console.log("TIMELINE SAVE COMPLETE");

    console.log(
      "SCENES:",
      scenesWithImages.length
    );

    console.log(
      "IMAGES STILL CONNECTED:",
      scenesWithImages.filter(
        (scene: SceneWithImage) =>
          scene.generatedImage !== null
      ).length
    );

    console.log("================================");

    return NextResponse.json({
      success: true,
      scenes: scenesWithImages,
    });
  } catch (error) {
    console.error(
      "PUT /api/videos/[videoId]/scenes error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to save scenes",
      },
      {
        status: 500,
      }
    );
  }
}