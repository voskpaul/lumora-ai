import type { ScenePrompt } from "./ai-scene-prompts";

export type ColorPlan = {
  saturation: number;
  contrast: number;
  brightness: number;
  gamma: number;
};

export function buildColorPlan(
  scene: ScenePrompt
): ColorPlan {

  switch (scene.emotion) {

    case "excited":
      return {
        saturation: 1.25,
        contrast: 1.15,
        brightness: 0.03,
        gamma: 1.02,
      };

    case "dramatic":
      return {
        saturation: 0.92,
        contrast: 1.30,
        brightness: -0.02,
        gamma: 0.98,
      };

    case "inspiring":
      return {
        saturation: 1.10,
        contrast: 1.08,
        brightness: 0.04,
        gamma: 1.03,
      };

    case "curious":
      return {
        saturation: 1.15,
        contrast: 1.10,
        brightness: 0.02,
        gamma: 1.01,
      };

    default:
      return {
        saturation: 1,
        contrast: 1,
        brightness: 0,
        gamma: 1,
      };

  }

}