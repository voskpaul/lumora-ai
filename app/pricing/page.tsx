import Link from "next/link";
import { STRIPE_PLANS } from "@/lib/stripe";

const plans = [
  {
    name: "FREE",
    price: "$0",
    credits: STRIPE_PLANS.FREE.credits,
    description: "Perfect for getting started.",
    buttonText: "Current Plan",
    disabled: true,
  },

  {
    name: "PRO",
    price: "$19/mo",
    credits: STRIPE_PLANS.PRO.credits,
    description:
      "For creators producing videos regularly.",
    buttonText: "Upgrade to Pro",
    priceId: STRIPE_PLANS.PRO.priceId,
  },

  {
    name: "CREATOR",
    price: "$49/mo",
    credits: STRIPE_PLANS.CREATOR.credits,
    description:
      "For agencies and power users.",
    buttonText: "Upgrade to Creator",
    priceId: STRIPE_PLANS.CREATOR.priceId,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#030712] px-6 py-20 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h1 className="text-5xl font-bold">
            Pricing
          </h1>

          <p className="mt-4 text-white/60">
            Choose a plan that fits your
            content creation needs.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
            >
              <h2 className="text-2xl font-bold">
                {plan.name}
              </h2>

              <p className="mt-4 text-4xl font-bold">
                {plan.price}
              </p>

              <p className="mt-2 text-white/60">
                {plan.description}
              </p>

              <div className="mt-8">
                <p className="text-lg">
                  {plan.credits.toLocaleString()}{" "}
                  monthly credits
                </p>
              </div>

              <div className="mt-auto pt-10">
                {plan.disabled ? (
                  <button
                    disabled
                    className="w-full rounded-2xl border border-white/10 px-6 py-3 text-white/40"
                  >
                    {plan.buttonText}
                  </button>
                ) : (
                  <form
                    action="/api/stripe/create-checkout-session"
                    method="POST"
                  >
                    <input
                      type="hidden"
                      name="priceId"
                      value={plan.priceId || ""}
                    />

                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-linear-to-r from-violet-500 to-cyan-500 px-6 py-3 font-medium transition hover:opacity-90"
                    >
                      {plan.buttonText}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/dashboard"
            className="text-cyan-400 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}