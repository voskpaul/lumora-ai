"use client";

import VideoCard from "./VideoCard";

interface GeneratedImage {
  id: string;
  imageUrl: string;
}

interface Video {
  id: string;
  title: string;
  prompt: string | null;
  script?: string | null;
  status: string;

  voiceUrl?: string | null;
  videoUrl?: string | null;
  captionsUrl?: string | null;

  GeneratedImage?: GeneratedImage[];
}

interface Props {
  videos: Video[];

  onGenerateImages: (id: string) => void;
  onGenerateVoice: (id: string) => void;
  onRender: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  onAutoGenerate: (id: string) => void;

  generatingImages: string | null;
  generatingVoice: string | null;
  rendering: string | null;
  autoGenerating: string | null;
}

export default function VideoGrid({
  videos,
  onGenerateImages,
  onGenerateVoice,
  onRender,
  onDelete,
  onRegenerate,
  onAutoGenerate,
  generatingImages,
  generatingVoice,
  rendering,
  autoGenerating,
}: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {videos.map((video) => (
        <VideoCard
          key={video.id}
          video={video}
          onGenerateImages={
            onGenerateImages
          }
          onGenerateVoice={
            onGenerateVoice
          }
          onRender={onRender}
          onDelete={onDelete}
          onRegenerate={onRegenerate}
          onAutoGenerate={
            onAutoGenerate
          }
          generatingImages={
            generatingImages === video.id
          }
          generatingVoice={
            generatingVoice === video.id
          }
          rendering={
            rendering === video.id
          }
          autoGenerating={
            autoGenerating === video.id
          }
        />
      ))}
    </div>
  );
}