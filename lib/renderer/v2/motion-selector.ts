import type { CameraMotionType } from "../camera-motion";

export type SceneType =
  | "hook"
  | "introduction"
  | "explanation"
  | "call_to_action"
  | "general"
  | "portrait"
  | "urban"
  | "nature"
  | "product"
  | "technology"
  | "action";

export type EmotionType =
  | "dramatic"
  | "inspiring"
  | "excited"
  | "curious"
  | "neutral";

type MotionOptions = CameraMotionType[];

/**
 * Camera motions available for each scene type.
 *
 * IMPORTANT:
 * These names must exist in camera-motion.ts.
 */
const MOTION_MAP: Record<SceneType, MotionOptions> = {
  hook: [
    "crashZoom",
    "zoomIn",
    "whipPan",
  ],

  introduction: [
    "panLeft",
    "panRight",
    "truckLeft",
    "truckRight",
  ],

  explanation: [
    "panUp",
    "panDown",
    "dollyIn",
    "orbit",
  ],

  call_to_action: [
    "zoomOut",
    "dollyOut",
    "orbit",
  ],

  action: [
    "crashZoom",
    "whipPan",
    "truckLeft",
    "truckRight",
  ],

  technology: [
    "zoomIn",
    "panLeft",
    "panRight",
    "orbit",
  ],

  product: [
    "macroSlide",
    "zoomIn",
    "dollyIn",
    "orbit",
  ],

  nature: [
    "droneUp",
    "panUp",
    "panLeft",
    "panRight",
  ],

  urban: [
    "truckLeft",
    "truckRight",
    "panLeft",
    "panRight",
  ],

  portrait: [
    "zoomIn",
    "dollyIn",
    "macroSlide",
    "static",
  ],

  general: [
    "panLeft",
    "panRight",
    "dollyIn",
    "zoomOut",
  ],
};

/**
 * Returns an emotion-based motion preference.
 */
function getEmotionMotion(
  emotion: EmotionType,
  sceneType: SceneType
): CameraMotionType | null {
  switch (emotion) {
    // ----------------------------------------
    // DRAMATIC
    // ----------------------------------------

    case "dramatic":
      if (
        sceneType === "action" ||
        sceneType === "hook"
      ) {
        return "crashZoom";
      }

      return "dollyIn";

    // ----------------------------------------
    // INSPIRING
    // ----------------------------------------

    case "inspiring":
      if (
        sceneType === "nature" ||
        sceneType === "general"
      ) {
        return "droneUp";
      }

      return "zoomIn";

    // ----------------------------------------
    // EXCITED
    // ----------------------------------------

    case "excited":
      if (sceneType === "action") {
        return "whipPan";
      }

      return "truckRight";

    // ----------------------------------------
    // CURIOUS
    // ----------------------------------------

    case "curious":
      return "zoomIn";

    // ----------------------------------------
    // NEUTRAL
    // ----------------------------------------

    case "neutral":
    default:
      return null;
  }
}

/**
 * Determines where the scene exists in the overall video.
 */
function getScenePosition(
  sceneIndex: number,
  totalSceneCount: number
): "opening" | "middle" | "ending" {
  if (totalSceneCount <= 1) {
    return "opening";
  }

  const progress =
    sceneIndex / (totalSceneCount - 1);

  if (progress <= 0.25) {
    return "opening";
  }

  if (progress >= 0.75) {
    return "ending";
  }

  return "middle";
}

/**
 * Determines whether the scene is short, medium,
 * or long compared with a normal cinematic scene.
 */
function getDurationCategory(
  duration: number
): "short" | "medium" | "long" {
  if (duration < 4) {
    return "short";
  }

  if (duration > 7) {
    return "long";
  }

  return "medium";
}

/**
 * Phase 1 intelligent camera selection.
 *
 * Camera selection now considers:
 *
 * 1. Scene type
 * 2. Scene index
 * 3. Emotion
 * 4. Scene duration
 * 5. Scene position in the video
 *
 * The actual FFmpeg implementation remains untouched.
 */
