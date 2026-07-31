import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_GENERATION_COST } from "@/lib/credits";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { prompt, projectId } =
      await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Prompt required" },
        { status: 400 }
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

    /*
     * Subscription checks
     */
    const subscription =
      user.subscriptions;

    const plan =
      subscription?.plan ?? "FREE";

    const credits =
      subscription?.credits ?? 100;

    /*
     * Credit enforcement
     */
    if (
      credits <
      VIDEO_GENERATION_COST
    ) {
      return NextResponse.json(
        {
          error:
            "You don't have enough credits. Please upgrade your plan.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Monthly limits
     */
    const limits: Record<
      string,
      number
    > = {
      FREE: 25,
      PRO: 500,
      CREATOR: Number.MAX_SAFE_INTEGER,
    };

    const monthlyLimit =
      limits[plan.toUpperCase()] ??
      25;

    const startOfMonth =
      new Date();

    startOfMonth.setDate(1);

    startOfMonth.setHours(
      0,
      0,
      0,
      0
    );

    const videosThisMonth =
      await prisma.video.count({
        where: {
          userId: user.id,

          createdAt: {
            gte: startOfMonth,
          },
        },
      });

    if (
      videosThisMonth >=
      monthlyLimit
    ) {
      return NextResponse.json(
        {
          error: `You have reached your ${plan} plan limit (${monthlyLimit} videos/month). Please upgrade to continue.`,
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Create video
     */
    const video =
      await prisma.video.create({
        data: {
          title: prompt
            .trim()
            .slice(0, 40),

          prompt:
            prompt.trim(),

          status:
            "processing",

          userId: user.id,

          projectId:
            projectId ||
            null,
        },
      });

/*
 * Deduct credits
 */
if (subscription) {
  console.log(
    "SUBSCRIPTION:",
    subscription
  );

  console.log(
    "Deducting credits from user:",
    user.id
  );

  console.log(
    "Credits before deduction:",
    subscription.credits
  );

  await prisma.subscription.update({
    where: {
      userId: user.id,
    },

    data: {
      credits: {
        decrement:
          VIDEO_GENERATION_COST,
      },
    },
  });

  console.log(
    "Credits deducted successfully"
  );
}

    return NextResponse.json(
      {
        success: true,

        video,

        usage: {
          plan,

          used:
            videosThisMonth +
            1,

          limit:
            monthlyLimit ===
            Number.MAX_SAFE_INTEGER
              ? "Unlimited"
              : monthlyLimit,

          remainingVideos:
            monthlyLimit ===
            Number.MAX_SAFE_INTEGER
              ? "Unlimited"
              : monthlyLimit -
                (videosThisMonth +
                  1),

          creditsRemaining:
            credits -
            VIDEO_GENERATION_COST,

          creditsUsed:
            VIDEO_GENERATION_COST,
        },
      },

      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Generate video error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Something went wrong",
      },

      {
        status: 500,
      }
    );
  }
}