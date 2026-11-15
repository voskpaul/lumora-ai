import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const videos =
      await prisma.video.findMany({
        where: {
          user: {
            email:
              session.user.email,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return NextResponse.json(
      videos
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Failed to fetch videos",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request
) {
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
        { error: "Invalid video data" },
        { status: 400 }
      );
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const script =
      typeof body.script === "string" ? body.script : null;

    if (
      !title ||
      title.length > 120 ||
      !prompt ||
      prompt.length > 2000 ||
      (body.script !== undefined && body.script !== null && typeof body.script !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid video data" },
        { status: 400 }
      );
    }

    const user =
      await prisma.user.findUnique({
        where: {
          email:
            session.user.email,
        },
      });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "User not found",
        },
        { status: 404 }
      );
    }

    const video =
      await prisma.video.create({
        data: {
          title,
          prompt,
          script,
          status: "draft",
          userId: user.id,
        },
      });

    return NextResponse.json(
      video
    );
  } catch {
    return NextResponse.json(
      {
        error:
          "Failed to create video",
      },
      { status: 500 }
    );
  }
}
