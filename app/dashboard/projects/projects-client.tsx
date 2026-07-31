"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Project {
  id: string;
  title: string;
  description: string | null;
  videoCount: number;
}

export default function ProjectsClient({
  initialProjects,
}: {
  initialProjects: Project[];
}) {
  const [projects, setProjects] =
    useState<Project[]>(initialProjects);

  const [title, setTitle] = useState("");

  const createProject = async () => {
    if (!title.trim()) {
      toast.error("Project title required");
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description: "",
        }),
      });

      const project = await res.json();

      if (!res.ok) {
        throw new Error(
          project.error || "Failed to create project"
        );
      }

      setProjects((prev) => [
        {
          ...project,
          videoCount: 0,
        },
        ...prev,
      ]);

      setTitle("");

      toast.success("Project created");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create project"
      );
    }
  };

  const deleteProject = async (
    id: string
  ) => {
    try {
      const res = await fetch(
        `/api/projects/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        throw new Error();
      }

      setProjects((prev) =>
        prev.filter(
          (project) => project.id !== id
        )
      );

      toast.success("Project deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 md:flex-row">
        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="New Project Name"
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-white/40"
        />

        <button
          onClick={createProject}
          className="rounded-2xl bg-gradient-to-r from-violet-500 to-cyan-500 px-6 py-3 font-medium"
        >
          Create
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center text-white/60">
          No projects created yet
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex min-h-[240px] flex-col rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
            >
              <div className="flex-1">
                <h2 className="line-clamp-2 text-xl font-semibold break-words">
                  {project.title}
                </h2>

                <p className="mt-4 line-clamp-4 text-sm text-white/60 break-words">
                  {project.description ||
                    "No description provided."}
                </p>

                <p className="mt-4 text-sm text-cyan-400">
                  {project.videoCount} video
                  {project.videoCount !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    window.location.href = `/dashboard/projects/${project.id}`;
                  }}
                  className="rounded-xl border border-cyan-500 px-4 py-2 text-sm text-cyan-400 transition hover:bg-cyan-500/10"
                >
                  Open
                </button>

                <button
                  onClick={() =>
                    deleteProject(project.id)
                  }
                  className="rounded-xl border border-red-500 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}