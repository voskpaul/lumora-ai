import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateEdgeVoice } from "@/lib/tts/edge";

import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  let videoId: string | null = null;

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    videoId = body.videoId;

    const voiceType = body.voiceType;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

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

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: user.id,
      },
    });

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
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
    // REQUIRE IMAGES
    // =====================================================

    const imageCount =
      await prisma.generatedImage.count({
        where: {
          videoId: video.id,
          userId: user.id,
        },
      });

    if (imageCount === 0) {
      return NextResponse.json(
        {
          error:
            "Generate images before generating voice.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // REQUIRE SCRIPT
    // =====================================================

    if (!video.script) {
      return NextResponse.json(
        {
          error:
            "Generate a script before generating voice.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // SELECT VOICE
    // =====================================================

    const selectedVoice =
      voiceType ||
      video.voiceType ||
      "en-US-AriaNeural";

    // =====================================================
    // MARK VOICE GENERATION AS STARTED
    // =====================================================

    await prisma.video.update({
      where: {
        id: video.id,
      },
      data: {
        voiceType: selectedVoice,
        status: "generating_voice",
      },
    });

    console.log("================================");
    console.log(
      "🎤 VOICE GENERATION STARTED"
    );
    console.log("VIDEO ID:", video.id);
    console.log(
      "VOICE:",
      selectedVoice
    );
    console.log(
      "STATUS: generating_voice"
    );
    console.log("================================");

    // =====================================================
    // VOICE DIRECTORY
    // =====================================================

    const voiceDir = path.join(
      process.cwd(),
      "public",
      "voices",
      video.id
    );

    if (!fs.existsSync(voiceDir)) {
      fs.mkdirSync(voiceDir, {
        recursive: true,
      });
    }

    console.log(
      "SCRIPT LENGTH:",
      video.script.length
    );

    // =====================================================
    // GENERATE EDGE TTS
    // =====================================================

    await generateEdgeVoice(
      video.script,
      voiceDir,
      selectedVoice
    );

    // =====================================================
    // VERIFY VOICE FILE
    // =====================================================

    const voiceUrl =
      `/voices/${video.id}/audio.mp3`;

    const voicePath = path.join(
      process.cwd(),
      "public",
      voiceUrl.replace(/^\/+/, "")
    );

    if (!fs.existsSync(voicePath)) {
      throw new Error(
        `Voice generation completed but file was not found: ${voicePath}`
      );
    }

    console.log(
      "✅ Edge TTS voice generated successfully"
    );

    console.log(
      "VOICE FILE:",
      voicePath
    );

    // =====================================================
    // MARK VOICE GENERATION COMPLETE
    // =====================================================

    const updatedVideo =
      await prisma.video.update({
        where: {
          id: video.id,
        },
        data: {
          voiceUrl,
          status: "voice_ready",
        },
      });

    console.log("================================");
    console.log(
      "🎤 VOICE GENERATION COMPLETE"
    );
    console.log(
      "STATUS:",
      updatedVideo.status
    );
    console.log("================================");

    return NextResponse.json({
      success: true,
      voiceUrl,
      status: updatedVideo.status,
    });
  } catch (error: unknown) {
    console.error("Voice generation error:", error);

    // =====================================================
    // MARK VOICE GENERATION AS FAILED
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
        "Failed to update voice failure status:",
        statusError
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate voice",
      },
      {
        status: 500,
      }
    );
  }
}
