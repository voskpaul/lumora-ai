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
    <div className="min-h-screen bg-[#0b0b0f] p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">
        {video.title}
      </h1>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <EditorClient
  videoId={videoId}
  videoUrl={video.videoUrl}
/>

        <p className="mt-2 text-sm text-white/50">
          {video.status}
        </p>
      </div>
    </div>
  );
}