export function getColorPalette(sceneType: string): string {
  switch (sceneType) {
    case "hook":
      return "deep blue and orange cinematic grading";

    case "introduction":
      return "warm golden daylight color grading";

    case "explanation":
      return "clean futuristic blue grading";

    case "call_to_action":
      return "golden cinematic sunset grading";

    default:
      return "Hollywood cinematic color grading";
  }
}