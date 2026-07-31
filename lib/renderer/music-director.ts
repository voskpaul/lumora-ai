import type { ScenePrompt } from "./ai-scene-prompts";

export type MusicPlan = {
  mood: "epic" | "ambient" | "emotional" | "uplifting";
  volume: number;
};

export function buildMusicPlan(scene: ScenePrompt): MusicPlan {
  switch (scene.emotion) {
    case "excited":
      return {
        mood: "epic",
        volume: 1.0,
      };

    case "dramatic":
      return {
        mood: "emotional",
        volume: 0.75,
      };

    case "urgent":
      return {
        mood: "uplifting",
        volume: 0.95,
      };

    default:
      return {
        mood: "ambient",
        volume: 0.6,
      };
  }
}