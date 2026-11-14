import "server-only";

import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Stripe is not configured: STRIPE_SECRET_KEY is missing."
    );
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2026-04-22.dahlia",
      typescript: true,
    });
  }

  return stripeClient;
}

export const STRIPE_PLANS = {
  FREE: {
    name: "Free",
    credits: 100,
    priceId: null,
  },

  PRO: {
    name: "Pro",
    credits: 1000,
    priceId:
      process.env.STRIPE_PRO_PRICE_ID!,
  },

  CREATOR: {
    name: "Creator",
    credits: 5000,
    priceId:
      process.env
        .STRIPE_CREATOR_PRICE_ID!,
  },
};
