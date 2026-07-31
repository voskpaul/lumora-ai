"use client";

interface Project {
  id: string;
  title: string;
}

interface VideoFormProps {
  prompt: string;
  setPrompt: (value: string) => void;

  category: string;
  setCategory: (value: string) => void;

  projectId: string;
  setProjectId: (value: string) => void;

  format: "shorts" | "youtube";
  setFormat: (value: "shorts" | "youtube") => void;

  voiceType: string;
  setVoiceType: (value: string) => void;

  loading: boolean;
  projects: Project[];

  onGenerate: () => void;
}

export default function VideoForm({
  prompt,
  setPrompt,
  category,
  setCategory,
  projectId,
  setProjectId,
  format,
  setFormat,
  voiceType,
  setVoiceType,
  loading,
  projects,
  onGenerate,
}: VideoFormProps) {
  return (
    <div className="mb-8 flex flex-wrap gap-3">
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white"
      >
        <option>YouTube</option>
        <option>YouTube Shorts</option>
        <option>TikTok</option>
        <option>Instagram Reels</option>
        <option>LinkedIn</option>
        <option>Facebook</option>
        <option>X</option>
        <option>Ads</option>
        <option>Business</option>
      </select>

      <select
        value={projectId}
        onChange={(e) => setProjectId(e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white"
      >
        <option value="">No Project</option>

        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title}
          </option>
        ))}
      </select>

      <select
        value={format}
        onChange={(e) =>
          setFormat(e.target.value as "shorts" | "youtube")
        }
        className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white"
      >
        <option value="shorts">
          📱 Shorts (9:16)
        </option>

        <option value="youtube">
          🖥️ YouTube (16:9)
        </option>
      </select>

      <select
        value={voiceType}
        onChange={(e) => setVoiceType(e.target.value)}
        className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-white"
      >
        <option value="en-US-AriaNeural">
          🎤 Aria (Female)
        </option>

        <option value="en-US-GuyNeural">
          🎤 Guy (Male)
        </option>
      </select>

      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Create a video about..."
        className="min-w-75 flex-1 rounded-2xl border border-white/10 bg-white/5 p-3"
      />

      <button
        onClick={onGenerate}
        disabled={loading}
        className="rounded-2xl bg-linear-to-r from-violet-500 to-cyan-500 px-6 py-3"
      >
        {loading ? "Generating..." : "Generate Video"}
      </button>
    </div>
  );
}