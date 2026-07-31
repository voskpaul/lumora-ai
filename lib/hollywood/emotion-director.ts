export type EmotionPlan = {
  emotion: string;

  lighting: string;

  colorPalette: string;

  atmosphere: string;

  pacing: string;

  cameraStyle: string;

  moodKeywords: string[];
};

export function buildEmotionPlan(
  narration: string
): EmotionPlan {

  const text = narration.toLowerCase();

  //------------------------------------------------
  // SHOCK
  //------------------------------------------------

  if (
    text.includes("did you know") ||
    text.includes("unbelievable") ||
    text.includes("shocking")
  ) {
    return {
      emotion: "shock",

      lighting:
        "high contrast dramatic cinematic lighting",

      colorPalette:
        "deep blue, black, white highlights",

      atmosphere:
        "intense cinematic tension",

      pacing:
        "fast dramatic rhythm",

      cameraStyle:
        "handheld cinematic realism",

      moodKeywords: [
        "dramatic",
        "intense",
        "powerful",
        "cinematic",
      ],
    };
  }

  //------------------------------------------------
  // INSPIRATION
  //------------------------------------------------

  if (
    text.includes("success") ||
    text.includes("dream") ||
    text.includes("future") ||
    text.includes("achievement")
  ) {
    return {
      emotion: "inspiration",

      lighting:
        "golden hour cinematic sunlight",

      colorPalette:
        "warm gold, orange, natural skin tones",

      atmosphere:
        "hopeful cinematic atmosphere",

      pacing:
        "uplifting cinematic rhythm",

      cameraStyle:
        "smooth crane movement",

      moodKeywords: [
        "hope",
        "dream",
        "success",
        "beautiful",
      ],
    };
  }

  //------------------------------------------------
  // MYSTERY
  //------------------------------------------------

  if (
    text.includes("secret") ||
    text.includes("mystery") ||
    text.includes("hidden")
  ) {
    return {
      emotion: "mystery",

      lighting:
        "low-key cinematic lighting",

      colorPalette:
        "dark blue, teal, black",

      atmosphere:
        "cinematic fog and suspense",

      pacing:
        "slow suspense rhythm",

      cameraStyle:
        "slow push-in",

      moodKeywords: [
        "mysterious",
        "hidden",
        "cinematic suspense",
      ],
    };
  }

  //------------------------------------------------
  // TECHNOLOGY
  //------------------------------------------------

  if (
    text.includes("ai") ||
    text.includes("technology") ||
    text.includes("software")
  ) {
    return {
      emotion: "innovation",

      lighting:
        "clean futuristic LED lighting",

      colorPalette:
        "cyan, white, black",

      atmosphere:
        "modern technological realism",

      pacing:
        "precise cinematic rhythm",

      cameraStyle:
        "robotic smooth movement",

      moodKeywords: [
        "innovation",
        "future",
        "advanced",
      ],
    };
  }

  //------------------------------------------------
  // CTA
  //------------------------------------------------

  if (
    text.includes("follow") ||
    text.includes("subscribe") ||
    text.includes("like")
  ) {
    return {
      emotion: "excitement",

      lighting:
        "bright energetic cinematic lighting",

      colorPalette:
        "vibrant red, blue, orange",

      atmosphere:
        "high energy",

      pacing:
        "fast energetic pacing",

      cameraStyle:
        "hero reveal movement",

      moodKeywords: [
        "exciting",
        "viral",
        "energetic",
      ],
    };
  }

  //------------------------------------------------
  // DEFAULT
  //------------------------------------------------

  return {
    emotion: "neutral",

    lighting:
      "balanced cinematic lighting",

    colorPalette:
      "natural realistic colors",

    atmosphere:
      "professional cinematic realism",

    pacing:
      "balanced pacing",

    cameraStyle:
      "cinematic steady camera",

    moodKeywords: [
      "realistic",
      "cinematic",
    ],
  };
}

export function getEmotion(sceneType: string): string {
  switch (sceneType) {
    case "hook":
      return "mysterious, suspenseful";

    case "introduction":
      return "curious, optimistic";

    case "explanation":
      return "focused, intelligent";

    case "call_to_action":
      return "inspiring, energetic";

    default:
      return "cinematic";
  }
}