import { redirect } from "next/navigation";
import {
  CreditCard,
  Sparkles,
  Coins,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import ManageSubscriptionButton from "../components/ManageSubscriptionButton";

type AuthSession = {
  user?: {
    email?: string;
  };
} | null;

export default async function BillingPage() {
  const session =
    (await auth()) as AuthSession;

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        email: session.user.email,
      },
      include: {
        subscriptions: true,
      },
    });

  const plan =
    user?.subscriptions?.plan ??
    "FREE";

  const credits =
    user?.subscriptions?.credits ??
    100;

  return (
    <div className="min-h-screen bg-[#030712] p-8 text-white">
      <div className="mx-auto max-w-5xl">

        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            Billing
          </h1>

          <p className="mt-3 text-white/60">
            Manage your subscription and credits.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <Sparkles className="mb-4 h-8 w-8 text-yellow-400" />

            <h3 className="text-3xl font-bold">
              {plan}
            </h3>

            <p className="mt-2 text-white/60">
              Current Plan
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <Coins className="mb-4 h-8 w-8 text-cyan-400" />

            <h3 className="text-3xl font-bold">
              {credits.toLocaleString()}
            </h3>

            <p className="mt-2 text-white/60">
              Available Credits
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
            <CreditCard className="mb-4 h-8 w-8 text-violet-400" />

            <h3 className="text-3xl font-bold">
              Active
            </h3>

            <p className="mt-2 text-white/60">
              Subscription Status
            </p>
          </div>

        </div>

        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="text-2xl font-bold">
            Subscription Details
          </h2>

          <div className="mt-6 space-y-4">

            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-white/60">
                Plan
              </span>

              <span>
                {plan}
              </span>
            </div>

            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-white/60">
                Credits Remaining
              </span>

              <span>
                {credits.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-b border-white/10 pb-3">
              <span className="text-white/60">
                Status
              </span>

              <span className="text-green-400">
                Active
              </span>
            </div>

          </div>

          <div className="mt-8">
            <ManageSubscriptionButton />
          </div>

        </div>

      </div>
    </div>
  );
}