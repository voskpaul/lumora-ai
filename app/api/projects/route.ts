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

    const projects = await prisma.project.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(projects);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

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
        { error: "Invalid project data" },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === "string"
        ? body.title.trim()
        : "";
    const rawDescription = body.description;

    if (!title || title.length > 120) {
      return NextResponse.json(
        { error: "Project title must be between 1 and 120 characters" },
        { status: 400 }
      );
    }

    if (
      rawDescription !== undefined &&
      rawDescription !== null &&
      typeof rawDescription !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid project description" },
        { status: 400 }
      );
    }

    const description =
      typeof rawDescription === "string"
        ? rawDescription.trim()
        : null;

    if (description && description.length > 2000) {
      return NextResponse.json(
        { error: "Project description is too long" },
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

    const project = await prisma.project.create({
      data: {
        title,
        description,
        userId: user.id,
      },
    });

    return NextResponse.json(project);
  } catch {
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
