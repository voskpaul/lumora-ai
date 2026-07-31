"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

const creditPacks = [
  {
    pack: "starter",
    credits: 500,
    price: "$9",
  },
  {
    pack: "pro",
    credits: 1000,
    price: "$15",
  },
  {
    pack: "creator",
    credits: 2500,
    price: "$30",
  },
];

interface BuyCreditsCardProps {
  currentCredits: number;
}

export default function BuyCreditsCard({
  currentCredits,
}: BuyCreditsCardProps) {
  const [loading, setLoading] =
    useState<string | null>(null);

  const searchParams =
    useSearchParams();

  const router = useRouter();

  useEffect(() => {
    if (
      searchParams.get("credits") ===
      "true"
    ) {
      toast.success(
        "Credits added successfully!"
      );

      router.refresh();
    }
  }, [searchParams, router]);

  const buyCredits = async (
    pack: string
  ) => {
    try {
      setLoading(pack);

      const res = await fetch(
        "/api/stripe/buy-credits",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            pack,
          }),
        }
      );

      const data =
        await res.json();

      if (!res.ok) {
        toast.error(
          data.error ||
            "Checkout failed"
        );
        return;
      }

      window.location.href =
        data.url;
    } catch {
      toast.error(
        "Something went wrong"
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Buy Credits
          </h2>

          <p className="text-white/60">
            Need more generations?
          </p>
        </div>

        <div className="rounded-2xl bg-cyan-500/10 px-4 py-3">
          <p className="text-sm text-white/60">
            Current Credits
          </p>

          <p className="text-xl font-bold text-cyan-400">
            {currentCredits.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {creditPacks.map((pack) => (
          <button
            key={pack.pack}
            onClick={() =>
              buyCredits(pack.pack)
            }
            disabled={
              loading === pack.pack
            }
            className="rounded-2xl border border-cyan-500 p-5 text-left transition hover:bg-cyan-500/10"
          >
            <div className="text-2xl font-bold text-cyan-400">
              {pack.credits}
            </div>

            <div className="mt-2 text-white/70">
              Credits
            </div>

            <div className="mt-4 text-xl font-semibold">
              {loading === pack.pack
                ? "Loading..."
                : pack.price}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}