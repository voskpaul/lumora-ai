import type { SemanticScene } from "./semantic-scenes";
import { rewritePrompt } from "./prompt-rewriter";
import { motionForScene } from "./motion-selector";
import { analyzeEmotion } from "./emotion-engine";

export type ScenePrompt = {
  scene: number;
  duration: number;
  narration: string;

  imagePrompt: string;

  motion: string;
  type: string;

  transition: string;
  emphasis: number;
  durationWeight: number;

  emotion: string;
  pauseBefore: boolean;
  subtitleScale: number;
  cameraBoost: number;
};

function classifyScene(text: string) {
  const t = text.toLowerCase();

  if (
    t.includes("hook") ||
    t.includes("did you know") ||
    t.includes("imagine")
  ) {
    return "hook";
  }

  if (
    t.includes("today") ||
    t.includes("exploring") ||
    t.includes("learn")
  ) {
    return "introduction";
  }

  if (
    t.includes("important") ||
    t.includes("because") ||
    t.includes("experts") ||
    t.includes("believe")
  ) {
    return "explanation";
  }

  if (
    t.includes("follow") ||
    t.includes("subscribe") ||
    t.includes("like") ||
    t.includes("comment")
  ) {
    return "call_to_action";
  }

  return "general";
}

export async function buildScenePrompts(
  scenes: SemanticScene[]
): Promise<ScenePrompt[]> {

  const prompts: ScenePrompt[] = [];

  for (let i = 0; i < scenes.length; i++) {

    const scene = scenes[i];

    const type = classifyScene(scene.text) as
      | "hook"
      | "introduction"
      | "explanation"
      | "call_to_action"
      | "general";

    //----------------------------------------
    // Rewrite Prompt
    //----------------------------------------

    const rewrittenPrompt = await rewritePrompt(
      scene.text,
      type
    );

    //----------------------------------------
    // Emotion Analysis
    //----------------------------------------

    const emotion = analyzeEmotion(scene.text);

    //----------------------------------------
    // Camera Motion
    //----------------------------------------

    const motion = motionForScene(type);

    //----------------------------------------
    // Transition
    //----------------------------------------

    let transition = "fade";

    switch (type) {
      case "introduction":
        transition = "fadeblack";
        break;

      case "explanation":
        transition = "slideleft";
        break;

      case "call_to_action":
        transition = "circleclose";
        break;
    }

    //----------------------------------------
    // Duration Weight
    //----------------------------------------

    let durationWeight = 1;

    switch (type) {
      case "hook":
        durationWeight = 1.4;
        break;

      case "call_to_action":
        durationWeight = 1.2;
        break;
    }

    //----------------------------------------
    // Build Scene Prompt
    //----------------------------------------

    prompts.push({
      scene: i,

      duration: scene.duration,

      narration: scene.text,

      imagePrompt: rewrittenPrompt,

      motion,

      type,

      transition,

      emphasis: emotion.emphasis,

      durationWeight,

      emotion: emotion.emotion,

      pauseBefore: emotion.pauseBefore,

      subtitleScale: emotion.subtitleScale,

      cameraBoost: emotion.cameraBoost,
    });
  }

  return prompts;
}