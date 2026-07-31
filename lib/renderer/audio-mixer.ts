import type { ScenePrompt } from "./ai-scene-prompts";

export type AudioMixPlan = {
  musicGain: number;
  narrationGain: number;
  ducking: boolean;
  fadeIn: number;
  fadeOut: number;
};

export function buildAudioMix(
  scene: ScenePrompt
): AudioMixPlan {

  switch (scene.emotion) {

    case "excited":
      return {
        musicGain: 0.55,
        narrationGain: 1,
        ducking: true,
        fadeIn: 0.3,
        fadeOut: 0.3,
      };

    case "dramatic":
      return {
        musicGain: 0.75,
        narrationGain: 1,
        ducking: true,
        fadeIn: 1,
        fadeOut: 1,
      };

    case "urgent":
      return {
        musicGain: 0.65,
        narrationGain: 1,
        ducking: true,
        fadeIn: 0.2,
        fadeOut: 0.2,
      };

    default:
      return {
        musicGain: 0.45,
        narrationGain: 1,
        ducking: true,
        fadeIn: 0.5,
        fadeOut: 0.5,
      };

  }

}