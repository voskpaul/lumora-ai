import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Usage } from "@prisma/client";

type AuthSession = {
  user?: {
    email?: string;
  };
} | null;

export default async function UsagePage() {
  const session = (await auth()) as AuthSession;

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  if (!user) {
    redirect("/dashboard");
  }

  const usage = await prisma.usage.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-[#030712] p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            Usage History
          </h1>

          <p className="mt-3 text-white/60">
            Track credit purchases and video generation activity.
          </p>
        </div>

        {usage.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/60">
            No usage records found.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-5 text-left">
                    Date
                  </th>

                  <th className="p-5 text-left">
                    Action
                  </th>

                  <th className="p-5 text-left">
                    Credits
                  </th>
                </tr>
              </thead>

              <tbody>
                {usage.map((item: any) => (
                  <tr
                    key={item.id}
                    className="border-b border-white/10"
                  >
                    <td className="p-5 text-white/70">
                      {new Date(
                        item.createdAt
                      ).toLocaleString()}
                    </td>

                    <td className="p-5">
                      {item.action ===
                      "video_generation"
                        ? "🎬 Video Generation"
                        : item.action ===
                          "credit_purchase"
                        ? "💳 Credit Purchase"
                        : item.action}
                    </td>

                    <td
                      className={`p-5 font-semibold ${
                        item.credits > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {item.credits > 0
                        ? `+${item.credits}`
                        : item.credits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}