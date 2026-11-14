import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!id.trim()) {
      return NextResponse.json(
        { error: "Image ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const deleted = await prisma.generatedImage.deleteMany({
      where: {
        id,
        userId: user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
