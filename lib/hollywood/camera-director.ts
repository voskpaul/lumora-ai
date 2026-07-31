export type CameraPlan = {
  shot: string;
  angle: string;
  lens: string;
  movement: string;
};

export function getCamera(sceneType: string): CameraPlan {
  switch (sceneType) {
    case "hook":
      return {
        shot: "Extreme close-up",
        angle: "Low angle",
        lens: "35mm anamorphic",
        movement: "Slow cinematic push in",
      };

    case "introduction":
      return {
        shot: "Wide establishing shot",
        angle: "Eye level",
        lens: "24mm cinematic",
        movement: "Slow pan",
      };

    case "explanation":
      return {
        shot: "Medium shot",
        angle: "Eye level",
        lens: "50mm",
        movement: "Gentle tracking",
      };

    case "call_to_action":
      return {
        shot: "Hero shot",
        angle: "Slight low angle",
        lens: "85mm",
        movement: "Slow zoom out",
      };

    default:
      return {
        shot: "Cinematic shot",
        angle: "Eye level",
        lens: "50mm",
        movement: "Smooth cinematic motion",
      };
  }
}