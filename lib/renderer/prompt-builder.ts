import { buildHollywoodPrompt } from "../hollywood/hollywood-director";

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

export function buildCinematicPrompt(
  narration: string,
  sceneType: SceneType
) {
  return buildHollywoodPrompt(
    narration,
    sceneType
  );
}