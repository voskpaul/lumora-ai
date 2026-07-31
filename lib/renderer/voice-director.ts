import type { ScenePrompt } from "./ai-scene-prompts";

export type VoicePlan = {
  rate: number;
  pitch: number;
  volume: number;
  pauseAfter: number;
};

export function buildVoicePlan(
  scene: ScenePrompt
): VoicePlan {

  let rate = 1.0;
  let pitch = 0;
  let volume = 0;

  switch (scene.emotion) {

    case "excited":
      rate = 1.12;
      pitch = 2;
      volume = 4;
      break;

    case "dramatic":
      rate = 0.88;
      pitch = -2;
      volume = 2;
      break;

    case "urgent":
      rate = 1.18;
      pitch = 1;
      volume = 5;
      break;

    case "calm":
      rate = 0.95;
      pitch = -1;
      volume = 0;
      break;

    default:
      rate = 1.0;
  }

  return {
    rate,
    pitch,
    volume,
    pauseAfter: scene.pauseBefore ? 0.5 : 0,
  };
}