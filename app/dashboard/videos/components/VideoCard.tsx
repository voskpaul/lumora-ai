"use client";

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
  video: Video;

  onGenerateImages: (id: string) => void;
  onGenerateVoice: (id: string) => void;
  onRender: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (prompt: string) => void;

  onAutoGenerate: (id: string) => void;
}

export default function VideoCard({
  video,
  onGenerateImages,
  onGenerateVoice,
  onRender,
  onDelete,
  onRegenerate,
  onAutoGenerate,
}: Props) {
  return (
    <div className="flex min-h-[420px] flex-col rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-semibold">
        {video.title}
      </h2>

      <p className="text-cyan-400">
        {video.status}
      </p>

      {video.script && (
        <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm text-white/70 line-clamp-4">
          {video.script}
        </div>
      )}

      {video.voiceUrl && (
        <audio controls className="mt-4 w-full">
          <source
            src={video.voiceUrl}
            type="audio/mp3"
          />
        </audio>
      )}

      {video.videoUrl && (
        <div className="mt-4">
          <video controls className="w-full rounded-xl">
            <source
              src={video.videoUrl}
              type="video/mp4"
            />
          </video>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">

        <button
          onClick={() => onAutoGenerate(video.id)}
          className="rounded-xl bg-gradient-to-r from-green-500 to-cyan-500 px-4 py-2 text-white font-semibold"
        >
          🚀 Auto Generate
        </button>

        <button
          onClick={() => onGenerateImages(video.id)}
          className="rounded-xl border border-green-500 px-4 py-2 text-green-400"
        >
          Images
        </button>

        <button
          onClick={() => onGenerateVoice(video.id)}
          className="rounded-xl border border-cyan-500 px-4 py-2 text-cyan-400"
        >
          Voice
        </button>

        <button
          onClick={() => onRender(video.id)}
          className="rounded-xl border border-yellow-500 px-4 py-2 text-yellow-400"
        >
          Render
        </button>

        <button
          onClick={() =>
            onRegenerate(video.prompt || "")
          }
          className="rounded-xl border border-violet-500 px-4 py-2 text-violet-400"
        >
          Regenerate
        </button>

        <button
          onClick={() => onDelete(video.id)}
          className="rounded-xl border border-red-500 px-4 py-2 text-red-400"
        >
          Delete
        </button>

      </div>
    </div>
  );
}