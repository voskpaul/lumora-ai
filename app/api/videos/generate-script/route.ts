import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Scene } from "@prisma/client";

export async function POST(req: Request) {
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
    // REQUEST BODY
    // =====================================================

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid video data" },
        { status: 400 }
      );
    }

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";
    const category = body.category;
    const projectId = body.projectId;
    const format = body.format;
    const voiceType = body.voiceType;

    if (!prompt || prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be between 1 and 2,000 characters" },
        { status: 400 }
      );
    }

    if (
      category !== undefined &&
      (typeof category !== "string" || category.length > 100)
    ) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    if (
      format !== undefined &&
      format !== "shorts" &&
      format !== "youtube"
    ) {
      return NextResponse.json(
        { error: "Invalid video format" },
        { status: 400 }
      );
    }

    if (
      voiceType !== undefined &&
      (typeof voiceType !== "string" || voiceType.length > 100)
    ) {
      return NextResponse.json(
        { error: "Invalid voice type" },
        { status: 400 }
      );
    }

    if (
      projectId !== undefined &&
      projectId !== null &&
      typeof projectId !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 }
      );
    }

    const normalizedProjectId =
      typeof projectId === "string" && projectId.trim()
        ? projectId.trim()
        : null;

    // =====================================================
    // GET USER
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
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (normalizedProjectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: normalizedProjectId,
          userId: user.id,
        },
        select: { id: true },
      });

      if (!project) {
        return NextResponse.json(
          { error: "Project not found" },
          { status: 404 }
        );
      }
    }

    // =====================================================
    // GENERATE SCRIPT
    // =====================================================

    const script = generateScriptFromPrompt(
      prompt,
      category || "YouTube Shorts"
    );

    // =====================================================
    // CREATE VIDEO
    // =====================================================

    const video = await prisma.video.create({
      data: {
        title: prompt.slice(0, 80),
        prompt,
        script,
        status: "draft",
        format: format || "shorts",
        voiceType:
          voiceType || "en-US-AriaNeural",
        userId: user.id,
        projectId: normalizedProjectId,
      },
    });

    // =====================================================
    // CREATE INITIAL TIMELINE SCENES
    // =====================================================

    const scenes = [
      {
        order: 0,
        text: `Did you know that ${prompt}?`,
        imagePrompt: `Cinematic visual representing ${prompt}, attention-grabbing opening shot`,
        duration: 5,
        videoId: video.id,
      },

      {
        order: 1,
        text: `Today we're exploring ${prompt}. This topic is becoming increasingly important in the ${
          category || "YouTube Shorts"
        } space. Many experts believe it will have a significant impact in the coming years.`,
        imagePrompt: `Cinematic professional visual explaining ${prompt}, modern environment, dramatic lighting`,
        duration: 15,
        videoId: video.id,
      },

      {
        order: 2,
        text: "Follow for more AI-generated content and insights.",
        imagePrompt: `Cinematic closing shot related to ${prompt}, inspiring social media ending`,
        duration: 8,
        videoId: video.id,
      },
    ];

    // =====================================================
    // SAVE SCENES
    // =====================================================

    await prisma.scene.createMany({
      data: scenes,
    });

    console.log(
      "INITIAL SCENES CREATED:",
      scenes.length
    );

    // =====================================================
    // VERIFY SCENES IMMEDIATELY
    // =====================================================

    const savedScenes =
      await prisma.scene.findMany({
        where: {
          videoId: video.id,
        },
        orderBy: {
          order: "asc",
        },
      });

    console.log(
      "DATABASE SCENES AFTER CREATION:",
      savedScenes.length
    );

    console.log(
      "SCENE VIDEO IDS:",
      savedScenes.map(
  (scene: Scene) => scene.videoId
)
    );

    console.log(
      "================================"
    );
    console.log(
      "GENERATE SCRIPT COMPLETE"
    );
    console.log(
      "RETURNING VIDEO ID:",
      video.id
    );
    console.log(
      "RETURNING SCENES:",
      savedScenes.length
    );
    console.log(
      "================================"
    );
    console.log("");

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json({
      success: true,

      video: {
        ...video,
      },

      scenes: savedScenes,
    });
  } catch (error: unknown) {
    console.error(
      "Generate script error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to generate script",
      },
      {
        status: 500,
      }
    );
  }
}

// =====================================================
// GENERATE SCRIPT
// =====================================================

function generateScriptFromPrompt(
  prompt: string,
  category: string
) {
  return `
Hook:

Did you know that ${prompt}?



Main Content:

Today we're exploring ${prompt}.

This topic is becoming increasingly important in the ${category} space.

Many experts believe it will have a significant impact in the coming years.



Call To Action:

Follow for more AI-generated content and insights.
`.trim();
}
