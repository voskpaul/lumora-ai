export type MotionPreset =
  | "zoomIn"
  | "zoomOut"
  | "panLeft"
  | "panRight"
  | "panUp"
  | "panDown";

const motions: MotionPreset[] = [
  "zoomIn",
  "zoomOut",
  "panLeft",
  "panRight",
  "panUp",
  "panDown",
];

export function getRandomMotion(): MotionPreset {
  return motions[
    Math.floor(Math.random() * motions.length)
  ];
}