export function motionForScene(
  sceneType: SceneType,
  sceneIndex: number,
  emotion: string,
  duration: number,
  totalSceneCount: number
): CameraMotionType {
  const normalizedEmotion =
    emotion.toLowerCase() as EmotionType;

  const options =
    MOTION_MAP[sceneType] ??
    MOTION_MAP.general;

  const position = getScenePosition(
    sceneIndex,
    totalSceneCount
  );

  const durationCategory =
    getDurationCategory(duration);

  // ----------------------------------------
  // 1. STRONG EMOTION
  // ----------------------------------------

  const emotionMotion = getEmotionMotion(
    normalizedEmotion,
    sceneType
  );

  /**
   * We don't blindly allow emotion to override
   * everything anymore.
   *
   * Very short scenes need simple, readable motion.
   */
  if (
    emotionMotion &&
    durationCategory !== "short"
  ) {
    console.log(
      "🎥 MOTION SELECTOR:",
      {
        type: sceneType,
        sceneIndex,
        emotion: normalizedEmotion,
        duration,
        durationCategory,
        position,
        selectedMotion: emotionMotion,
        reason: "emotion override",
      }
    );

    return emotionMotion;
  }

  // ----------------------------------------
  // 2. SHORT SCENES
  // ----------------------------------------

  /**
   * Short scenes do not have enough time for
   * complicated camera movement.
   *
   * Prefer simple directional movements.
   */
  if (durationCategory === "short") {
    const shortOptions: CameraMotionType[] =
      options.filter(
        motion =>
          motion === "panLeft" ||
          motion === "panRight" ||
          motion === "panUp" ||
          motion === "panDown" ||
          motion === "zoomIn" ||
          motion === "zoomOut" ||
          motion === "static"
      );

    if (shortOptions.length > 0) {
      const selected =
        shortOptions[
          Math.abs(sceneIndex) %
            shortOptions.length
        ];

      console.log(
        "🎥 MOTION SELECTOR:",
        {
          type: sceneType,
          sceneIndex,
          emotion: normalizedEmotion,
          duration,
          durationCategory,
          position,
          selectedMotion: selected,
          reason: "short scene",
        }
      );

      return selected;
    }
  }

  // ----------------------------------------
  // 3. LONG SCENES
  // ----------------------------------------

  /**
   * Long scenes have enough screen time for
   * more cinematic movement.
   */
  if (durationCategory === "long") {
    const cinematicOptions: CameraMotionType[] =
      options.filter(
        motion =>
          motion === "orbit" ||
          motion === "droneUp" ||
          motion === "macroSlide" ||
          motion === "dollyIn" ||
          motion === "dollyOut" ||
          motion === "truckLeft" ||
          motion === "truckRight" ||
          motion === "panLeft" ||
          motion === "panRight"
      );

    if (cinematicOptions.length > 0) {
      const selected =
        cinematicOptions[
          Math.abs(sceneIndex) %
            cinematicOptions.length
        ];

      console.log(
        "🎥 MOTION SELECTOR:",
        {
          type: sceneType,
          sceneIndex,
          emotion: normalizedEmotion,
          duration,
          durationCategory,
          position,
          selectedMotion: selected,
          reason: "long scene",
        }
      );

      return selected;
    }
  }

  // ----------------------------------------
  // 4. OPENING SCENES
  // ----------------------------------------

  /**
   * The opening should establish visual energy.
   */
  if (position === "opening") {
    if (
      sceneType === "hook" ||
      sceneType === "action"
    ) {
      return "crashZoom";
    }

    if (sceneType === "technology") {
      return "zoomIn";
    }

    if (sceneType === "nature") {
      return "droneUp";
    }
  }

  // ----------------------------------------
  // 5. ENDING / CTA
  // ----------------------------------------

  /**
   * The final scene should feel like a conclusion
   * rather than another random camera movement.
   */
  if (position === "ending") {
    if (
      sceneType === "call_to_action"
    ) {
      return "zoomOut";
    }

    if (
      normalizedEmotion === "inspiring"
    ) {
      return "droneUp";
    }

    if (
      sceneType === "portrait"
    ) {
      return "static";
    }

    return "zoomOut";
  }

  // ----------------------------------------
  // 6. DETERMINISTIC FALLBACK
  // ----------------------------------------

  const index =
    Math.abs(sceneIndex) %
    options.length;

  const selectedMotion =
    options[index];

  console.log(
    "🎥 MOTION SELECTOR:",
    {
      type: sceneType,
      sceneIndex,
      emotion: normalizedEmotion,
      duration,
      durationCategory,
      position,
      options,
      selectedMotion,
      reason: "deterministic fallback",
    }
  );

  return selectedMotion;
}
