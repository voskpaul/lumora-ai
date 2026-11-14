import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Video } from "@prisma/client";
import { notFound, redirect } from "next/navigation";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    redirect("/login");
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      videos: {
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="p-8 text-white">
      <h1 className="text-4xl font-bold">
        {project.title}
      </h1>

      <p className="mt-4 text-white/60">
        {project.description ||
          "No description"}
      </p>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold">
          Statistics
        </h2>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-white/60">
              Scripts
            </p>

            <p className="text-3xl font-bold">
              {project.videos.length}
            </p>
          </div>

          <div>
            <p className="text-white/60">
              Created
            </p>

            <p className="font-medium">
              {project.createdAt.toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-white/60">
              Status
            </p>

            <p className="font-medium text-green-400">
              Active
            </p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-2xl font-bold">
          Generated Scripts
        </h2>

        {project.videos.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/60">
            No scripts attached to this
            project yet.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {project.videos.map(
              (video: Video) => (
                <div
                  key={video.id}
                  className="flex min-h-[320px] flex-col rounded-3xl border border-white/10 bg-white/5 p-6"
                >
                  <h3 className="text-xl font-semibold">
                    {video.title}
                  </h3>

                  <p className="mt-2 text-sm text-cyan-400">
                    {video.status}
                  </p>

                  <div className="mt-4 flex-1 overflow-hidden rounded-xl bg-black/20 p-4">
                    <p className="line-clamp-8 whitespace-pre-wrap text-sm text-white/70">
                      {video.script}
                    </p>
                  </div>

                  <div className="mt-6 text-xs text-white/40">
                    Created{" "}
                    {video.createdAt.toLocaleDateString()}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
