import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStripe } from "@/lib/stripe";
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

    const body = await req.formData();

const priceId = body.get("priceId") as string;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID required" },
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

    const checkoutSession =
      await getStripe().checkout.sessions.create({
        mode: "subscription",

        payment_method_types: ["card"],

        customer_email: user.email,

        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],

        metadata: {
          userId: user.id,
        },

        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,

        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      });

    return NextResponse.redirect(checkoutSession.url!);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Failed to create checkout session",
      },
      {
        status: 500,
      }
    );
  }
}
