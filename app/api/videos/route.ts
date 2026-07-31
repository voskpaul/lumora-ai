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

    const {
      title,
      prompt,
      script,
    } = await req.json();

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