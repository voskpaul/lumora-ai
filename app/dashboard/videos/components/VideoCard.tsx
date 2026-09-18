"use client";

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
  video: Video;

  onGenerateImages: (id: string) => void;
  onGenerateVoice: (id: string) => void;
  onRender: (id: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (prompt: string) => void;
  onAutoGenerate: (id: string) => void;

  generatingImages: boolean;
  generatingVoice: boolean;
  rendering: boolean;
  autoGenerating: boolean;
}

export default function VideoCard({
  video,
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
  const imageCount =
    video.GeneratedImage?.length ?? 0;

  // =====================================================
  // OPERATION STATE
  // =====================================================

  const isBusy =
    generatingImages ||
    generatingVoice ||
    rendering ||
    autoGenerating;

  return (
    <div className="flex min-h-105 flex-col rounded-3xl border border-white/10 bg-white/5 p-6">

      {/* =================================================
          TITLE
      ================================================= */}

      <h2 className="text-xl font-semibold">
        {video.title}
      </h2>

      {/* =================================================
          STATUS
      ================================================= */}

      <p className="mt-1 text-cyan-400">
        {generatingImages
          ? "generating_images"
          : generatingVoice
          ? "generating_voice"
          : rendering
          ? "rendering"
          : autoGenerating
          ? "processing"
          : video.status}
      </p>

      {/* =================================================
          SCRIPT
      ================================================= */}

      {video.script && (
        <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm text-white/70 line-clamp-4">
          {video.script}
        </div>
      )}

      {/* =================================================
          GENERATED IMAGES
      ================================================= */}

      {imageCount > 0 && (
        <div className="mt-4">

          <div className="mb-2 flex items-center justify-between">

            <span className="text-sm font-medium text-green-400">
              Images generated
            </span>

            <span className="text-xs text-white/50">
              {imageCount} image
              {imageCount !== 1
                ? "s"
                : ""}
            </span>

          </div>

          <div className="grid grid-cols-2 gap-2">

            {video.GeneratedImage?.map(
              (image) => (
                <img
                  key={image.id}
                  src={image.imageUrl}
                  alt="Generated scene"
                  className="aspect-9/16 w-full rounded-xl object-cover"
                />
              )
            )}

          </div>
        </div>
      )}

      {/* =================================================
          VOICE
      ================================================= */}

      {video.voiceUrl && (
        <div className="mt-4">

          <p className="mb-2 text-sm font-medium text-cyan-400">
            Voice generated
          </p>

          <audio
            controls
            className="w-full"
          >
            <source
              src={video.voiceUrl}
              type="audio/mpeg"
            />
          </audio>

        </div>
      )}

      {/* =================================================
          VIDEO
      ================================================= */}

      {video.videoUrl && (
        <div className="mt-4">

          <p className="mb-2 text-sm font-medium text-yellow-400">
            Render complete
          </p>

          <video
            controls
            className="w-full rounded-xl"
          >
            <source
              src={video.videoUrl}
              type="video/mp4"
            />
          </video>

        </div>
      )}

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">

        {/* AUTO GENERATE */}

        <button
          onClick={() =>
            onAutoGenerate(video.id)
          }
          disabled={isBusy}
          className="rounded-xl bg-linear-to-r from-green-500 to-cyan-500 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {autoGenerating
            ? "⏳ Processing..."
            : "🚀 Auto Generate"}
        </button>

        {/* IMAGES */}

        <button
          onClick={() =>
            onGenerateImages(video.id)
          }
          disabled={
            isBusy
          }
          className="rounded-xl border border-green-500 px-4 py-2 text-green-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generatingImages
            ? "⏳ Generating..."
            : imageCount > 0
            ? `Images (${imageCount})`
            : "Images"}
        </button>

        {/* VOICE */}

        <button
          onClick={() =>
            onGenerateVoice(video.id)
          }
          disabled={
            isBusy
          }
          className="rounded-xl border border-cyan-500 px-4 py-2 text-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generatingVoice
            ? "⏳ Generating..."
            : video.voiceUrl
            ? "Voice ✓"
            : "Voice"}
        </button>

        {/* RENDER */}

        <button
          onClick={() =>
            onRender(video.id)
          }
          disabled={
            isBusy
          }
          className="rounded-xl border border-yellow-500 px-4 py-2 text-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {rendering
            ? "⏳ Rendering..."
            : video.videoUrl
            ? "Render ✓"
            : "Render"}
        </button>

        {/* REGENERATE */}

        <button
          onClick={() =>
            onRegenerate(
              video.prompt || ""
            )
          }
          disabled={
            isBusy
          }
          className="rounded-xl border border-violet-500 px-4 py-2 text-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Regenerate
        </button>

        {/* DELETE */}

        <button
          onClick={() =>
            onDelete(video.id)
          }
          disabled={
            isBusy
          }
          className="rounded-xl border border-red-500 px-4 py-2 text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>

      </div>
    </div>
  );
}