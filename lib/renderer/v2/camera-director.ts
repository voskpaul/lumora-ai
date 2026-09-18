export type CameraMotion =
  | "pushIn"
  | "pullOut"
  | "panLeft"
  | "panRight"
  | "panUp"
  | "panDown"
  | "driftLeft"
  | "driftRight"
  | "orbit"
  | "handheld"
  | "zoomIn"
  | "zoomOut"
  | "static"
  | "crashZoom"
  | "dollyIn"
  | "dollyOut"
  | "truckLeft"
  | "truckRight"
  | "droneUp"
  | "macroSlide"
  | "whipPan"
  | "tiltUp"
  | "tiltDown";

type SceneInfo = {
  prompt: string;
  duration: number;
  beatStrength: number;
  preferredMotion?: string;
};

const VALID_MOTIONS: CameraMotion[] = [
  "pushIn",
  "pullOut",
  "panLeft",
  "panRight",
  "panUp",
  "panDown",
  "driftLeft",
  "driftRight",
  "orbit",
  "handheld",
  "zoomIn",
  "zoomOut",
  "static",

  // Advanced cinematic motions
  "crashZoom",
  "dollyIn",
  "dollyOut",
  "truckLeft",
  "truckRight",
  "droneUp",
  "macroSlide",
  "whipPan",
  "tiltUp",
  "tiltDown",
];

function isValidCameraMotion(
  motion: string
): motion is CameraMotion {
  return VALID_MOTIONS.includes(
    motion as CameraMotion
  );
}

export function chooseCamera(
  scene: SceneInfo
): CameraMotion {

  //----------------------------------------
  // PREFERRED MOTION
  //----------------------------------------

  if (
    scene.preferredMotion &&
    isValidCameraMotion(scene.preferredMotion)
  ) {
    console.log(
      "🎥 CAMERA DIRECTOR: Using selected motion:",
      scene.preferredMotion
    );

    return scene.preferredMotion;
  }

  const text = scene.prompt.toLowerCase();

  //----------------------------------------
  // EMOTIONAL KEYWORDS
  //----------------------------------------

  if (
    text.includes("explosion") ||
    text.includes("battle") ||
    text.includes("war") ||
    text.includes("fight") ||
    text.includes("breaking")
  ) {
    if (scene.beatStrength > 0.7) {
      return "handheld";
    }

    return "orbit";
  }

  //----------------------------------------
  // LUXURY / CINEMATIC / TRAVEL
  //----------------------------------------

  if (
    text.includes("luxury") ||
    text.includes("cinematic") ||
    text.includes("beautiful") ||
    text.includes("travel")
  ) {
    return "pushIn";
  }

  //----------------------------------------
  // TECHNOLOGY
  //----------------------------------------

  if (
    text.includes("technology") ||
    text.includes("future") ||
    text.includes("ai") ||
    text.includes("robot")
  ) {
    return "driftRight";
  }

  //----------------------------------------
  // HISTORY
  //----------------------------------------

  if (
    text.includes("history") ||
    text.includes("old") ||
    text.includes("ancient")
  ) {
    return "panLeft";
  }

  //----------------------------------------
  // BEAT INTENSITY
  //----------------------------------------

  if (scene.beatStrength > 0.85) {
    return "zoomIn";
  }

  if (scene.beatStrength > 0.65) {
    return "pushIn";
  }

  if (scene.beatStrength < 0.25) {
    return "static";
  }

  //----------------------------------------
  // DURATION
  //----------------------------------------

  if (scene.duration > 8) {
    return "driftLeft";
  }

  if (scene.duration < 2) {
    return "zoomIn";
  }

  //----------------------------------------
  // DEFAULT
  //----------------------------------------

  return "panUp";
}