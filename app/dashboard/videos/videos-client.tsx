"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import VideoForm from "./components/VideoForm";
import VideoGrid from "./components/VideoGrid";

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
useState<"shorts" | "youtube">(
"shorts"
);

const [voiceType, setVoiceType] =
useState("en-US-AriaNeural");

const generateScript = async () => {
  try {
    setLoading(true);

    const res = await fetch("/api/videos/generate-script", {
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
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to generate script");
    }

    setVideos((prev) => [data.video, ...prev]);
    toast.success("Script generated!");

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

const regenerateScript = async (existingPrompt: string) => {
  try {
    setLoading(true);

    const res = await fetch("/api/videos/generate-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: existingPrompt,
        category,
        projectId,
        format,
        voiceType,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error);
    }

    toast.success("Script generated!");

setPrompt("");

setVideos((prev) => [
  data.video,
  ...prev,
]);

router.refresh();

  } catch (err) {
    toast.error("Failed to regenerate");
  } finally {
    setLoading(false);
  }
};

const generateImages = async (
videoId: string
) => {
try {
setLoading(true);


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
  setLoading(false);
}

};

const generateVoice = async (
videoId: string
) => {
try {
setLoading(true);

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
      data.error || "Voice failed"
    );
  }

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
  setLoading(false);
}
};

const renderVideo = async (
videoId: string
) => {
try {
setLoading(true);


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
      data.error || "Render failed"
    );
  }

  toast.success(
    "Video rendered successfully"
  );

  setVideos((prev) =>
    prev.map((video) =>
      video.id === videoId
        ? {
            ...video,
            videoUrl: data.videoUrl,
            status: "completed",
          }
        : video
    )
  );

  router.refresh();
} catch (error) {
  toast.error(
    error instanceof Error
      ? error.message
      : "Render failed"
  );
} finally {
  setLoading(false);
}

};

const autoGenerate = async (videoId: string) => {
  const toastId = toast.loading("Preparing...");

  try {
    setLoading(true);

    toast.loading("Generating images...", { id: toastId });

    const imageRes = await fetch("/api/videos/generate-images", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ videoId }),
});

if (!imageRes.ok) {
  throw new Error("Image generation failed");
}

    toast.loading("Generating voice...", { id: toastId });

    const voiceRes = await fetch("/api/videos/generate-voice", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    videoId,
    voiceType,
  }),
});

if (!voiceRes.ok) {
  throw new Error("Voice generation failed");
}

    toast.loading("Generating captions...", { id: toastId });

await new Promise((resolve) =>
  setTimeout(resolve, 500)
);

toast.loading("Generating captions...", { id: toastId });

const captionRes = await fetch(
  "/api/videos/generate-captions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      videoId,
    }),
  }
);

const captionData = await captionRes.json();

if (!captionRes.ok) {
  throw new Error(
    captionData.error || "Caption generation failed"
  );
}

console.log("Captions generated:", captionData);

if (!captionData.captionsUrl) {
  throw new Error(
    "Caption API finished but returned no captionsUrl."
  );
}

toast.loading("Rendering video...", { id: toastId });

const renderRes = await fetch("/api/videos/render", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    videoId,
    format,
  }),
});

if (!renderRes.ok) {
  throw new Error("Render failed");
}

toast.success("Video completed", { id: toastId });

router.refresh();

setTimeout(() => {
  toast.dismiss(toastId);
}, 800);
    router.refresh();
    setTimeout(() => {
  toast.dismiss(toastId);
}, 800);

  } catch (error) {
    toast.error("Generation failed", { id: toastId });
  } finally {
    setLoading(false);
  }
};

const deleteVideo = async (id: string) => {
  if (!confirm("Are you sure you want to delete this video?")) return;

  try {
    setLoading(true);

    const res = await fetch(`/api/videos/${id}`, { 
      method: "DELETE" 
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Delete failed");
    }

    setVideos((prev) => prev.filter((video) => video.id !== id));
    toast.success("Video deleted successfully");
    router.refresh();
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Delete failed");
  } finally {
    setLoading(false);
  }
};

return (
<> <VideoForm
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
/>
</>

);
}