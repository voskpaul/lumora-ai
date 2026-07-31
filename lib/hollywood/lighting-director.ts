export type LightingPlan = {
  lighting: string;
  atmosphere: string;
};

export function getLighting(sceneType: string): LightingPlan {
  switch (sceneType) {
    case "hook":
      return {
        lighting: "Dramatic volumetric lighting",
        atmosphere: "Mysterious",
      };

    case "introduction":
      return {
        lighting: "Golden hour sunlight",
        atmosphere: "Warm",
      };

    case "explanation":
      return {
        lighting: "Soft studio lighting",
        atmosphere: "Clean futuristic",
      };

    case "call_to_action":
      return {
        lighting: "Sunset cinematic lighting",
        atmosphere: "Hopeful",
      };

    default:
      return {
        lighting: "Hollywood cinematic lighting",
        atmosphere: "Epic",
      };
  }
}