import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Usage } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
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

    const startOfMonth = new Date();

    startOfMonth.setDate(1);

    startOfMonth.setHours(
      0,
      0,
      0,
      0
    );

    const videosGenerated =
      await prisma.video.count({
        where: {
          userId: user.id,

          createdAt: {
            gte: startOfMonth,
          },
        },
      });

    const usage =
      await prisma.usage.findMany({
        where: {
          userId: user.id,

          createdAt: {
            gte: startOfMonth,
          },
        },
      });

    const creditsUsed = usage
      .filter(
        (u: Usage) =>
          u.action ===
          "video_generation"
      )
      .reduce(
        (
          sum: number,
          u: Usage
        ) =>
          sum +
          Math.abs(u.credits),
        0
      );

    const creditsPurchased =
      usage
        .filter(
          (u: Usage) =>
            u.action ===
            "credit_purchase"
        )
        .reduce(
          (
            sum: number,
            u: Usage
          ) =>
            sum + u.credits,
          0
        );

    return NextResponse.json({
      videosGenerated,

      creditsUsed,

      creditsPurchased,

      currentCredits:
        user.subscriptions
          ?.credits ?? 0,

      plan:
        user.subscriptions
          ?.plan ?? "FREE",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to load analytics",
      },
      {
        status: 500,
      }
    );
  }
}