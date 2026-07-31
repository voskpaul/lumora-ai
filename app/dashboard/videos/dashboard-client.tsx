"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Video {
  id: string;
  title: string;
  prompt: string | null;
  script?: string | null;
  status: string;
  voiceUrl?: string | null;
  videoUrl?: string | null;
  captionsUrl?: string | null;
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

  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("YouTube Shorts");
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [format, setFormat] = useState<"shorts" | "youtube">("shorts");
  const [voiceType, setVoiceType] = useState("en-US-AriaNeural");

  // ==================== GENERATION FUNCTIONS ====================

  const generateScript = async () => {
    console.log("🚀 Generate Video button clicked!");
    console.log("Prompt value:", prompt);

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      setLoading(true);
      console.log("📡 Sending request to /api/videos/generate-script");

      const res = await fetch("/api/videos/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category,
          projectId,
          format,
          voiceType,
        }),
      });

      console.log("📥 Response status:", res.status);

      const data = await res.json();
      console.log("📦 Response data:", data);

      if (!res.ok) throw new Error(data.error || "Generation failed");

      console.log("✅ Script generated successfully");

      setVideos((prev) => [data.video, ...prev]);
      setPrompt("");
      toast.success("Script generated successfully!");
      router.refresh();
    } catch (error: any) {
      console.error("💥 Generate script error:", error);
      toast.error(error.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };

  const regenerateScript = async (existingPrompt: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: existingPrompt,
          category,
          projectId,
          format,
          voiceType,
        }),
      });

      if (!res.ok) throw new Error("Regeneration failed");

      toast.success("New version generated");
      router.refresh();
    } catch {
      toast.error("Regeneration failed");
    } finally {
      setLoading(false);
    }
  };

  const generateImages = async (videoId: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos/generate-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Image generation failed");

      toast.success(`${data.imageCount || 0} images generated`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image generation failed");
    } finally {
      setLoading(false);
    }
  };

  const generateVoice = async (videoId: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos/generate-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Voice failed");

      toast.success("Voice generated successfully");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Voice generation failed");
    } finally {
      setLoading(false);
    }
  };

  const renderVideo = async (videoId: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/videos/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, format }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Render failed");

      toast.success("✅ Video rendered successfully!");

      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? { ...v, videoUrl: data.videoUrl, status: "completed" }
            : v
        )
      );

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Render failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      await fetch(`/api/videos/${id}`, { method: "DELETE" });

      setVideos((prev) => prev.filter((video) => video.id !== id));
      toast.success("Video deleted");
      router.refresh();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 md:flex-row flex-wrap items-end">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white">
          <option>YouTube Shorts</option>
          <option>TikTok</option>
          <option>Instagram Reels</option>
        </select>

        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white">
          <option value="">No Project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>

        <select value={format} onChange={(e) => setFormat(e.target.value as "shorts" | "youtube")} className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white">
          <option value="shorts">📱 Shorts (9:16)</option>
          <option value="youtube">🖥️ YouTube (16:9)</option>
        </select>

        <select value={voiceType} onChange={(e) => setVoiceType(e.target.value)} className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white">
          <option value="en-US-AriaNeural">🎤 Aria (Female)</option>
          <option value="en-US-GuyNeural">🎤 Guy (Male)</option>
        </select>

        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Create a video about..."
          className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-3 min-w-75"
        />

        <button
          onClick={generateScript}
          disabled={loading || !prompt.trim()}
          className="rounded-2xl bg-linear-to-r from-violet-500 to-cyan-500 px-6 py-3 whitespace-nowrap"
        >
          {loading ? "Generating..." : "Generate Video"}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <div key={video.id} className="flex min-h-105 flex-col rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-semibold">{video.title}</h2>
            <p className="text-cyan-400">{video.status}</p>

            {video.script && (
              <div className="mt-4 rounded-xl bg-black/20 p-3 text-sm text-white/70 line-clamp-4">
                {video.script}
              </div>
            )}

            {video.voiceUrl && (
              <audio controls className="mt-4 w-full">
                <source src={video.voiceUrl} type="audio/mp3" />
              </audio>
            )}

            {video.videoUrl && (
              <div className="mt-4">
                <video controls className="w-full rounded-xl">
                  <source src={video.videoUrl} type="video/mp4" />
                </video>
              </div>
            )}

            <div className="mt-auto flex flex-wrap gap-2 pt-4">
              <button onClick={() => generateImages(video.id)} className="rounded-xl border border-green-500 px-4 py-2 text-green-400">Images</button>
              <button onClick={() => generateVoice(video.id)} className="rounded-xl border border-cyan-500 px-4 py-2 text-cyan-400">Voice</button>
              <button onClick={() => renderVideo(video.id)} className="rounded-xl border border-yellow-500 px-4 py-2 text-yellow-400 font-medium">Render Video</button>
              <button onClick={() => regenerateScript(video.prompt || "")} className="rounded-xl border border-violet-500 px-4 py-2 text-violet-400">Regenerate</button>
              <button onClick={() => deleteVideo(video.id)} className="rounded-xl border border-red-500 px-4 py-2 text-red-400">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}