export type CompositionPlan = {
  composition: string;
  detail: string;
};

export function getComposition(sceneType: string): CompositionPlan {
  switch (sceneType) {
    case "hook":
      return {
        composition: "Rule of thirds",
        detail: "Foreground subject with blurred background",
      };

    case "introduction":
      return {
        composition: "Wide composition",
        detail: "Environment emphasized",
      };

    case "explanation":
      return {
        composition: "Balanced composition",
        detail: "Subject naturally centered",
      };

    case "call_to_action":
      return {
        composition: "Center composition",
        detail: "Hero framing",
      };

    default:
      return {
        composition: "Hollywood cinematic composition",
        detail: "Professional framing",
      };
  }
}