export type CinematographyPlan = {
  lens: string;
  shot: string;
  angle: string;
  movement: string;
  focus: string;
  transition: string;
  pacing: string;
};

export function buildCinematography(
  narration: string,
  sceneType: string
): CinematographyPlan {

  const text = narration.toLowerCase();

  //--------------------------------------------------
  // SHOCK / HOOK
  //--------------------------------------------------

  if (
    sceneType === "hook" ||
    text.includes("did you know") ||
    text.includes("imagine")
  ) {
    return {
      lens: "135mm anamorphic cinema lens",
      shot: "extreme close-up",
      angle: "low angle",
      movement: "slow handheld push-in",
      focus: "extremely shallow depth of field",
      transition: "dramatic cinematic cut",
      pacing: "fast attention-grabbing rhythm",
    };
  }

  //--------------------------------------------------
  // INTRODUCTION
  //--------------------------------------------------

  if (sceneType === "introduction") {
    return {
      lens: "24mm anamorphic lens",
      shot: "wide establishing shot",
      angle: "eye level",
      movement: "slow cinematic dolly forward",
      focus: "deep environmental focus",
      transition: "slow cinematic dissolve",
      pacing: "steady introduction rhythm",
    };
  }

  //--------------------------------------------------
  // EXPLANATION
  //--------------------------------------------------

  if (
    sceneType === "explanation" ||
    text.includes("because") ||
    text.includes("explains")
  ) {
    return {
      lens: "50mm cinema prime",
      shot: "medium shot",
      angle: "eye level",
      movement: "slow slider movement",
      focus: "sharp subject focus",
      transition: "motivated cut",
      pacing: "comfortable educational rhythm",
    };
  }

  //--------------------------------------------------
  // TECHNOLOGY
  //--------------------------------------------------

  if (
    text.includes("ai") ||
    text.includes("chip") ||
    text.includes("computer") ||
    text.includes("technology")
  ) {
    return {
      lens: "100mm macro cinema lens",
      shot: "macro insert",
      angle: "top-down",
      movement: "slow robotic slider",
      focus: "micro-detail focus",
      transition: "match cut",
      pacing: "precise cinematic rhythm",
    };
  }

  //--------------------------------------------------
  // CTA
  //--------------------------------------------------

  if (sceneType === "call_to_action") {
    return {
      lens: "35mm cinema lens",
      shot: "hero shot",
      angle: "low angle",
      movement: "slow crane upward",
      focus: "cinematic portrait focus",
      transition: "hero reveal",
      pacing: "uplifting finale",
    };
  }

  //--------------------------------------------------
  // DEFAULT
  //--------------------------------------------------

  return {
    lens: "50mm cinema lens",
    shot: "medium cinematic shot",
    angle: "eye level",
    movement: "slow cinematic pan",
    focus: "natural shallow depth of field",
    transition: "cinematic cut",
    pacing: "balanced rhythm",
  };
}