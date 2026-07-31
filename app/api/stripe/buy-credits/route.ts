import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

const CREDIT_PACKS: Record<
  string,
  {
    credits: number;
    amount: number;
  }
> = {
  starter: {
    credits: 500,
    amount: 900, // $9.00
  },

  pro: {
    credits: 1000,
    amount: 1500, // $15.00
  },

  creator: {
    credits: 2500,
    amount: 3000, // $30.00
  },
};

export async function POST(
  req: Request
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

    const { pack } =
      await req.json();

    const selectedPack =
      CREDIT_PACKS[pack];

    if (!selectedPack) {
      return NextResponse.json(
        {
          error:
            "Invalid credit pack",
        },
        {
          status: 400,
        }
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
        {
          status: 404,
        }
      );
    }

    const checkoutSession =
      await stripe.checkout.sessions.create(
        {
          mode: "payment",

          payment_method_types: [
            "card",
          ],

          customer_email:
            user.email,

          line_items: [
            {
              price_data: {
                currency:
                  "usd",

                product_data: {
                  name: `${selectedPack.credits} Credits`,
                },

                unit_amount:
                  selectedPack.amount,
              },

              quantity: 1,
            },
          ],

          metadata: {
            type: "credits",

            userId: user.id,

            credits:
              selectedPack.credits.toString(),
          },

          success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits=true`,

          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits=canceled`,
        }
      );

    return NextResponse.json({
      url: checkoutSession.url,
    });
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