export type EmotionProfile = {
  emotion:
    | "excited"
    | "dramatic"
    | "curious"
    | "neutral"
    | "inspiring";

  emphasis: number;

  pauseBefore: boolean;

  subtitleScale: number;

  cameraBoost: number;
};

export function analyzeEmotion(text: string): EmotionProfile {

  const t = text.toLowerCase();

  if (
    t.includes("did you know") ||
    t.includes("imagine") ||
    t.includes("secret") ||
    t.includes("top")
  ) {
    return {
      emotion: "curious",
      emphasis: 1.4,
      pauseBefore: true,
      subtitleScale: 1.25,
      cameraBoost: 1.25,
    };
  }

  if (
    t.includes("amazing") ||
    t.includes("incredible") ||
    t.includes("unbelievable")
  ) {
    return {
      emotion: "excited",
      emphasis: 1.5,
      pauseBefore: false,
      subtitleScale: 1.3,
      cameraBoost: 1.3,
    };
  }

  if (
    t.includes("important") ||
    t.includes("warning") ||
    t.includes("never")
  ) {
    return {
      emotion: "dramatic",
      emphasis: 1.5,
      pauseBefore: true,
      subtitleScale: 1.35,
      cameraBoost: 1.4,
    };
  }

  if (
    t.includes("follow") ||
    t.includes("subscribe")
  ) {
    return {
      emotion: "inspiring",
      emphasis: 1.25,
      pauseBefore: false,
      subtitleScale: 1.2,
      cameraBoost: 1.15,
    };
  }

  return {
    emotion: "neutral",
    emphasis: 1,
    pauseBefore: false,
    subtitleScale: 1,
    cameraBoost: 1,
  };
}