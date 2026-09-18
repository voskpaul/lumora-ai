"use client";

import { useEffect, useState } from "react";

export type InspectorScene = {
  id: string;
  order: number;
  text: string;
  imagePrompt: string;
  duration: number;

  transitionType?:
    | "fade"
    | "slide"
    | "zoom"
    | "none";

  transitionDuration?: number;

  label?: string;

  generatedImage?: {
    id: string;
    imageUrl: string;
    prompt: string;
  } | null;

  audioUrl?: string | null;
  audioDuration?: number | null;
};

interface SceneInspectorProps {
  videoId: string;

  scene: InspectorScene | null;
  sceneIndex: number;
  disabled?: boolean;

  onSave: (changes: {
    text: string;
    imagePrompt: string;
    duration: number;
    transitionType:
      | "fade"
      | "slide"
      | "zoom"
      | "none";
    transitionDuration: number;
  }) => Promise<void>;

  onSceneContentUpdated?: (changes: {
    generatedImage?: {
      id: string;
      imageUrl: string;
      prompt: string;
    } | null;

    audioUrl?: string | null;
    audioDuration?: number | null;
  }) => void;

  onDelete?: () => void;
  canDelete?: boolean;
}

const MIN_DURATION = 1;

const TRANSITION_OPTIONS = [
  {
    value: "fade",
    label: "Fade",
  },
  {
    value: "slide",
    label: "Slide",
  },
  {
    value: "zoom",
    label: "Zoom",
  },
  {
    value: "none",
    label: "None",
  },
] as const;

const TRANSITION_DURATIONS = [
  0,
  0.4,
  0.6,
  0.8,
  1,
  1.2,
];

