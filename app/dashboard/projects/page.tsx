import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import ProjectsClient from "./projects-client";

export default async function ProjectsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const projects = await prisma.project.findMany({
    where: {
      user: {
        email: session.user.email,
      },
    },
    include: {
      videos: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="min-h-screen bg-[#030712] p-8 text-white">
      <h1 className="mb-8 text-4xl font-bold">
        Projects
      </h1>

      <ProjectsClient
        initialProjects={projects.map((project: (typeof projects)[number]) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          videoCount: project.videos.length,
        }))}
      />
    </div>
  );
}
