import { buildCameraMotion } from "./camera-motion";

const motions = [
  "slow push in",
  "slow pull back",
  "slow pan left",
  "slow pan right",
  "slow tilt up",
  "slow tilt down",
  "handheld",
  "drone reveal",
  "orbit",
  "static",
];

for (const motion of motions) {
  console.log("\n==============================");
  console.log(motion);
  console.log(buildCameraMotion(motion, 4));
}