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

    const { prompt } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        {
          error: "Prompt is required",
        },
        {
          status: 400,
        }
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
  } catch (error: any) {
    console.error(
      "Image generation error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Image generation failed",
      },
      {
        status: 500,
      }
    );
  }
}