export default function SceneInspector({
  videoId,
  scene,
  sceneIndex,
  disabled = false,
  onSave,
  onSceneContentUpdated,
  onDelete,
  canDelete = true,
}: SceneInspectorProps) {
  const [text, setText] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");

  const [duration, setDuration] = useState("1");

  const [transitionType, setTransitionType] = useState<
    "fade" | "slide" | "zoom" | "none"
  >("fade");

  const [
    transitionDuration,
    setTransitionDuration,
  ] = useState("0.8");

  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const [imageGenerating, setImageGenerating] =
    useState(false);

  const [
    narrationGenerating,
    setNarrationGenerating,
  ] = useState(false);

  const [generationError, setGenerationError] =
    useState<string | null>(null);

  const isTemporaryScene =
    scene?.id.startsWith("temp-") ?? false;

  useEffect(() => {
    if (!scene) {
      setText("");
      setImagePrompt("");
      setDuration("1");
      setTransitionType("fade");
      setTransitionDuration("0.8");
      setDirty(false);
      setGenerationError(null);
      return;
    }

    setText(scene.text ?? "");

    setImagePrompt(
      scene.imagePrompt ?? ""
    );

    setDuration(
      String(
        Number.isFinite(scene.duration)
          ? scene.duration
          : 1
      )
    );

    setTransitionType(
      scene.transitionType ?? "fade"
    );

    setTransitionDuration(
      String(
        Number.isFinite(
          scene.transitionDuration
        )
          ? scene.transitionDuration
          : 0.8
      )
    );

    setDirty(false);
    setGenerationError(null);
  }, [scene]);

  if (!scene) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/30 p-5">
        <div className="mb-2 text-sm font-semibold text-white">
          Scene Inspector
        </div>

        <p className="text-xs leading-5 text-white/40">
          Select a scene on the timeline to
          edit its properties.
        </p>
      </div>
    );
  }

  const markDirty = () => {
    setDirty(true);
  };

  const handleSave = async () => {
    const parsedDuration = Number(duration);

    const safeDuration =
      Number.isFinite(parsedDuration)
        ? Math.max(
            MIN_DURATION,
            parsedDuration
          )
        : MIN_DURATION;

    const parsedTransitionDuration =
      Number(transitionDuration);

    const safeTransitionDuration =
      Number.isFinite(
        parsedTransitionDuration
      )
        ? Math.min(
            Math.max(
              0,
              parsedTransitionDuration
            ),
            safeDuration
          )
        : Math.min(
            0.8,
            safeDuration
          );

    try {
      setSaving(true);

      await onSave({
        text,
        imagePrompt,
        duration: safeDuration,
        transitionType,
        transitionDuration:
          safeTransitionDuration,
      });

      setDuration(
        String(safeDuration)
      );

      setTransitionDuration(
        String(
          safeTransitionDuration
        )
      );

      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // GENERATE IMAGE
  // =====================================================

  const handleGenerateImage = async () => {
    if (isTemporaryScene) {
      setGenerationError(
        "Apply Changes before generating scene content."
      );
      return;
    }

    if (!imagePrompt.trim()) {
      setGenerationError(
        "Image prompt is required."
      );
      return;
    }

    try {
      setImageGenerating(true);
      setGenerationError(null);

      const response = await fetch(
        `/api/videos/${videoId}/scenes/${scene.id}/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            imagePrompt: imagePrompt.trim(),
          }),
        }
      );

      const data =
        await response.json().catch(
          () => null
        );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to generate scene image."
        );
      }

      if (
        !data?.image?.imageUrl
      ) {
        throw new Error(
          "Image generation succeeded but no image was returned."
        );
      }

      onSceneContentUpdated?.({
        generatedImage:
          data.image,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate scene image.";

      setGenerationError(message);
    } finally {
      setImageGenerating(false);
    }
  };

  // =====================================================
  // GENERATE NARRATION
  // =====================================================

  const handleGenerateNarration =
    async () => {
      if (isTemporaryScene) {
        setGenerationError(
          "Apply Changes before generating scene content."
        );
        return;
      }

      if (!text.trim()) {
        setGenerationError(
          "Scene narration is required."
        );
        return;
      }

      try {
        setNarrationGenerating(true);
        setGenerationError(null);

        const response = await fetch(
          `/api/videos/${videoId}/scenes/${scene.id}/generate-narration`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              text: text.trim(),
            }),
          }
        );

        const data =
          await response.json().catch(
            () => null
          );

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to generate scene narration."
          );
        }

        if (!data?.audioUrl) {
          throw new Error(
            "Narration generation succeeded but no audio was returned."
          );
        }

        onSceneContentUpdated?.({
          audioUrl:
            data.audioUrl,
          audioDuration:
            typeof data.audioDuration ===
            "number"
              ? data.audioDuration
              : null,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to generate scene narration.";

        setGenerationError(message);
      } finally {
        setNarrationGenerating(false);
      }
    };

  // =====================================================
  // RESET
  // =====================================================

  const handleReset = () => {
    setText(scene.text ?? "");

    setImagePrompt(
      scene.imagePrompt ?? ""
    );

    setDuration(
      String(
        Number.isFinite(scene.duration)
          ? scene.duration
          : 1
      )
    );

    setTransitionType(
      scene.transitionType ?? "fade"
    );

    setTransitionDuration(
      String(
        Number.isFinite(
          scene.transitionDuration
        )
          ? scene.transitionDuration
          : 0.8
      )
    );

    setDirty(false);
    setGenerationError(null);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-5">
      {/* HEADER */}

      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            Scene Inspector

            {isTemporaryScene && (
              <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                NEW
              </span>
            )}
          </div>

          <div className="mt-1 text-xs text-white/40">
            Scene {sceneIndex + 1}
          </div>
        </div>

        {dirty && (
          <span className="rounded-md bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">
            Unsaved changes
          </span>
        )}
      </div>

      {/* TEMPORARY SCENE NOTICE */}

      {isTemporaryScene && (
        <div className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs leading-5 text-amber-300/80">
          This is a new local scene. Apply
          Changes first to persist it, then
          generate its image and narration.
        </div>
      )}

      {/* IMAGE */}

      <div className="mb-5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-white/40">
          Scene Image
        </div>

        <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
          {scene.generatedImage?.imageUrl ? (
            <img
              src={
                scene.generatedImage
                  .imageUrl
              }
              alt={`Scene ${
                sceneIndex + 1
              }`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-white/30">
              No generated image
            </div>
          )}
        </div>
      </div>

      {/* CONTENT GENERATION */}

      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleGenerateImage}
          disabled={
            disabled ||
            saving ||
            imageGenerating ||
            narrationGenerating ||
            isTemporaryScene
          }
          className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 px-3 py-2 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {imageGenerating
            ? "Generating Image..."
            : scene.generatedImage?.imageUrl
              ? "Regenerate Image"
              : "Generate Image"}
        </button>

        <button
          type="button"
          onClick={
            handleGenerateNarration
          }
          disabled={
            disabled ||
            saving ||
            imageGenerating ||
            narrationGenerating ||
            isTemporaryScene
          }
          className="rounded-lg border border-violet-400/20 bg-violet-400/5 px-3 py-2 text-xs font-medium text-violet-300 transition hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {narrationGenerating
            ? "Generating Voice..."
            : scene.audioUrl
              ? "Regenerate Narration"
              : "Generate Narration"}
        </button>
      </div>

      {/* AUDIO STATUS */}

      {scene.audioUrl &&
        !narrationGenerating && (
          <div className="mb-5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/50">
            Narration ready
            {typeof scene.audioDuration ===
            "number"
              ? ` • ${scene.audioDuration.toFixed(
                  2
                )}s`
              : ""}
          </div>
        )}

      {/* ERROR */}

      {generationError && (
        <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-300">
          {generationError}
        </div>
      )}

      {/* SCENE TEXT */}

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-white/60">
          Scene Text / Narration
        </label>

        <textarea
          value={text}
          onChange={(event) => {
            setText(
              event.target.value
            );
            markDirty();
          }}
          disabled={
            disabled || saving
          }
          rows={5}
          className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm leading-5 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Enter the scene narration..."
        />
      </div>

      {/* IMAGE PROMPT */}

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-white/60">
          Image Prompt
        </label>

        <textarea
          value={imagePrompt}
          onChange={(event) => {
            setImagePrompt(
              event.target.value
            );
            markDirty();
          }}
          disabled={
            disabled || saving
          }
          rows={5}
          className="w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm leading-5 text-white outline-none transition placeholder:text-white/20 focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Describe the image for this scene..."
        />
      </div>

      {/* DURATION */}

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-white/60">
          Scene Duration
        </label>

        <div className="relative">
          <input
            type="number"
            min={MIN_DURATION}
            step="0.1"
            value={duration}
            onChange={(event) => {
              setDuration(
                event.target.value
              );
              markDirty();
            }}
            disabled={
              disabled || saving
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 pr-10 text-sm text-white outline-none transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
          />

          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">
            sec
          </span>
        </div>

        <p className="mt-1 text-[10px] text-white/30">
          Minimum duration:{" "}
          {MIN_DURATION}s
        </p>
      </div>

      {/* TRANSITION */}

      <div className="mb-4">
        <label className="mb-2 block text-xs font-medium text-white/60">
          Transition
        </label>

        <select
          value={transitionType}
          onChange={(event) => {
            setTransitionType(
              event.target.value as
                | "fade"
                | "slide"
                | "zoom"
                | "none"
            );

            markDirty();
          }}
          disabled={
            disabled || saving
          }
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {TRANSITION_OPTIONS.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-zinc-950"
              >
                {option.label}
              </option>
            )
          )}
        </select>
      </div>

      {/* TRANSITION DURATION */}

      <div className="mb-5">
        <label className="mb-2 block text-xs font-medium text-white/60">
          Transition Duration
        </label>

        <select
          value={transitionDuration}
          onChange={(event) => {
            setTransitionDuration(
              event.target.value
            );
            markDirty();
          }}
          disabled={
            disabled ||
            saving ||
            transitionType ===
              "none"
          }
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {TRANSITION_DURATIONS.map(
            (value) => (
              <option
                key={value}
                value={String(value)}
                className="bg-zinc-950"
              >
                {value.toFixed(1)}s
              </option>
            )
          )}
        </select>

        {transitionType ===
          "none" && (
          <p className="mt-1 text-[10px] text-white/30">
            No transition overlap is
            used.
          </p>
        )}
      </div>

      {/* ACTIONS */}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={
            disabled ||
            saving ||
            !dirty
          }
          className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {saving
            ? "Saving..."
            : isTemporaryScene
              ? "Apply Changes"
              : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={
            disabled ||
            saving ||
            !dirty
          }
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Reset
        </button>
      </div>

      {/* DELETE */}

      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          disabled={
            disabled ||
            saving ||
            !canDelete
          }
          className="mt-3 w-full rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {canDelete
            ? "Delete Scene"
            : "Cannot Delete Last Scene"}
        </button>
      )}
    </div>
  );
}