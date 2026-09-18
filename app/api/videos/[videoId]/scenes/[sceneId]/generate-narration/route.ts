import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateEdgeVoice } from "@/lib/tts/edge";
import ffmpeg from "@/lib/ffmpeg";
import path from "path";
import fs from "fs";

interface RouteContext {
  params: Promise<{
    videoId: string;
    sceneId: string;
  }>;
}

function probeDuration(file: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(file, (error, data) => {
      if (error) {
        reject(error);
        return;
      }

      const duration = Number(data.format.duration);

      if (!Number.isFinite(duration) || duration <= 0) {
        reject(
          new Error(
            `Invalid audio duration: ${data.format.duration}`
          )
        );
        return;
      }

      resolve(duration);
    });
  });
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    // =====================================================
    // AUTH
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
    // PARAMS
    // =====================================================

    const { videoId, sceneId } = await params;

    console.log("================================");
    console.log("SCENE NARRATION GENERATION");
    console.log("VIDEO ID:", videoId);
    console.log("SCENE ID:", sceneId);
    console.log("================================");

    // =====================================================
    // BODY
    // =====================================================

    const body = await request.json().catch(() => ({}));

    // =====================================================
    // GET USER
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
        {
          error: "User not found",
        },
        {
          status: 404,
        }
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
        text: true,
        video: {
          select: {
            voiceType: true,
          },
        },
      },
    });

    if (!scene) {
      return NextResponse.json(
        {
          error: "Scene not found",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // NARRATION TEXT
    // =====================================================

    const narration =
      typeof body.text === "string" &&
      body.text.trim()
        ? body.text.trim()
        : scene.text.trim();

    if (!narration) {
      return NextResponse.json(
        {
          error: "Scene narration is required",
        },
        {
          status: 400,
        }
      );
    }

    // =====================================================
    // VOICE
    // =====================================================

    const selectedVoice =
      typeof body.voiceType === "string" &&
      body.voiceType.trim()
        ? body.voiceType.trim()
        : scene.video.voiceType ||
          "en-US-AriaNeural";

    // =====================================================
    // SCENE AUDIO DIRECTORY
    // =====================================================

    const sceneVoiceDir = path.join(
      process.cwd(),
      "public",
      "voices",
      scene.videoId,
      "scenes",
      scene.id
    );

    fs.mkdirSync(sceneVoiceDir, {
      recursive: true,
    });

    console.log("VOICE:", selectedVoice);
    console.log(
      "TEXT:",
      narration
    );
    console.log(
      "AUDIO DIRECTORY:",
      sceneVoiceDir
    );

    // =====================================================
    // GENERATE EDGE TTS
    // =====================================================

    await generateEdgeVoice(
      narration,
      sceneVoiceDir,
      selectedVoice
    );

    // =====================================================
    // VERIFY AUDIO FILE
    // =====================================================

    const audioPath = path.join(
      sceneVoiceDir,
      "audio.mp3"
    );

    if (!fs.existsSync(audioPath)) {
      throw new Error(
        `Scene narration was generated but file was not found: ${audioPath}`
      );
    }

    // =====================================================
    // PROBE AUDIO DURATION
    // =====================================================

    const audioDuration =
      await probeDuration(audioPath);

    const audioUrl =
      `/voices/${scene.videoId}/scenes/${scene.id}/audio.mp3`;

    // =====================================================
    // SAVE TO SCENE
    // =====================================================

    const updatedScene =
      await prisma.scene.update({
        where: {
          id: scene.id,
        },
        data: {
          audioUrl,
          audioDuration,
          ...(narration !== scene.text.trim()
            ? {
                text: narration,
              }
            : {}),
        },
        select: {
          id: true,
          text: true,
          audioUrl: true,
          audioDuration: true,
        },
      });

    // =====================================================
    // SUCCESS
    // =====================================================

    console.log("================================");
    console.log(
      "SCENE NARRATION READY"
    );
    console.log(
      "AUDIO URL:",
      updatedScene.audioUrl
    );
    console.log(
      "AUDIO DURATION:",
      updatedScene.audioDuration
    );
    console.log("================================");

    return NextResponse.json({
      success: true,
      sceneId: updatedScene.id,
      text: updatedScene.text,
      audioUrl: updatedScene.audioUrl,
      audioDuration:
        updatedScene.audioDuration,
      voiceType: selectedVoice,
    });
  } catch (error: unknown) {
    console.error(
      "Scene narration generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate scene narration",
      },
      {
        status: 500,
      }
    );
  }
}