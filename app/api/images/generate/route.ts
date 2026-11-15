import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid image request" },
        { status: 400 }
      );
    }

    const prompt =
      typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be 2,000 characters or fewer" },
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
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    const enhancedPrompt = `${prompt}, cinematic lighting, ultra detailed, 4k quality, professional composition`;

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt
    )}?model=flux&width=1024&height=1024&seed=${Date.now()}`;

    const image =
      await prisma.generatedImage.create({
        data: {
          prompt,
          imageUrl,
          userId: user.id,
        },
      });

    return NextResponse.json({
      success: true,
      image,
    });
  } catch (error) {
    console.error(
      "Image generation error:",
      error
    );

    return NextResponse.json(
      { error: "Image generation failed" },
      { status: 500 }
    );
  }
}
