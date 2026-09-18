"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import VideoForm from "./components/VideoForm";
import VideoGrid from "./components/VideoGrid";

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

interface Project {
  id: string;
  title: string;
}

export default function VideosClient({
  initialVideos,
  projects,
}: {
  initialVideos: Video[];
  projects: Project[];
}) {
  const router = useRouter();

  const [videos, setVideos] =
    useState<Video[]>(initialVideos);

  const [prompt, setPrompt] = useState("");
  const [category, setCategory] =
    useState("YouTube Shorts");

  const [projectId, setProjectId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [format, setFormat] =
    useState<"shorts" | "youtube">("shorts");

  const [voiceType, setVoiceType] =
    useState("en-US-AriaNeural");

  // =====================================================
  // PER-VIDEO OPERATION STATES
  // =====================================================

  const [generatingImages, setGeneratingImages] =
    useState<string | null>(null);

  const [generatingVoice, setGeneratingVoice] =
    useState<string | null>(null);

  const [rendering, setRendering] =
    useState<string | null>(null);

  const [autoGenerating, setAutoGenerating] =
    useState<string | null>(null);

  // =====================================================
  // GENERATE SCRIPT
  // =====================================================

  const generateScript = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/videos/generate-script",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            category,
            projectId,
            format,
            voiceType,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to generate script"
        );
      }

      setVideos((prev) => [
        data.video,
        ...prev,
      ]);

      toast.success(
        "Script generated!"
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate script"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGENERATE SCRIPT
  // =====================================================

  const regenerateScript = async (
    existingPrompt: string
  ) => {
    try {
      setLoading(true);

      const res = await fetch(
        "/api/videos/generate-script",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            prompt: existingPrompt,
            category,
            projectId,
            format,
            voiceType,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Failed to regenerate script"
        );
      }

      toast.success(
        "Script generated!"
      );

      setPrompt("");

      setVideos((prev) => [
        data.video,
        ...prev,
      ]);

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to regenerate"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GENERATE IMAGES
  // =====================================================

  const generateImages = async (
    videoId: string
  ) => {
    try {
      setGeneratingImages(videoId);

      const res = await fetch(
        "/api/videos/generate-images",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Image generation failed"
        );
      }

      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                GeneratedImage:
                  data.images || [],
                status:
                  data.status ||
                  "images_ready",
              }
            : video
        )
      );

      toast.success(
        `${data.imageCount || 0} images generated`
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Image generation failed"
      );
    } finally {
      setGeneratingImages(null);
    }
  };

  // =====================================================
  // GENERATE VOICE
  // =====================================================

  const generateVoice = async (
    videoId: string
  ) => {
    try {
      setGeneratingVoice(videoId);

      const res = await fetch(
        "/api/videos/generate-voice",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
            voiceType,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Voice generation failed"
        );
      }

      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                voiceUrl:
                  data.voiceUrl,
                status:
                  data.status ||
                  "voice_ready",
              }
            : video
        )
      );

      toast.success(
        "Voice generated successfully"
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Voice generation failed"
      );
    } finally {
      setGeneratingVoice(null);
    }
  };

  // =====================================================
  // RENDER VIDEO
  // =====================================================

  const renderVideo = async (
    videoId: string
  ) => {
    try {
      setRendering(videoId);

      const currentVideo =
        videos.find(
          (video) =>
            video.id === videoId
        );

      if (!currentVideo) {
        throw new Error(
          "Video not found"
        );
      }

      // =================================================
      // STEP 1 — GENERATE CAPTIONS IF MISSING
      // =================================================

      let captionsUrl =
        currentVideo.captionsUrl;

      if (!captionsUrl) {
        toast.loading(
          "Generating captions...",
          {
            id: `render-${videoId}`,
          }
        );

        const captionRes =
          await fetch(
            "/api/videos/generate-captions",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                videoId,
              }),
            }
          );

        const captionData =
          await captionRes.json();

        if (!captionRes.ok) {
          throw new Error(
            captionData.error ||
              "Caption generation failed"
          );
        }

        if (
          !captionData.captionsUrl
        ) {
          throw new Error(
            "Caption generation completed but no captions URL was returned."
          );
        }

        captionsUrl =
          captionData.captionsUrl;
      }

      // =================================================
      // STEP 2 — RENDER
      // =================================================

      toast.loading(
        "Rendering video...",
        {
          id: `render-${videoId}`,
        }
      );

      const res = await fetch(
        "/api/videos/render",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
            format,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error ||
            "Render failed"
        );
      }

      // =================================================
      // STEP 3 — UPDATE UI
      // =================================================

      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                videoUrl:
                  data.videoUrl,
                captionsUrl:
                  captionsUrl ||
                  video.captionsUrl,
                status:
                  data.status ||
                  "completed",
              }
            : video
        )
      );

      toast.success(
        "Video rendered successfully",
        {
          id: `render-${videoId}`,
        }
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Render failed",
        {
          id: `render-${videoId}`,
        }
      );
    } finally {
      setRendering(null);
    }
  };

  // =====================================================
  // AUTO GENERATE
  // =====================================================

  const autoGenerate = async (
    videoId: string
  ) => {
    const toastId =
      toast.loading("Preparing...");

    try {
      setAutoGenerating(videoId);

      // =================================================
      // IMAGES
      // =================================================

      toast.loading(
        "Generating images...",
        {
          id: toastId,
        }
      );

      const imageRes = await fetch(
        "/api/videos/generate-images",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
          }),
        }
      );

      const imageData =
        await imageRes.json();

      if (!imageRes.ok) {
        throw new Error(
          imageData.error ||
            "Image generation failed"
        );
      }

      // =================================================
      // VOICE
      // =================================================

      toast.loading(
        "Generating voice...",
        {
          id: toastId,
        }
      );

      const voiceRes = await fetch(
        "/api/videos/generate-voice",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            videoId,
            voiceType,
          }),
        }
      );

      const voiceData =
        await voiceRes.json();

      if (!voiceRes.ok) {
        throw new Error(
          voiceData.error ||
            "Voice generation failed"
        );
      }

      // =================================================
      // CAPTIONS
      // =================================================

      toast.loading(
        "Generating captions...",
        {
          id: toastId,
        }
      );

      const captionRes =
        await fetch(
          "/api/videos/generate-captions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              videoId,
            }),
          }
        );

      const captionData =
        await captionRes.json();

      if (!captionRes.ok) {
        throw new Error(
          captionData.error ||
            "Caption generation failed"
        );
      }

      if (
        !captionData.captionsUrl
      ) {
        throw new Error(
          "Caption API finished but returned no captionsUrl."
        );
      }

      // =================================================
      // RENDER
      // =================================================

      toast.loading(
        "Rendering video...",
        {
          id: toastId,
        }
      );

      const renderRes =
        await fetch(
          "/api/videos/render",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              videoId,
              format,
            }),
          }
        );

      const renderData =
        await renderRes.json();

      if (!renderRes.ok) {
        throw new Error(
          renderData.error ||
            "Render failed"
        );
      }

      // =================================================
      // UPDATE CARD
      // =================================================

      setVideos((prev) =>
        prev.map((video) =>
          video.id === videoId
            ? {
                ...video,
                GeneratedImage:
                  imageData.images ||
                  video.GeneratedImage,
                voiceUrl:
                  voiceData.voiceUrl ||
                  video.voiceUrl,
                captionsUrl:
                  captionData.captionsUrl ||
                  video.captionsUrl,
                videoUrl:
                  renderData.videoUrl ||
                  video.videoUrl,
                status:
                  renderData.status ||
                  "completed",
              }
            : video
        )
      );

      toast.success(
        "Video completed",
        {
          id: toastId,
        }
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Generation failed",
        {
          id: toastId,
        }
      );
    } finally {
      setAutoGenerating(null);
    }
  };

  // =====================================================
  // DELETE VIDEO
  // =====================================================

  const deleteVideo = async (
    id: string
  ) => {
    if (
      !confirm(
        "Are you sure you want to delete this video?"
      )
    ) {
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(
        `/api/videos/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const data =
          await res.json();

        throw new Error(
          data.error ||
            "Delete failed"
        );
      }

      setVideos((prev) =>
        prev.filter(
          (video) =>
            video.id !== id
        )
      );

      toast.success(
        "Video deleted successfully"
      );

      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Delete failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <>
      <VideoForm
        prompt={prompt}
        setPrompt={setPrompt}
        category={category}
        setCategory={setCategory}
        projectId={projectId}
        setProjectId={setProjectId}
        format={format}
        setFormat={setFormat}
        voiceType={voiceType}
        setVoiceType={setVoiceType}
        loading={loading}
        projects={projects}
        onGenerate={generateScript}
      />

      <VideoGrid
        videos={videos}
        onGenerateImages={generateImages}
        onGenerateVoice={generateVoice}
        onRender={renderVideo}
        onDelete={deleteVideo}
        onRegenerate={regenerateScript}
        onAutoGenerate={autoGenerate}
        generatingImages={generatingImages}
        generatingVoice={generatingVoice}
        rendering={rendering}
        autoGenerating={autoGenerating}
      />
    </>
  );
}