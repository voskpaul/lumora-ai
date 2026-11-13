import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditorClient from "../components/EditorClient";

export default async function VideoEditorPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const { videoId } = await params;

  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      user: {
        email: session.user.email,
      },
    },
    include: {
      GeneratedImage: true,
    },
  });

  if (!video) {
    notFound();
  }

 
  return (
    <div className="h-full min-h-0 overflow-hidden bg-[#0b0b0f] text-white">
      <div className="flex h-full min-h-0 flex-col">
        {/* Editor top bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-1.5">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">
              {video.title}
            </h1>
            <p className="text-xs text-white/40">
              {video.status}
            </p>
          </div>

          <span className="text-xs text-white/40">
            Lumora AI Editor
          </span>
        </header>

        {/* Editor workspace */}
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-3">
          <EditorClient
            videoId={videoId}
            videoUrl={video.videoUrl}
          />
        </main>
      </div>
    </div>
  );
}