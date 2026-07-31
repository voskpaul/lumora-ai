import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "Missing STRIPE_SECRET_KEY environment variable"
  );
}

export const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  }
);

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