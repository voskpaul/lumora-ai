import MonthlyAnalytics from "./components/MonthlyAnalytics";
import { LogOut } from "lucide-react";
import type { Video } from "@prisma/client";

import type { ComponentType } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

import VideosClient from "./videos/videos-client";
import BuyCreditsCard from "./components/BuyCreditsCard";

const BuyCreditsCardWithCredits = BuyCreditsCard as ComponentType<{
  currentCredits: number;
}>;

const VideosClientWithProps =
  VideosClient as ComponentType<{
    initialVideos: Video[];
    projects: { id: string; title: string }[];
  }>;

type AuthSession = {
  user?: {
    email?: string;
  };
} | null;

export default async function DashboardPage() {
  const session = (await auth()) as AuthSession;

  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
    include: {
      videos: {
        orderBy: {
          createdAt: "desc",
        },
      },
      projects: {
        orderBy: {
          createdAt: "desc",
        },
      },
      subscriptions: true,
    },
  });

  return (
    <div className="min-h-screen bg-[#030712] p-8 text-white">
      {/* Top Bar */}
      <div className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Welcome back 👋
          </h1>

          <p className="mt-3 text-white/60">
            Logged in as {session.user.email}
          </p>
        </div>

        <form
          action={async () => {
            "use server";

            await signOut({
              redirectTo: "/login",
            });
          }}
        >
          <button className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 transition hover:bg-white/10">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </form>
      </div>

      {/* Buy Credits */}
      <div className="mb-8 relative z-50">
        <BuyCreditsCardWithCredits
          currentCredits={
            user?.subscriptions?.credits ?? 0
          }
        />
      </div>

      <MonthlyAnalytics />

      {/* Videos Dashboard */}
      <VideosClientWithProps
        initialVideos={
          user?.videos?.map((video: Video) => ({
            ...video,
            prompt: video.prompt ?? "",
          })) ?? []
        }
        projects={
          user?.projects?.map(
  (project: { id: string; title: string }) => ({
            id: project.id,
            title: project.title,
          })) ?? []
        }
      />
    </div>
  );
}