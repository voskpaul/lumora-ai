import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import axios from "axios";
import sharp from "sharp";

interface RouteContext {
  params: Promise<{
    videoId: string;
    sceneId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
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

    const { videoId, sceneId } = await params;

    // =====================================================
    // READ REQUEST BODY
    // =====================================================

    const body = await request.json().catch(() => ({}));

    // =====================================================
    // FIND USER
    // =====================================================

    const user = await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // =====================================================
    // VERIFY SCENE BELONGS TO THIS VIDEO + USER
    // =====================================================

    const scene = await prisma.scene.findFirst({
      where: {
        id: sceneId,
        videoId,
        video: {
          userId: user.id,
        },
      },
      select: {
        id: true,
        videoId: true,
        imagePrompt: true,
      },
    });

    if (!scene) {
      return NextResponse.json(
        { error: "Scene not found" },
        { status: 404 }
      );
    }

    // =====================================================
    // GET IMAGE PROMPT
    // =====================================================

    const imagePrompt =
      typeof body.imagePrompt === "string" &&
      body.imagePrompt.trim()
        ? body.imagePrompt.trim()
        : scene.imagePrompt.trim();

    if (!imagePrompt) {
      return NextResponse.json(
        { error: "Image prompt is required" },
        { status: 400 }
      );
    }

    // =====================================================
    // IMAGE DIRECTORY
    // =====================================================

    const imageDir = path.join(
      process.cwd(),
      "public",
      "images",
      scene.videoId
    );

    fs.mkdirSync(imageDir, {
      recursive: true,
    });

    // =====================================================
    // POLLINATIONS IMAGE URL
    // =====================================================

    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        imagePrompt
      )}?model=flux&width=1080&height=1920`;

    console.log("================================");
    console.log("SCENE IMAGE GENERATION STARTED");
    console.log("VIDEO ID:", videoId);
    console.log("SCENE ID:", sceneId);
    console.log("PROMPT:", imagePrompt);
    console.log("================================");

    // =====================================================
    // DOWNLOAD IMAGE
    // =====================================================

    const response = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 180000,
    });

    if (!response.data) {
      throw new Error(
        "Image generation returned no image data."
      );
    }

    // =====================================================
    // SAVE IMAGE
    // =====================================================

    const filename =
      `scene-${scene.id}-${Date.now()}.jpg`;

    const filepath = path.join(
      imageDir,
      filename
    );

    // =====================================================
    // NORMALIZE IMAGE
    // =====================================================

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

    // =====================================================
    // VERIFY IMAGE
    // =====================================================

    const metadata =
      await sharp(filepath).metadata();

    if (
      !metadata.width ||
      !metadata.height
    ) {
      throw new Error(
        "Generated image could not be verified."
      );
    }

    // =====================================================
    // PUBLIC IMAGE URL
    // =====================================================

    const publicImageUrl =
      `/images/${scene.videoId}/${filename}`;

    // =====================================================
    // FIND EXISTING SCENE IMAGE
    // =====================================================

    const existingImage =
      await prisma.generatedImage.findFirst({
        where: {
          sceneId: scene.id,
          videoId: scene.videoId,
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    // =====================================================
    // UPDATE EXISTING IMAGE
    // OR CREATE FIRST IMAGE
    // =====================================================

    let savedImage;

    if (existingImage) {
      savedImage =
        await prisma.generatedImage.update({
          where: {
            id: existingImage.id,
          },
          data: {
            prompt: imagePrompt,
            imageUrl: publicImageUrl,
          },
        });
    } else {
      savedImage =
        await prisma.generatedImage.create({
          data: {
            prompt: imagePrompt,
            imageUrl: publicImageUrl,
            userId: user.id,
            videoId: scene.videoId,
            sceneId: scene.id,
          },
        });
    }

    // =====================================================
    // KEEP SCENE PROMPT IN SYNC
    // =====================================================

    if (
      imagePrompt !== scene.imagePrompt
    ) {
      await prisma.scene.update({
        where: {
          id: scene.id,
        },
        data: {
          imagePrompt,
        },
      });
    }

    // =====================================================
    // SUCCESS
    // =====================================================

    console.log(
      "SCENE IMAGE READY:",
      publicImageUrl
    );

    console.log(
      "IMAGE ID:",
      savedImage.id
    );

    console.log("================================");

    return NextResponse.json({
      success: true,
      sceneId: scene.id,
      image: {
        id: savedImage.id,
        imageUrl: savedImage.imageUrl,
        prompt: savedImage.prompt,
        sceneId: savedImage.sceneId,
      },
    });
  } catch (error: unknown) {
    console.error(
      "Scene image generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate scene image",
      },
      {
        status: 500,
      }
    );
  }
}