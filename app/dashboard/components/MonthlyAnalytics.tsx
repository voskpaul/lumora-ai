"use client";

import { useEffect, useState } from "react";

interface Analytics {
  videosGenerated: number;
  creditsUsed: number;
  creditsPurchased: number;
  currentCredits: number;
  plan: string;
}

export default function MonthlyAnalytics() {
  const [data, setData] =
    useState<Analytics | null>(
      null
    );

  useEffect(() => {
    fetch(
      "/api/analytics/monthly"
    )
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-6 text-2xl font-bold">
        Monthly Analytics
      </h2>

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-white/60">
            Videos
          </p>

          <h3 className="text-3xl font-bold">
            {
              data.videosGenerated
            }
          </h3>
        </div>

        <div>
          <p className="text-white/60">
            Credits Used
          </p>

          <h3 className="text-3xl font-bold text-red-400">
            {
              data.creditsUsed
            }
          </h3>
        </div>

        <div>
          <p className="text-white/60">
            Credits Purchased
          </p>

          <h3 className="text-3xl font-bold text-green-400">
            {
              data.creditsPurchased
            }
          </h3>
        </div>

        <div>
          <p className="text-white/60">
            Current Balance
          </p>

          <h3 className="text-3xl font-bold text-cyan-400">
            {
              data.currentCredits
            }
          </h3>
        </div>
      </div>
    </div>
  );
}