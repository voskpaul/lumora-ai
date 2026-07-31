import type { ScenePrompt } from "./ai-scene-prompts";

export type EditPlan = {
  speed: number;
  blur: boolean;
  vignette: boolean;
  saturation: number;
  contrast: number;
};

export function buildEditPlan(
  scene: ScenePrompt
): EditPlan {

  switch (scene.emotion) {

    case "excited":
      return {
        speed: 1.05,
        blur: false,
        vignette: false,
        saturation: 1.25,
        contrast: 1.15,
      };

    case "dramatic":
      return {
        speed: 0.95,
        blur: false,
        vignette: true,
        saturation: 0.9,
        contrast: 1.3,
      };

    case "urgent":
      return {
        speed: 1.08,
        blur: false,
        vignette: false,
        saturation: 1.2,
        contrast: 1.2,
      };

    default:
      return {
        speed: 1,
        blur: false,
        vignette: false,
        saturation: 1,
        contrast: 1,
      };
  }

}