"use client";

import VideoCard from "./VideoCard";

interface Video {
  id: string;
  title: string;
  prompt: string | null;
  script?: string | null;
  status: string;
  voiceUrl?: string | null;
  videoUrl?: string | null;
}

interface Props {
  videos: Video[];

  onGenerateImages: (id: string) => void;
  onGenerateVoice: (id: string) => void;
  onRender: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (prompt: string) => void;

  onAutoGenerate: (id: string) => void;
}

export default function VideoGrid({
  videos,
  onGenerateImages,
  onGenerateVoice,
  onRender,
  onDelete,
  onRegenerate,
  onAutoGenerate,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onGenerateImages={onGenerateImages}
          onGenerateVoice={onGenerateVoice}
          onRender={onRender}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onAutoGenerate={onAutoGenerate}
        />
      ))}
    </div>
  );
}