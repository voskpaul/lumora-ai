export function motionForScene(type: string) {

  switch (type) {

    case "hook":
      return "zoomIn";

    case "introduction":
      return "panLeft";

    case "explanation":
      return "panRight";

    case "call_to_action":
      return "zoomOut";

    default:
      return "panUp";
  }

}