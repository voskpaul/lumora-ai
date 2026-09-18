import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    videoId: string;
  }>;
}

// =====================================================
// DELETE VIDEO
// =====================================================

export async function DELETE(
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
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // =====================================================
    // VERIFY VIDEO OWNERSHIP
    // =====================================================

    const video = await prisma.video.findFirst({
      where: {
        id: videoId,
        userId: user.id,
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
    // DELETE RELATED SCENES
    // =====================================================

    await prisma.scene.deleteMany({
      where: {
        videoId,
      },
    });

    // =====================================================
    // DELETE GENERATED IMAGES
    // =====================================================

    await prisma.generatedImage.deleteMany({
      where: {
        videoId,
      },
    });

    // =====================================================
    // DELETE VIDEO
    // =====================================================

    await prisma.video.delete({
      where: {
        id: videoId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/videos/[videoId] error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to delete video",
      },
      {
        status: 500,
      }
    );
  }
}