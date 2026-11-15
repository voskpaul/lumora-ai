import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.text();

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  if (!signature) {
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let stripe: Stripe;

  try {
    stripe = getStripe();
  } catch (error) {
    console.error("Stripe configuration error:", error);

    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env
        .STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error(
      "Webhook signature verification failed:",
      error
    );

    return NextResponse.json(
      {
        error: "Invalid signature",
      },
      {
        status: 400,
      }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session =
          event.data.object as Stripe.Checkout.Session;

        const userId =
          session.metadata?.userId;

        if (!userId) {
          console.error(
            "No userId found in metadata"
          );
          break;
        }

        /*
         * CREDIT PURCHASES
         */
        if (
          session.metadata?.type ===
          "credits"
        ) {
          const credits =
            Number(
              session.metadata.credits
            ) || 0;

          await prisma.subscription.update(
            {
              where: {
                userId,
              },

              data: {
                credits: {
                  increment:
                    credits,
                },
              },
            }
          );

          await prisma.usage.create({
  data: {
    userId,
    action: "credit_purchase",
    credits,
  },
});

          break;
        }

        /*
         * SUBSCRIPTIONS
         */
        const lineItems =
          await stripe.checkout.sessions.listLineItems(
            session.id
          );

        const priceId =
          lineItems.data[0]?.price?.id;

        let plan = "FREE";
        let credits = 100;

        if (
          priceId ===
          process.env
            .STRIPE_PRO_PRICE_ID
        ) {
          plan = "PRO";
          credits = 1000;
        }

        if (
          priceId ===
          process.env
            .STRIPE_CREATOR_PRICE_ID
        ) {
          plan = "CREATOR";
          credits = 5000;
        }

        const stripeCustomerId =
  session.customer?.toString();

const stripeSubscriptionId =
  session.subscription?.toString();

await prisma.subscription.upsert({
  where: {
    userId,
  },

  update: {
    plan,
    credits,
  },

  create: {
    userId,
    plan,
    credits,
  },
});

await prisma.usage.create({
  data: {
    userId,
    action: `PLAN_${plan}`,
    credits,
  },
});

await prisma.usage.create({
  data: {
    userId,
    action: "CREDIT_PURCHASE",
    credits,
  },
});

await prisma.user.update({
  where: {
    id: userId,
  },

  data: {
    stripeCustomerId,
    stripeSubscriptionId,
  },
});


        break;
      }

      default:
        console.log(
          `Unhandled event type: ${event.type}`
        );
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error(
      "Webhook processing error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Webhook processing failed",
      },
      {
        status: 500,
      }
    );
  }
}
