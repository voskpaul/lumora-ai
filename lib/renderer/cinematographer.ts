import type { ScenePrompt } from "./ai-scene-prompts";

export type CameraPlan = {
  zoomSpeed: number;
  panSpeed: number;
  shake: number;
};

export function buildCameraPlan(
  scene: ScenePrompt
): CameraPlan {

  let plan: CameraPlan;

  switch (scene.type) {

    case "hook":
      plan = {
        zoomSpeed: 0.0022,
        panSpeed: 0,
        shake: 0.15,
      };
      break;

    case "introduction":
      plan = {
        zoomSpeed: 0.0012,
        panSpeed: 0.4,
        shake: 0,
      };
      break;

    case "explanation":
      plan = {
        zoomSpeed: 0.0008,
        panSpeed: 0.6,
        shake: 0,
      };
      break;

    case "call_to_action":
      plan = {
        zoomSpeed: 0.0018,
        panSpeed: 0.2,
        shake: 0,
      };
      break;

    default:
      plan = {
        zoomSpeed: 0.001,
        panSpeed: 0.3,
        shake: 0,
      };
  }

  // AI Emotion Engine boost
  plan.zoomSpeed *= scene.cameraBoost;
  plan.panSpeed *= scene.cameraBoost;
  plan.shake *= scene.cameraBoost;

  return plan;
}