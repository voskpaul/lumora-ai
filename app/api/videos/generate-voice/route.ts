import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateEdgeVoice } from "@/lib/tts/edge";

import path from "path";
import fs from "fs";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const {
      videoId,
      voiceType,
    } = await request.json();

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
      include: {
        subscriptions: true,
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

    const updatedVideo = await prisma.video.update({
      where: {
        id: video.id,
      },
      data: {
        voiceType: voiceType || video.voiceType,
      },
    });

    if (!updatedVideo.script) {
      return NextResponse.json(
        {
          error:
            "Generate a script before generating voice.",
        },
        { status: 400 }
      );
    }

    console.log("🎤 Generating Edge TTS...");

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

    console.log(video.script);
    console.log(video.script.length);
    console.log(
      "VOICE SELECTED:",
      voiceType
    );

    console.log("VOICE FROM DB:", updatedVideo.voiceType);

    await generateEdgeVoice(
  updatedVideo.script!,
  voiceDir,
  updatedVideo.voiceType || "en-US-AriaNeural"
);

    const voiceUrl =
      `/voices/${video.id}/audio.mp3`;

    console.log(
      "✅ Edge TTS voice generated successfully"
    );

    await prisma.video.update({
      where: {
        id: video.id,
      },
      data: {
        voiceUrl,
      },
    });

    return NextResponse.json({
      success: true,
      voiceUrl,
    });
  } catch (error: any) {
    console.error(
      "Voice generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Failed to generate voice",
      },
      {
        status: 500,
      }
    );
  }
}