export type DirectorDecision = {
  motion: string;
  transition: string;
  emphasis: number;
  durationWeight: number;
};

export function directScene(type: string): DirectorDecision {

  switch (type) {

    case "hook":
      return {
        motion: "zoomIn",
        transition: "fade",
        emphasis: 1.5,
        durationWeight: 1.4,
      };

    case "introduction":
      return {
        motion: "panLeft",
        transition: "fadeblack",
        emphasis: 1.1,
        durationWeight: 1.0,
      };

    case "explanation":
      return {
        motion: "panRight",
        transition: "slideleft",
        emphasis: 1.0,
        durationWeight: 1.0,
      };

    case "call_to_action":
      return {
        motion: "zoomOut",
        transition: "circleclose",
        emphasis: 1.3,
        durationWeight: 1.2,
      };

    default:
      return {
        motion: "panUp",
        transition: "fade",
        emphasis: 1.0,
        durationWeight: 1.0,
      };
  }
}