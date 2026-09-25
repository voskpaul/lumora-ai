"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import SceneInspector from "./SceneInspector";

interface TimelineProps {
  videoId: string;
  duration?: number;
  currentTime?: number;
  onSeek?: (time: number) => void;
  isPlaying?: boolean;
}

type MotionOverride =
  | "auto"
  | "static"
  | "zoomIn"
  | "zoomOut"
  | "panLeft"
  | "panRight"
  | "panUp"
  | "panDown"
  | "dollyIn"
  | "dollyOut"
  | "orbit"
  | "droneUp"
  | "macroSlide"
  | "whipPan";

interface GeneratedImage {
  id: string;
  imageUrl: string;
  prompt: string;
}

interface Scene {
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

  motionOverride?: MotionOverride | null;

  label?: string;

  generatedImage?: GeneratedImage | null;

  sourceSceneId?: string;
}

interface ApiScene {
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

  motionOverride?: MotionOverride | null;

  generatedImage?: GeneratedImage | null;
}

const TRANSITION_DURATION = 0.8;
const MIN_SCENE_DURATION = 1;

const NEW_SCENE_DURATION = 5;

export default function Timeline({
  videoId,
  duration: fallbackDuration = 60,
  currentTime = 0,
  onSeek,
  isPlaying = false,
}: TimelineProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [history, setHistory] = useState<Scene[][]>([]);
  const [redoStack, setRedoStack] = useState<Scene[][]>([]);

  const [draggedId, setDraggedId] =
    useState<string | null>(null);

  const [dropTargetId, setDropTargetId] =
    useState<string | null>(null);

  const [selectedSceneId, setSelectedSceneId] =
    useState<string | null>(null);

  const [transitionEditorId, setTransitionEditorId] =
    useState<string | null>(null);

  const [transitionPreviewKey, setTransitionPreviewKey] =
    useState(0);

  const [trimming, setTrimming] = useState<{
    id: string;
    side: "left" | "right";
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const scenesRef = useRef<Scene[]>([]);

  // =====================================================
  // TRIM SESSION REF
  // =====================================================

  const trimSessionRef = useRef<{
    id: string;
    side: "left" | "right";
    startX: number;
    timelineWidth: number;
    timelineDuration: number;
    originalDuration: number;
    originalScenes: Scene[];
  } | null>(null);

  const trimListenersRef = useRef<{
    handleMouseMove: (event: MouseEvent) => void;
    handleMouseUp: () => void;
  } | null>(null);

  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  // =====================================================
  // HELPERS
  // =====================================================

  const cloneScenes = useCallback(
    (items: Scene[]) =>
      items.map((scene) => ({
        ...scene,
      })),
    []
  );

  const normalizeScenes = useCallback(
    (items: Scene[]) =>
      items.map((scene, index) => ({
        ...scene,
        order: index,
      })),
    []
  );

  const sceneLabel = useCallback(
    (scene: Scene, index: number) => {
      if (scene.label?.trim()) {
        return scene.label;
      }

      return `Scene ${index + 1}`;
    },
    []
  );

  const getTransitionLabel = useCallback(
    (transitionType?: Scene["transitionType"]) => {
      switch (transitionType) {
        case "slide":
          return "Slide";

        case "zoom":
          return "Zoom";

        case "none":
          return "None";

        case "fade":
        default:
          return "Fade";
      }
    },
    []
  );

  const getTransitionAnimation = useCallback(
    (transitionType?: Scene["transitionType"]) => {
      switch (transitionType) {
        case "slide":
          return "timelineTransitionSlide";

        case "zoom":
          return "timelineTransitionZoom";

        case "fade":
          return "timelineTransitionFade";

        case "none":
        default:
          return "none";
      }
    },
    []
  );

  const getTransitionDuration = useCallback(
    (scene: Scene) => {
      if (scene.transitionType === "none") {
        return 0;
      }

      const transitionDuration = Number(
        scene.transitionDuration
      );

      return Number.isFinite(
        transitionDuration
      )
        ? Math.max(0, transitionDuration)
        : TRANSITION_DURATION;
    },
    []
  );

  const formatTime = useCallback(
    (seconds: number) => {
      const safeSeconds = Math.max(
        0,
        Number.isFinite(seconds)
          ? seconds
          : 0
      );

      const minutes = Math.floor(
        safeSeconds / 60
      );

      const remaining =
        safeSeconds % 60;

      return `${minutes}:${remaining
        .toFixed(2)
        .padStart(5, "0")}`;
    },
    []
  );

  const isTemporaryScene = useCallback(
    (sceneId: string) =>
      sceneId.startsWith("temp-"),
    []
  );

  // =====================================================
  // ACTUAL TIMELINE DURATION
  // =====================================================

  const totalDuration = useMemo<number>(() => {
    if (scenes.length === 0) {
      return Math.max(
        1,
        fallbackDuration
      );
    }

    const sceneDuration =
      scenes.reduce(
        (total, scene) =>
          total +
          (Number.isFinite(
            scene.duration
          )
            ? Math.max(
                0,
                scene.duration
              )
            : 0),
        0
      );

    const transitionOverlap =
      scenes
        .slice(0, -1)
        .reduce(
          (total, scene) =>
            total +
            getTransitionDuration(scene),
          0
        );

    return Math.max(
      0,
      sceneDuration -
        transitionOverlap
    );
  }, [
    scenes,
    fallbackDuration,
    getTransitionDuration,
  ]);

  // =====================================================
  // PROGRESS
  // =====================================================

  const progress =
    totalDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (Math.min(
              currentTime,
              totalDuration
            ) /
              totalDuration) *
              100
          )
        )
      : 0;

  // =====================================================
  // PLAYBACK → ACTIVE SCENE
  // =====================================================

  useEffect(() => {
    if (
      scenes.length === 0 ||
      totalDuration <= 0
    ) {
      return;
    }

    let elapsed = 0;

    for (
      let index = 0;
      index < scenes.length;
      index++
    ) {
      const scene =
        scenes[index];

      const transitionDuration =
        index < scenes.length - 1
          ? getTransitionDuration(scene)
          : 0;

      const sceneStart =
        elapsed;

      const sceneEnd =
        elapsed +
        scene.duration;

      const effectiveEnd =
        Math.max(
          sceneStart,
          sceneEnd -
            transitionDuration
        );

      if (
        currentTime >= sceneStart &&
        currentTime < effectiveEnd
      ) {
        setSelectedSceneId(
          scene.id
        );

        return;
      }

      elapsed =
        sceneEnd -
        transitionDuration;
    }

    if (
      currentTime >= totalDuration
    ) {
      setSelectedSceneId(
        scenes[
          scenes.length - 1
        ].id
      );
    }
  }, [
    currentTime,
    scenes,
    totalDuration,
    getTransitionDuration,
  ]);

  // =====================================================
  // TIMELINE DEBUG
  // =====================================================

  useEffect(() => {
    console.log(
      "========== TIMELINE PLAYHEAD =========="
    );

    console.log(
      "currentTime:",
      currentTime
    );

    console.log(
      "totalDuration:",
      totalDuration
    );

    console.log(
      "progress:",
      progress
    );

    console.log(
      "scene durations:",
      scenes.map(
        (scene) => scene.duration
      )
    );

    console.log(
      "scene count:",
      scenes.length
    );

    console.log(
      "selectedSceneId:",
      selectedSceneId
    );

    console.log(
      "selectedSceneIndex:",
      scenes.findIndex(
        (scene) =>
          scene.id ===
          selectedSceneId
      )
    );

    console.log(
      "selectedSceneLabel:",
      selectedSceneId
        ? scenes.find(
            (scene) =>
              scene.id ===
              selectedSceneId
          )?.label
        : null
    );

    console.log(
      "trimming:",
      trimming
    );

    console.log(
      "saving:",
      saving
    );

    console.log(
      "loading:",
      loading
    );

    console.log(
      "trimSession:",
      trimSessionRef.current
    );

    console.log(
      "history length:",
      history.length
    );

    console.log(
      "redo length:",
      redoStack.length
    );

    console.log(
      "draggedId:",
      draggedId
    );

    console.log(
      "dropTargetId:",
      dropTargetId
    );

    console.log(
      "========================================"
    );
  }, [
    currentTime,
    totalDuration,
    progress,
    scenes,
    selectedSceneId,
    trimming,
    saving,
    loading,
    history.length,
    redoStack.length,
    draggedId,
    dropTargetId,
  ]);

  // =====================================================
  // SELECT SCENE
  // =====================================================

  const selectScene = useCallback(
    (sceneId: string | null) => {
      if (sceneId === null) {
        setSelectedSceneId(null);
        return;
      }

      const exists =
        scenesRef.current.some(
          (scene) =>
            scene.id === sceneId
        );

      if (!exists) {
        setSelectedSceneId(null);
        return;
      }

      setSelectedSceneId(sceneId);
    },
    []
  );

  // =====================================================
  // LOAD SCENES
  // =====================================================

  const loadScenes = useCallback(
    async (
      options?: {
        retry?: boolean;
      }
    ) => {
      const shouldRetry =
        options?.retry ?? true;

      const maxAttempts =
        shouldRetry ? 8 : 1;

      for (
        let attempt = 1;
        attempt <= maxAttempts;
        attempt++
      ) {
        try {
          const response = await fetch(
            `/api/videos/${videoId}/scenes`,
            {
              method: "GET",
              cache: "no-store",
            }
          );

          if (!response.ok) {
            throw new Error(
              `Failed to load scenes (${response.status})`
            );
          }

          const data =
            await response.json();

          const apiScenes =
            Array.isArray(data.scenes)
              ? (data.scenes as ApiScene[])
              : [];

          if (apiScenes.length > 0) {
            const loadedScenes: Scene[] =
              apiScenes.map(
                (scene, index) => ({
                  id: scene.id,

                  order:
                    scene.order ?? index,

                  text:
                    scene.text ?? "",

                  imagePrompt:
                    scene.imagePrompt ?? "",

                  duration:
                    typeof scene.duration ===
                    "number"
                      ? Math.max(
                          MIN_SCENE_DURATION,
                          scene.duration
                        )
                      : 10,

                  transitionType:
                    scene.transitionType ??
                    "fade",

                  transitionDuration:
                    typeof scene.transitionDuration ===
                    "number"
                      ? scene.transitionDuration
                      : TRANSITION_DURATION,

                  motionOverride:
                    scene.motionOverride ?? null,

                  generatedImage:
                    scene.generatedImage ??
                    null,
                })
              );

            const normalized =
              normalizeScenes(
                loadedScenes
              );

            scenesRef.current =
              normalized;

            const rawSceneDuration =
              normalized.reduce(
                (total, scene) =>
                  total + scene.duration,
                0
              );

            const transitionOverlap =
              normalized
                .slice(0, -1)
                .reduce(
                  (total, scene) =>
                    total +
                    getTransitionDuration(
                      scene
                    ),
                  0
                );

            const calculatedTimelineDuration =
              Math.max(
                0,
                rawSceneDuration -
                  transitionOverlap
              );

            console.log(
              "========== SCENES LOADED =========="
            );

            console.table(
              normalized.map(
                (scene, index) => ({
                  scene: index + 1,
                  id: scene.id,
                  duration:
                    scene.duration,
                  transitionType:
                    scene.transitionType,
                  transitionDuration:
                    scene.transitionDuration,
                })
              )
            );

            console.log(
              "Scene count:",
              normalized.length
            );

            console.log(
              "Raw scene duration:",
              rawSceneDuration
            );

            console.log(
              "Transition overlap:",
              transitionOverlap
            );

            console.log(
              "Calculated timeline duration:",
              calculatedTimelineDuration
            );

            console.log(
              "==================================="
            );

            setScenes(normalized);
            setHistory([]);
            setRedoStack([]);

            setSelectedSceneId(
              normalized[0]?.id ?? null
            );

            return;
          }

          if (
            attempt < maxAttempts
          ) {
            console.log(
              `TIMELINE: no scenes yet. Retrying ${attempt}/${maxAttempts}...`
            );

            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  500
                )
            );

            continue;
          }

          scenesRef.current = [];

          setScenes([]);
          setHistory([]);
          setRedoStack([]);
          setSelectedSceneId(null);

          console.log(
            "TIMELINE: video has no scenes."
          );

          return;
        } catch (error) {
          console.error(
            "Failed to load timeline scenes:",
            error
          );

          if (
            attempt < maxAttempts
          ) {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  500
                )
            );

            continue;
          }

          throw error;
        }
      }
    },
    [
      videoId,
      normalizeScenes,
      getTransitionDuration,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        setLoading(true);

        await loadScenes({
          retry: true,
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Timeline initialization failed:",
            error
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, [loadScenes]);

  // =====================================================
  // SAVE SCENES
  // =====================================================

  const persistScenes = useCallback(
    async (items: Scene[]) => {
      const normalized = normalizeScenes(items);
      const selectedBeforeSave = selectedSceneId;

      try {
        setSaving(true);
        scenesRef.current = normalized;

        const response = await fetch(
          `/api/videos/${videoId}/scenes`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              scenes: normalized.map((scene, index) => ({
                id: scene.id,
                sourceSceneId: scene.sourceSceneId,
                text:
                  scene.text?.trim() ||
                  scene.label ||
                  `Scene ${index + 1}`,
                imagePrompt: scene.imagePrompt || "",
                duration: Math.max(
                  MIN_SCENE_DURATION,
                  Number(scene.duration) || MIN_SCENE_DURATION
                ),
                transitionType: scene.transitionType || "fade",
                transitionDuration:
                  scene.transitionType === "none"
                    ? 0
                    : Number.isFinite(Number(scene.transitionDuration))
                      ? Math.max(0, Number(scene.transitionDuration))
                      : TRANSITION_DURATION,
                motionOverride:
                  scene.motionOverride ?? null,
              })),
            }),
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.error || `Failed to save scenes (${response.status})`
          );
        }

        if (!Array.isArray(data?.scenes)) {
          throw new Error("Save succeeded but no scenes were returned.");
        }

        const apiScenes = data.scenes as ApiScene[];

        // The API replaces temp-* IDs with real Prisma IDs. Match the
        // returned scenes by order so selection survives the ID change.
        const savedScenes: Scene[] = apiScenes.map((scene, index) => {
          const localScene = normalized[index];

          return {
            id: scene.id,
            order: scene.order ?? index,
            text: scene.text ?? localScene?.text ?? "",
            imagePrompt:
              scene.imagePrompt ?? localScene?.imagePrompt ?? "",
            duration:
              typeof scene.duration === "number"
                ? Math.max(MIN_SCENE_DURATION, scene.duration)
                : localScene?.duration ?? NEW_SCENE_DURATION,
            transitionType:
              scene.transitionType ?? localScene?.transitionType ?? "fade",
            transitionDuration:
              typeof scene.transitionDuration === "number"
                ? scene.transitionDuration
                : localScene?.transitionDuration ?? TRANSITION_DURATION,
            motionOverride:
              scene.motionOverride ?? localScene?.motionOverride ?? null,
            generatedImage:
              scene.generatedImage ?? localScene?.generatedImage ?? null,
            label: localScene?.label,
            sourceSceneId: undefined,
          };
        });

        const normalizedSaved = normalizeScenes(savedScenes);

        scenesRef.current = normalizedSaved;
        setScenes(normalizedSaved);

        setSelectedSceneId((currentSelectedId) => {
          const selectedIndex = normalized.findIndex(
            (scene) => scene.id === currentSelectedId
          );

          if (
            selectedIndex >= 0 &&
            normalizedSaved[selectedIndex]
          ) {
            return normalizedSaved[selectedIndex].id;
          }

          if (
            selectedBeforeSave &&
            normalizedSaved.some(
              (scene) => scene.id === selectedBeforeSave
            )
          ) {
            return selectedBeforeSave;
          }

          return normalizedSaved[0]?.id ?? null;
        });

        console.log("========== SCENES AFTER SAVE ==========");
        console.table(
          normalizedSaved.map((scene, index) => ({
            scene: index + 1,
            id: scene.id,
            duration: scene.duration,
            transitionType: scene.transitionType,
            transitionDuration: scene.transitionDuration,
            motionOverride: scene.motionOverride ?? null,
            hasImage: Boolean(scene.generatedImage?.imageUrl),
          }))
        );
        console.log("=======================================");
      } catch (error) {
        console.error("Failed to save timeline:", error);
        throw error;
      } finally {
        setSaving(false);
      }
    },
    [
      videoId,
      normalizeScenes,
      selectedSceneId,
    ]
  );

  // =====================================================
  // HISTORY
  // =====================================================

  const saveHistory = useCallback(
    (snapshot?: Scene[]) => {
      const snapshotToSave =
        snapshot ??
        scenesRef.current;

      setHistory((current) => [
        ...current,
        cloneScenes(
          snapshotToSave
        ),
      ]);

      setRedoStack([]);
    },
    [cloneScenes]
  );

  // =====================================================
  // ADD SCENE — STAGE 2B.1
  // =====================================================

  const handleAddScene = useCallback(() => {
    const currentScenes = scenesRef.current;

    if (
      loading ||
      saving ||
      trimming !== null ||
      draggedId !== null
    ) {
      return;
    }

    const insertAfterIndex =
      selectedSceneId
        ? currentScenes.findIndex(
            (scene) => scene.id === selectedSceneId
          )
        : currentScenes.length - 1;

    const safeInsertIndex =
      insertAfterIndex >= 0
        ? insertAfterIndex + 1
        : currentScenes.length;

    const previousScene =
      currentScenes[safeInsertIndex - 1] ??
      currentScenes[0] ??
      null;

    const newScene: Scene = {
      id: `temp-${crypto.randomUUID()}`,
      order: safeInsertIndex,
      text:
        previousScene?.text?.trim() ||
        "Continue the video with a natural next scene.",
      imagePrompt:
        previousScene?.imagePrompt?.trim() ||
        "A cinematic continuation matching the previous scene, consistent characters, setting, lighting, and visual style.",
      duration: NEW_SCENE_DURATION,
      transitionType: "fade",
      transitionDuration: TRANSITION_DURATION,
      motionOverride: null,
      label: "New Scene",
      generatedImage: previousScene?.generatedImage ?? null,
      sourceSceneId:
        previousScene && !isTemporaryScene(previousScene.id)
          ? previousScene.id
          : undefined,
    };

    saveHistory(currentScenes);

    const updated = normalizeScenes([
      ...currentScenes.slice(0, safeInsertIndex),
      newScene,
      ...currentScenes.slice(safeInsertIndex),
    ]);

    scenesRef.current = updated;
    setScenes(updated);
    setSelectedSceneId(newScene.id);
    setTransitionEditorId(null);

    console.log("========== ADD SCENE ==========");
    console.log("Inserted index:", safeInsertIndex);
    console.log("Temporary ID:", newScene.id);
    console.log("Source scene:", newScene.sourceSceneId ?? "none");
    console.log("Scene count:", updated.length);
    console.log("New scene is ready for Stage 2B.2 persistence.");
    console.log("================================");
  }, [
    loading,
    saving,
    trimming,
    draggedId,
    selectedSceneId,
    saveHistory,
    normalizeScenes,
    isTemporaryScene,
  ]);

  // =====================================================
  // TRANSITION
  // =====================================================

  const updateTransition = useCallback(
    async (
      sceneId: string,
      changes: {
        transitionType?: Scene["transitionType"];
        transitionDuration?: number;
      }
    ) => {
      const currentScenes =
        scenesRef.current;

      const updated =
        currentScenes.map((item) =>
          item.id === sceneId
            ? {
                ...item,
                ...changes,
              }
            : item
        );

      saveHistory(currentScenes);

      scenesRef.current =
        updated;

      setScenes(updated);

      await persistScenes(updated);
    },
    [
      persistScenes,
      saveHistory,
    ]
  );

  // =====================================================
  // UPDATE SCENE DETAILS
  // =====================================================

  const updateSceneDetails = useCallback(
    async (
      sceneId: string,
      changes: {
        text: string;
        imagePrompt: string;
        duration: number;
        transitionType:
          | "fade"
          | "slide"
          | "zoom"
          | "none";
        transitionDuration: number;
        motionOverride: MotionOverride | null;
      }
    ) => {
      const currentScenes =
        scenesRef.current;

      const updated =
        currentScenes.map((scene) =>
          scene.id === sceneId
            ? {
                ...scene,
                ...changes,
              }
            : scene
        );

      saveHistory(currentScenes);

      scenesRef.current =
        updated;

      setScenes(updated);

      setSelectedSceneId(
        sceneId
      );

      await persistScenes(updated);
    },
    [
      persistScenes,
      saveHistory,
    ]
  );

  // =====================================================
  // UNDO
  // =====================================================

  const handleUndo = async () => {
    if (
      history.length === 0 ||
      trimming !== null ||
      saving ||
      loading ||
      draggedId !== null
    ) {
      return;
    }

    const currentScenes =
      scenesRef.current;

    const previousScenes =
      history[
        history.length - 1
      ];

    setRedoStack((current) => [
      ...current,
      cloneScenes(currentScenes),
    ]);

    const restoredScenes =
      cloneScenes(previousScenes);

    scenesRef.current =
      restoredScenes;

    setScenes(restoredScenes);

    setHistory((current) =>
      current.slice(0, -1)
    );

    setSelectedSceneId(
      (currentSelectedId) =>
        restoredScenes.some(
          (scene) =>
            scene.id ===
            currentSelectedId
        )
          ? currentSelectedId
          : restoredScenes[0]?.id ??
            null
    );

    await persistScenes(
      restoredScenes
    );
  };

  // =====================================================
  // REDO
  // =====================================================

  const handleRedo = async () => {
    if (
      redoStack.length === 0 ||
      trimming !== null ||
      saving ||
      loading ||
      draggedId !== null
    ) {
      return;
    }

    const currentScenes =
      scenesRef.current;

    const nextScenes =
      redoStack[
        redoStack.length - 1
      ];

    setHistory((current) => [
      ...current,
      cloneScenes(currentScenes),
    ]);

    const restoredScenes =
      cloneScenes(nextScenes);

    scenesRef.current =
      restoredScenes;

    setScenes(restoredScenes);

    setRedoStack((current) =>
      current.slice(0, -1)
    );

    setSelectedSceneId(
      (currentSelectedId) =>
        restoredScenes.some(
          (scene) =>
            scene.id ===
            currentSelectedId
        )
          ? currentSelectedId
          : restoredScenes[0]?.id ??
            null
    );

    await persistScenes(
      restoredScenes
    );
  };

  // =====================================================
  // SEEK TO TIME
  // =====================================================

  const seekToTime = useCallback(
    (time: number) => {
      if (!onSeek) return;

      const safeTime = Math.max(
        0,
        Math.min(
          totalDuration,
          time
        )
      );

      onSeek(safeTime);
    },
    [onSeek, totalDuration]
  );

  // =====================================================
  // SEEK BY TIMELINE CLICK
  // =====================================================

  const handleSeek = (
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      !onSeek ||
      totalDuration <= 0
    ) {
      return;
    }

    const rect =
      e.currentTarget.getBoundingClientRect();

    if (rect.width <= 0) return;

    const position =
      (e.clientX - rect.left) /
      rect.width;

    setSelectedSceneId(null);

    seekToTime(
      position * totalDuration
    );
  };

  // =====================================================
  // CLICK INDIVIDUAL SCENE
  // =====================================================

  const handleSceneClick = (
    e: React.MouseEvent,
    sceneId: string
  ) => {
    e.stopPropagation();

    selectScene(sceneId);

    if (
      !onSeek ||
      totalDuration <= 0
    ) {
      return;
    }

    const currentScenes =
      scenesRef.current;

    let startTime = 0;

    for (
      let index = 0;
      index < currentScenes.length;
      index++
    ) {
      const scene =
        currentScenes[index];

      if (scene.id === sceneId) {
        seekToTime(startTime);
        return;
      }

      startTime += scene.duration;

      if (
        index <
        currentScenes.length - 1
      ) {
        startTime -=
          getTransitionDuration(
            scene
          );
      }
    }
  };

  // =====================================================
  // REORDER
  // =====================================================

  const suppressClickRef =
    useRef(false);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    id: string
  ) => {
    if (
      trimming !== null ||
      saving ||
      loading
    ) {
      e.preventDefault();
      return;
    }

    setDraggedId(id);
    setDropTargetId(null);
    setSelectedSceneId(id);
    suppressClickRef.current = true;

    e.dataTransfer.effectAllowed =
      "move";

    e.dataTransfer.setData(
      "text/plain",
      id
    );
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      draggedId === null ||
      draggedId === targetId ||
      trimming !== null ||
      saving ||
      loading
    ) {
      return;
    }

    e.dataTransfer.dropEffect =
      "move";

    setDropTargetId(targetId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDropTargetId(null);

    window.setTimeout(() => {
      suppressClickRef.current =
        false;
    }, 0);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const sourceId =
      e.dataTransfer.getData(
        "text/plain"
      ) || draggedId;

    if (
      sourceId === null ||
      sourceId === targetId ||
      trimming !== null ||
      saving ||
      loading
    ) {
      handleDragEnd();
      return;
    }

    const currentScenes =
      scenesRef.current;

    const draggedScene =
      currentScenes.find(
        (scene) =>
          scene.id === sourceId
      );

    const draggedIndex =
      currentScenes.findIndex(
        (scene) =>
          scene.id === sourceId
      );

    const targetIndex =
      currentScenes.findIndex(
        (scene) =>
          scene.id === targetId
      );

    if (
      !draggedScene ||
      draggedIndex === -1 ||
      targetIndex === -1
    ) {
      handleDragEnd();
      return;
    }

    const reordered = [
      ...currentScenes,
    ];

    reordered.splice(
      draggedIndex,
      1
    );

    const newTargetIndex =
      reordered.findIndex(
        (scene) =>
          scene.id === targetId
      );

    if (newTargetIndex === -1) {
      handleDragEnd();
      return;
    }

    reordered.splice(
      newTargetIndex,
      0,
      draggedScene
    );

    const normalized =
      normalizeScenes(
        reordered
      );

    saveHistory(
      currentScenes
    );

    scenesRef.current =
      normalized;

    setScenes(normalized);

    setSelectedSceneId(
      draggedScene.id
    );

    suppressClickRef.current =
      true;

    setDraggedId(null);
    setDropTargetId(null);

    const hasTemporaryScene =
      normalized.some(
        (scene) =>
          isTemporaryScene(
            scene.id
          )
      );

    if (!hasTemporaryScene) {
      await persistScenes(
        normalized
      );
    }
  };

  // =====================================================
  // SPLIT
  // =====================================================

  const handleSplit = async (
    id: string
  ) => {
    const currentScenes =
      scenesRef.current;

    const scene =
      currentScenes.find(
        (item) => item.id === id
      );

    if (
      !scene ||
      scene.duration < 2 ||
      trimming !== null ||
      saving
    ) {
      return;
    }

    const index =
      currentScenes.findIndex(
        (item) => item.id === id
      );

    if (index === -1) return;

    saveHistory();

    const firstDuration =
      scene.duration / 2;

    const secondDuration =
      scene.duration -
      firstDuration;

    const firstScene: Scene = {
      id: `temp-${crypto.randomUUID()}`,
      order: index,
      text: scene.text,
      imagePrompt:
        scene.imagePrompt,
      duration: firstDuration,

      transitionType:
        scene.transitionType,

      transitionDuration:
        scene.transitionDuration,

      motionOverride:
        scene.motionOverride ?? null,

      label: `${sceneLabel(
        scene,
        index
      )}A`,

      generatedImage:
        scene.generatedImage ?? null,

      sourceSceneId: scene.id,
    };

    const secondScene: Scene = {
      id: `temp-${crypto.randomUUID()}`,
      order: index + 1,
      text: scene.text,
      imagePrompt:
        scene.imagePrompt,
      duration: secondDuration,

      transitionType:
        scene.transitionType,

      transitionDuration:
        scene.transitionDuration,

      motionOverride:
        scene.motionOverride ?? null,

      label: `${sceneLabel(
        scene,
        index
      )}B`,

      generatedImage:
        scene.generatedImage ?? null,

      sourceSceneId: scene.id,
    };

    const updated = [
      ...currentScenes.slice(
        0,
        index
      ),
      firstScene,
      secondScene,
      ...currentScenes.slice(
        index + 1
      ),
    ];

    const normalized =
      normalizeScenes(updated);

    scenesRef.current =
      normalized;

    setScenes(normalized);

    setSelectedSceneId(
      firstScene.id
    );

    await persistScenes(
      normalized
    );
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = async (
    id: string
  ) => {
    const currentScenes =
      scenesRef.current;

    const deletedIndex =
      currentScenes.findIndex(
        (scene) =>
          scene.id === id
      );

    if (
      deletedIndex === -1 ||
      currentScenes.length <= 1 ||
      trimming !== null ||
      saving
    ) {
      return;
    }

    saveHistory();

    const updated =
      currentScenes.filter(
        (scene) =>
          scene.id !== id
      );

    const normalized =
      normalizeScenes(updated);

    scenesRef.current =
      normalized;

    setScenes(normalized);

    if (normalized.length === 0) {
      setSelectedSceneId(null);
    } else {
      const nextIndex =
        Math.min(
          deletedIndex,
          normalized.length - 1
        );

      setSelectedSceneId(
        normalized[nextIndex].id
      );
    }

    const hasTemporaryScene =
      normalized.some(
        (scene) =>
          isTemporaryScene(
            scene.id
          )
      );

    if (!hasTemporaryScene) {
      await persistScenes(
        normalized
      );
    }
  };

  // =====================================================
  // TRIM CLEANUP
  // =====================================================

  const cleanupTrimListeners =
    useCallback(() => {
      const listeners =
        trimListenersRef.current;

      if (!listeners) {
        return;
      }

      window.removeEventListener(
        "mousemove",
        listeners.handleMouseMove
      );

      window.removeEventListener(
        "mouseup",
        listeners.handleMouseUp
      );

      trimListenersRef.current =
        null;
    }, []);

  // =====================================================
  // CLEAN UP ON UNMOUNT
  // =====================================================

  useEffect(() => {
    return () => {
      cleanupTrimListeners();
      trimSessionRef.current = null;
    };
  }, [cleanupTrimListeners]);

  // =====================================================
  // TRIM
  // =====================================================

  const startTrim = (
    e: React.MouseEvent,
    id: string,
    side: "left" | "right"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (
      trimming !== null ||
      saving ||
      loading
    ) {
      return;
    }

    const sceneElement =
      e.currentTarget.parentElement;

    if (!sceneElement) return;

    const timelineElement =
      sceneElement.parentElement;

    if (!timelineElement) return;

    const rect =
      timelineElement.getBoundingClientRect();

    const timelineWidth =
      rect.width;

    if (
      timelineWidth <= 0 ||
      totalDuration <= 0
    ) {
      return;
    }

    const currentScenes =
      scenesRef.current;

    const scene =
      currentScenes.find(
        (item) => item.id === id
      );

    if (!scene) return;

    cleanupTrimListeners();

    const originalScenes =
      cloneScenes(currentScenes);

    const trimSession = {
      id,
      side,
      startX: e.clientX,
      timelineWidth,
      timelineDuration:
        totalDuration,
      originalDuration:
        scene.duration,
      originalScenes,
    };

    trimSessionRef.current =
      trimSession;

    setSelectedSceneId(id);

    setTrimming({
      id,
      side,
    });

    const handleMouseMove = (
      moveEvent: MouseEvent
    ) => {
      const session =
        trimSessionRef.current;

      if (!session) {
        return;
      }

      const deltaPixels =
        moveEvent.clientX -
        session.startX;

      const deltaSeconds =
        (deltaPixels /
          session.timelineWidth) *
        session.timelineDuration;

      let newDuration =
        session.originalDuration;

      if (
        session.side === "right"
      ) {
        newDuration =
          session.originalDuration +
          deltaSeconds;
      } else {
        newDuration =
          session.originalDuration -
          deltaSeconds;
      }

      newDuration =
        Math.max(
          MIN_SCENE_DURATION,
          newDuration
        );

      newDuration =
        Math.round(
          newDuration * 1000
        ) / 1000;

      const current =
        scenesRef.current;

      const updated =
        current.map((item) => {
          if (
            item.id !==
            session.id
          ) {
            return item;
          }

          return {
            ...item,
            duration:
              newDuration,
          };
        });

      scenesRef.current =
        updated;

      setScenes(updated);
    };

    const handleMouseUp =
      async () => {
        const session =
          trimSessionRef.current;

        cleanupTrimListeners();

        trimSessionRef.current =
          null;

        setTrimming(null);

        if (!session) {
          return;
        }

        const finalScenes =
          cloneScenes(
            scenesRef.current
          );

        const finalScene =
          finalScenes.find(
            (item) =>
              item.id ===
              session.id
          );

        if (!finalScene) {
          return;
        }

        const durationChanged =
          Math.abs(
            finalScene.duration -
              session.originalDuration
          ) > 0.001;

        if (durationChanged) {
          saveHistory(
            session.originalScenes
          );
        }

        const hasTemporaryScene =
          finalScenes.some(
            (scene) =>
              isTemporaryScene(
                scene.id
              )
          );

        if (!hasTemporaryScene) {
          await persistScenes(
            finalScenes
          );
        }
      };

    trimListenersRef.current = {
      handleMouseMove,
      handleMouseUp,
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "mouseup",
      handleMouseUp
    );
  };

  // =====================================================
  // RENDER
  // =====================================================

  let elapsed = 0;

  const selectedScene =
    selectedSceneId
      ? scenes.find(
          (scene) =>
            scene.id ===
            selectedSceneId
        ) ?? null
      : null;

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
      {/* HEADER */}

      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-white">
            Timeline
          </h2>

          {isPlaying && (
            <span className="flex items-center gap-1 text-xs text-cyan-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              Playing
            </span>
          )}

          {selectedSceneId && (
            <span className="rounded-md bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300">
              {(() => {
                const selectedIndex =
                  scenes.findIndex(
                    (scene) =>
                      scene.id ===
                      selectedSceneId
                  );

                if (
                  selectedIndex === -1
                ) {
                  return "No scene selected";
                }

                return sceneLabel(
                  scenes[selectedIndex],
                  selectedIndex
                );
              })()}
            </span>
          )}

          <button
            type="button"
            onClick={
              handleAddScene
            }
            disabled={
              loading ||
              saving ||
              trimming !== null ||
              draggedId !== null
            }
            className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-30"
          >
            + Add Scene
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={
              history.length === 0 ||
              trimming !== null ||
              saving ||
              loading ||
              draggedId !== null
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↶ Undo
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={
              redoStack.length === 0 ||
              trimming !== null ||
              saving ||
              loading ||
              draggedId !== null
            }
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
          >
            ↷ Redo
          </button>

          {loading && (
            <span className="text-xs text-white/40">
              Loading...
            </span>
          )}

          {!loading && saving && (
            <span className="text-xs text-white/40">
              Saving...
            </span>
          )}

          {!loading && !saving && (
            <span className="text-xs text-emerald-400/60">
              Saved
            </span>
          )}
        </div>

        <span className="text-xs text-white/40">
          {formatTime(
            Math.min(
              currentTime,
              totalDuration
            )
          )}{" "}
          / {formatTime(totalDuration)}
        </span>
      </div>

      {/* NEW SCENE NOTICE */}

      {selectedScene &&
        isTemporaryScene(
          selectedScene.id
        ) && (
          <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-300/80">
            This is a new local scene. It will
            be connected to the database in
            Stage 2B.2.
          </div>
        )}

      {!loading && (
        <div className="mt-4">
          <SceneInspector
  videoId={videoId}
  scene={selectedScene}
            sceneIndex={Math.max(
              0,
              scenes.findIndex(
                (scene) =>
                  scene.id ===
                  selectedSceneId
              )
            )}
            disabled={
              loading ||
              saving ||
              trimming !== null ||
              draggedId !== null
            }
            canDelete={
              scenes.length > 1
            }
            onSave={async (changes) => {
              if (!selectedSceneId) {
                return;
              }

              await updateSceneDetails(
                selectedSceneId,
                changes
              );
            }}
            onDelete={() => {
              if (
                !selectedSceneId ||
                scenes.length <= 1
              ) {
                return;
              }

              void handleDelete(
                selectedSceneId
              );
            }}
          />
        </div>
      )}

      {/* TIMELINE */}

      <div
        onClick={handleSeek}
        className="relative mt-4 h-28 cursor-pointer overflow-visible rounded-lg bg-black/40"
      >
        {loading && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30 text-sm text-white/50">
            Loading scenes...
          </div>
        )}

        {!loading &&
          scenes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/30">
              No scenes yet
            </div>
          )}

        {/* SCENES + TRANSITIONS */}

        <div className="absolute inset-x-0 top-3 z-0 h-16">
          {/* SCENE TRACK */}

          <div className="absolute inset-0 flex h-16">
            {scenes.map(
              (scene, index) => {
                const start =
                  elapsed;

                elapsed +=
                  scene.duration;

                if (
                  index <
                  scenes.length - 1
                ) {
                  elapsed -=
                    getTransitionDuration(
                      scene
                    );
                }

                const effectiveDuration =
                  Math.max(
                    0,
                    scene.duration -
                      (index <
                      scenes.length - 1
                        ? getTransitionDuration(
                            scene
                          )
                        : 0)
                  );

                const sceneWidth =
                  totalDuration > 0
                    ? (effectiveDuration /
                        totalDuration) *
                      100
                    : 0;

                const isSelected =
                  selectedSceneId ===
                  scene.id;

                const isDragged =
                  draggedId ===
                  scene.id;

                const isDropTarget =
                  dropTargetId ===
                  scene.id;

                const isTrimming =
                  trimming?.id ===
                  scene.id;

                const isNewScene =
                  isTemporaryScene(
                    scene.id
                  );

                return (
                  <div
                    key={scene.id}
                    data-timeline-scene={
                      scene.id
                    }
                    draggable={
                      !trimming &&
                      !saving &&
                      !loading
                    }
                    onDragStart={(e) => {
                      e.stopPropagation();

                      handleDragStart(
                        e,
                        scene.id
                      );
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      handleDragOver(
                        e,
                        scene.id
                      );
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      void handleDrop(
                        e,
                        scene.id
                      );
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      handleDragEnd();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();

                      if (
                        suppressClickRef.current
                      ) {
                        return;
                      }

                      handleSceneClick(
                        e,
                        scene.id
                      );
                    }}
                    className={`relative overflow-hidden border-r border-black/40 px-2 py-2 text-xs transition ${
                      isSelected
                        ? "bg-cyan-500/40 text-cyan-100 ring-2 ring-inset ring-cyan-300"
                        : "bg-cyan-500/20 text-cyan-200 hover:bg-cyan-500/40"
                    } ${
                      isDragged
                        ? "opacity-40"
                        : ""
                    } ${
                      isDropTarget
                        ? "ring-2 ring-inset ring-white/80"
                        : ""
                    } ${
                      isNewScene
                        ? "border-dashed border-amber-400/40"
                        : ""
                    }`}
                    style={{
                      width: `${sceneWidth}%`,
                    }}
                  >
                    {isDropTarget && (
                      <div className="pointer-events-none absolute inset-y-0 left-0 z-40 w-1 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                    )}

                    {scene.generatedImage
                      ?.imageUrl && (
                      <img
                        src={
                          scene
                            .generatedImage
                            .imageUrl
                        }
                        alt={sceneLabel(
                          scene,
                          index
                        )}
                        className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover opacity-50"
                      />
                    )}

                    <div
                      className={`pointer-events-none absolute inset-0 z-1 ${
                        isSelected
                          ? "bg-cyan-950/30"
                          : "bg-black/40"
                      }`}
                    />

                    {/* LEFT TRIM */}

                    <div
                      onMouseDown={(e) =>
                        startTrim(
                          e,
                          scene.id,
                          "left"
                        )
                      }
                      className="absolute left-0 top-0 z-20 h-full w-2 cursor-ew-resize bg-cyan-400 opacity-70 hover:opacity-100"
                      title="Trim scene start"
                    />

                    {isSelected && (
                      <div className="pointer-events-none absolute inset-0 z-10 border-2 border-cyan-300" />
                    )}

                    {/* HEADER */}

                    <div className="relative z-10 flex items-center justify-between pl-2">
                      <div className="flex min-w-0 items-center gap-1">
                        <span className="truncate font-medium">
                          {sceneLabel(
                            scene,
                            index
                          )}
                        </span>

                        {isNewScene && (
                          <span className="shrink-0 rounded bg-amber-500/20 px-1 py-0.5 text-[8px] text-amber-300">
                            NEW
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* SPLIT */}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setSelectedSceneId(
                              scene.id
                            );

                            void handleSplit(
                              scene.id
                            );
                          }}
                          disabled={
                            trimming !== null ||
                            saving ||
                            loading ||
                            scene.duration < 2
                          }
                          title={
                            scene.duration < 2
                              ? "Scene must be at least 2 seconds to split"
                              : `Split ${sceneLabel(
                                  scene,
                                  index
                                )}`
                          }
                          className="rounded bg-violet-500/30 px-2 py-1 text-[10px] text-violet-200 hover:bg-violet-500/50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Split
                        </button>

                        {/* DELETE */}

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            void handleDelete(
                              scene.id
                            );
                          }}
                          disabled={
                            trimming !== null ||
                            saving ||
                            loading ||
                            scenes.length <= 1
                          }
                          className="rounded bg-red-500/30 px-2 py-1 text-[10px] text-red-200 hover:bg-red-500/50 disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            scenes.length <= 1
                              ? "The last scene cannot be deleted"
                              : `Delete ${sceneLabel(
                                  scene,
                                  index
                                )}`
                          }
                        >
                          ✕
                        </button>

                        {/* DRAG HANDLE */}

                        <span className="cursor-grab text-white/70">
                          ⋮⋮
                        </span>
                      </div>
                    </div>

                    {/* TIME */}

                    <div className="relative z-10 mt-1 pl-2 text-[10px] text-white/80">
                      {formatTime(start)} -{" "}
                      {formatTime(
                        start +
                          scene.duration
                      )}
                    </div>

                    {/* IMAGE STATUS */}

                    <div className="relative z-10 mt-1 truncate pl-2 text-[9px] text-white/60">
                      {scene.generatedImage
                        ? "🎨 Image ready"
                        : isNewScene
                          ? "New scene"
                          : "No image"}
                    </div>

                    {/* RIGHT TRIM */}

                    <div
                      onMouseDown={(e) =>
                        startTrim(
                          e,
                          scene.id,
                          "right"
                        )
                      }
                      className="absolute right-0 top-0 z-20 h-full w-2 cursor-ew-resize bg-cyan-400 opacity-70 hover:opacity-100"
                      title="Trim scene end"
                    />

                    {isTrimming && (
                      <div className="pointer-events-none absolute inset-0 z-30 border-2 border-cyan-300" />
                    )}
                  </div>
                );
              }
            )}
          </div>

          {/* TRANSITIONS */}

          {!loading &&
            scenes.length > 1 &&
            totalDuration > 0 && (
              <div className="pointer-events-none absolute inset-0 z-50">
                {scenes.map(
                  (scene, index) => {
                    if (
                      index >=
                      scenes.length - 1
                    ) {
                      return null;
                    }

                    const boundaryTime =
                      scenes
                        .slice(
                          0,
                          index + 1
                        )
                        .reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            item.duration,
                          0
                        ) -
                      scenes
                        .slice(
                          0,
                          index
                        )
                        .reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            getTransitionDuration(
                              item
                            ),
                          0
                        );

                    const boundaryPercent =
                      (boundaryTime /
                        totalDuration) *
                      100;

                    const isOpen =
                      transitionEditorId ===
                      scene.id;

                    return (
                      <div
                        key={`transition-${scene.id}`}
                        className="pointer-events-auto absolute top-1/2"
                        style={{
                          left: `${boundaryPercent}%`,
                          transform:
                            "translate(-50%, -50%)",
                        }}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            if (isOpen) {
                              setTransitionEditorId(
                                null
                              );
                              return;
                            }

                            setTransitionEditorId(
                              scene.id
                            );

                            setSelectedSceneId(
                              scene.id
                            );

                            setTransitionPreviewKey(
                              (value) =>
                                value + 1
                            );
                          }}
                          disabled={
                            trimming !== null ||
                            saving ||
                            loading
                          }
                          className="rounded-full border border-white/20 bg-black/85 px-2 py-1 text-[9px] font-medium text-white/80 shadow-lg backdrop-blur transition hover:border-cyan-300/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {getTransitionLabel(
                            scene.transitionType
                          )}{" "}
                          {(
                            scene.transitionType ===
                            "none"
                              ? 0
                              : scene.transitionDuration ??
                                TRANSITION_DURATION
                          ).toFixed(1)}
                          s
                        </button>

                        {isOpen && (
                          <div
                            onClick={(e) =>
                              e.stopPropagation()
                            }
                            className="absolute left-1/2 top-8 z-100 w-72 -translate-x-1/2 rounded-xl border border-white/10 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-xl"
                          >
                            <div className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                              Transition
                            </div>

                            {/* VISUAL TRANSITION PREVIEW */}

                            {(() => {
                              const nextScene =
                                scenes[
                                  index + 1
                                ];

                              const transitionType =
                                scene.transitionType ??
                                "fade";

                              const transitionDuration =
                                scene.transitionType ===
                                "none"
                                  ? 0
                                  : scene.transitionDuration ??
                                    TRANSITION_DURATION;

                              const animationName =
                                getTransitionAnimation(
                                  transitionType
                                );

                              const currentImage =
                                scene
                                  .generatedImage
                                  ?.imageUrl;

                              const nextImage =
                                nextScene
                                  ?.generatedImage
                                  ?.imageUrl;

                              return (
                                <div className="mb-4">
                                  <div className="mb-2 flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-white/50">
                                      Preview
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setTransitionPreviewKey(
                                          (
                                            value
                                          ) =>
                                            value +
                                            1
                                        )
                                      }
                                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[9px] text-white/70 transition hover:bg-white/10"
                                    >
                                      Replay
                                    </button>
                                  </div>

                                  <div
                                    key={`${scene.id}-${transitionPreviewKey}`}
                                    className="relative aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black"
                                  >
                                    {currentImage ? (
                                      <img
                                        src={
                                          currentImage
                                        }
                                        alt={`${sceneLabel(
                                          scene,
                                          index
                                        )} preview`}
                                        className="absolute inset-0 h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-cyan-950 to-zinc-950">
                                        <span className="text-[10px] text-white/40">
                                          {sceneLabel(
                                            scene,
                                            index
                                          )}
                                        </span>
                                      </div>
                                    )}

                                    {transitionType ===
                                    "none" ? (
                                      <div className="absolute inset-y-0 right-0 flex w-1/2 items-center justify-center border-l border-white/20 bg-black/30">
                                        {nextImage ? (
                                          <img
                                            src={
                                              nextImage
                                            }
                                            alt={`${sceneLabel(
                                              nextScene,
                                              index +
                                                1
                                            )} preview`}
                                            className="absolute inset-0 h-full w-full object-cover"
                                          />
                                        ) : (
                                          <span className="relative z-10 text-[9px] text-white/50">
                                            {nextScene
                                              ? sceneLabel(
                                                  nextScene,
                                                  index +
                                                    1
                                                )
                                              : "Next scene"}
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          animation:
                                            `${animationName} ` +
                                            `${Math.max(
                                              0.1,
                                              transitionDuration
                                            )}s ease-in-out 1 both`,
                                        }}
                                      >
                                        {nextImage ? (
                                          <img
                                            src={
                                              nextImage
                                            }
                                            alt={`${sceneLabel(
                                              nextScene,
                                              index +
                                                1
                                            )} preview`}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-violet-950 to-zinc-950">
                                            <span className="text-[10px] text-white/50">
                                              {nextScene
                                                ? sceneLabel(
                                                    nextScene,
                                                    index +
                                                      1
                                                  )
                                                : "Next scene"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    <div className="absolute bottom-1.5 left-1.5 z-20 rounded bg-black/70 px-1.5 py-1 text-[8px] text-white/70 backdrop-blur">
                                      {getTransitionLabel(
                                        transitionType
                                      )}{" "}
                                      ·{" "}
                                      {transitionDuration.toFixed(
                                        1
                                      )}
                                      s
                                    </div>
                                  </div>

                                  <div className="mt-2 flex items-center justify-between text-[9px] text-white/30">
                                    <span>
                                      {sceneLabel(
                                        scene,
                                        index
                                      )}
                                    </span>

                                    <span>
                                      →
                                    </span>

                                    <span>
                                      {nextScene
                                        ? sceneLabel(
                                            nextScene,
                                            index +
                                              1
                                          )
                                        : "Next scene"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* TYPE */}

                            <label className="mb-1 block text-[10px] text-white/50">
                              Type
                            </label>

                            <select
                              value={
                                scene.transitionType ??
                                "fade"
                              }
                              onChange={(e) => {
                                const transitionType =
                                  e.target.value as Scene["transitionType"];

                                void updateTransition(
                                  scene.id,
                                  {
                                    transitionType,
                                  }
                                );
                              }}
                              className="mb-3 w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="fade">
                                Fade
                              </option>

                              <option value="slide">
                                Slide
                              </option>

                              <option value="zoom">
                                Zoom
                              </option>

                              <option value="none">
                                None
                              </option>
                            </select>

                            {/* DURATION */}

                            <label className="mb-1 block text-[10px] text-white/50">
                              Duration
                            </label>

                            <select
                              value={String(
                                scene.transitionType ===
                                  "none"
                                  ? 0
                                  : scene.transitionDuration ??
                                    TRANSITION_DURATION
                              )}
                              disabled={
                                scene.transitionType ===
                                "none"
                              }
                              onChange={(e) => {
                                const transitionDuration =
                                  Number(
                                    e.target.value
                                  );

                                void updateTransition(
                                  scene.id,
                                  {
                                    transitionDuration,
                                  }
                                );
                              }}
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                            >
                              <option value="0">
                                0.0s
                              </option>

                              <option value="0.4">
                                0.4s
                              </option>

                              <option value="0.6">
                                0.6s
                              </option>

                              <option value="0.8">
                                0.8s
                              </option>

                              <option value="1">
                                1.0s
                              </option>

                              <option value="1.2">
                                1.2s
                              </option>
                            </select>

                            <div className="mt-3 border-t border-white/10 pt-2 text-[9px] text-white/30">
                              {sceneLabel(
                                scene,
                                index
                              )}{" "}
                              →{" "}
                              {sceneLabel(
                                scenes[
                                  index + 1
                                ],
                                index + 1
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )}
        </div>

        {/* TRACK */}

        <div className="absolute inset-x-0 bottom-7 h-1 bg-cyan-500/20" />

        {/* PLAYHEAD */}

        <div
          className="pointer-events-none absolute top-0 z-20 h-full w-0.5 bg-cyan-400"
          style={{
            left: `${progress}%`,
          }}
        />

        {/* CURRENT TIME LABEL */}

        <div className="absolute bottom-2 left-2 text-xs text-white/40">
          Video Track
        </div>

        {/* TOTAL DURATION */}

        <div className="absolute bottom-2 right-2 text-xs text-white/30">
          {formatTime(totalDuration)}
        </div>

        <style jsx>{`
          @keyframes timelineTransitionFade {
            from {
              opacity: 0;
            }

            to {
              opacity: 1;
            }
          }

          @keyframes timelineTransitionSlide {
            from {
              opacity: 1;
              transform: translateX(100%);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes timelineTransitionZoom {
            from {
              opacity: 0;
              transform: scale(1.12);
            }

            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}