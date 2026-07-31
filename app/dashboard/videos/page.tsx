import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import VideosClient from "./videos-client";

export default async function VideosPage() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  const [videos, projects] = await Promise.all([
    prisma.video.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.project.findMany({
      where: {
        user: {
          email: session.user.email,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
      },
    }),
  ]);

  return (
    <div className="p-8">
      <h1 className="mb-8 text-3xl font-bold">
        Videos
      </h1>

      <VideosClient
        initialVideos={videos}
        projects={projects}
      />
    </div>
  );
}