import { rewritePrompt } from "../prompt-rewriter";
import { motionForScene, type SceneType } from "./motion-selector";
import { analyzeEmotion } from "../emotion-engine";
import { ColorGrade } from "./color-grade";

export type ScenePrompt = {
  sceneIndex: number;
  prompt: string;
  motion: string;
  durationWeight: number;
  emotion: string;
  colorGrade: ColorGrade;
  sceneType: SceneType;
};

function detectSceneType(text: string): SceneType {
  const t = text.toLowerCase();

  // ----------------------------------------
  // ACTION
  // ----------------------------------------

  if (
    /\b(fight|fighting|run|running|chase|chasing|explosion|explodes|battle|combat|attack|attacking|crash|crashing|jump|jumping|fall|falling|shoot|shooting|race|racing|destroy|destruction)\b/.test(
      t
    )
  ) {
    return "action";
  }

  // ----------------------------------------
  // TECHNOLOGY
  // ----------------------------------------

  if (
    /\b(technology|tech|ai|artificial intelligence|robot|robotics|software|algorithm|code|coding|programming|computer|machine learning|neural network|automation|app|application|data|database|cloud|cyber|digital|internet|website|web|api|developer|development|saas)\b/.test(
      t
    )
  ) {
    return "technology";
  }

  // ----------------------------------------
  // PRODUCT
  // ----------------------------------------

  if (
    /\b(product|phone|smartphone|iphone|android|laptop|computer|camera|car|vehicle|watch|tablet|headphones|shoes|clothing|bottle|device|gadget|screen|keyboard|mouse|tesla|mercedes|toyota|productivity)\b/.test(
      t
    )
  ) {
    return "product";
  }

  // ----------------------------------------
  // NATURE
  // ----------------------------------------

  if (
    /\b(forest|jungle|mountain|mountains|ocean|sea|river|lake|waterfall|beach|desert|valley|island|nature|wildlife|animal|animals|tree|trees|flower|flowers|sunset|sunrise|sky|clouds|rain|snow|earth|planet)\b/.test(
      t
    )
  ) {
    return "nature";
  }

  // ----------------------------------------
  // URBAN
  // ----------------------------------------

  if (
    /\b(city|cities|street|streets|building|buildings|office|offices|downtown|urban|skyscraper|tower|traffic|road|highway|subway|metro|apartment|restaurant|shopping mall|store|business district)\b/.test(
      t
    )
  ) {
    return "urban";
  }

  // ----------------------------------------
  // PORTRAIT
  // ----------------------------------------

  if (
    /\b(person|people|man|woman|child|children|boy|girl|face|portrait|human|humans|personality|speaker|founder|developer|creator|customer|worker|employee|student|teacher|doctor|leader|entrepreneur)\b/.test(
      t
    )
  ) {
    return "portrait";
  }

  // ----------------------------------------
  // GENERAL
  // ----------------------------------------

  return "general";
}

function getColorGrade(emotion: string): ColorGrade {
  switch (emotion) {
    case "dramatic":
      return "horror";

    case "inspiring":
      return "travel";

    case "excited":
      return "luxury";

    case "curious":
      return "corporate";

    case "neutral":
    default:
      return "cinematic";
  }
}

export async function buildScenePrompts(
  scenes: {
    text: string;
    duration: number;
  }[]
): Promise<ScenePrompt[]> {
  const prompts: ScenePrompt[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];

    // ----------------------------------------
    // SCENE TYPE
    // ----------------------------------------

    const sceneType = detectSceneType(scene.text);

    console.log(
      `🎬 Scene ${i + 1} type:`,
      sceneType
    );

    // ----------------------------------------
    // EMOTION
    // ----------------------------------------

    const emotion = analyzeEmotion(scene.text);

    // ----------------------------------------
    // CINEMATIC IMAGE PROMPT
    // ----------------------------------------

    const prompt = await rewritePrompt(
      scene.text,
      sceneType
    );

    // ----------------------------------------
    // COLOR GRADE
    // ----------------------------------------

    const colorGrade = getColorGrade(
      emotion.emotion
    );

    // ----------------------------------------
    // DURATION WEIGHT
    // ----------------------------------------

    const durationWeight = Math.max(
      0.7,
      Math.min(
        1.6,
        scene.duration / 5
      )
    );

    // ----------------------------------------
    // CAMERA MOTION
    // ----------------------------------------
    //
    // Phase 1:
    // The camera director now receives:
    //
    // 1. Scene type
    // 2. Scene index
    // 3. Emotion
    // 4. Scene duration
    // 5. Total scene count
    //
    // This allows motion-selector.ts to make
    // duration-aware and position-aware decisions.
    // ----------------------------------------

    const motion = motionForScene(
      sceneType,
      i,
      emotion.emotion,
      scene.duration,
      scenes.length
    );

    console.log(
      `📷 Scene ${i + 1} camera motion:`,
      {
        motion,
        duration: scene.duration,
        type: sceneType,
        emotion: emotion.emotion,
      }
    );

    // ----------------------------------------
    // FINAL SCENE PROMPT
    // ----------------------------------------

    prompts.push({
  sceneIndex: i,
  prompt,
  motion,
  durationWeight,
  emotion: emotion.emotion,
  colorGrade,
  sceneType,
});
  }

  console.log(
    "========== SCENE PROMPTS =========="
  );

  console.table(
    prompts.map((scene) => ({
      scene: scene.sceneIndex + 1,
      motion: scene.motion,
      emotion: scene.emotion,
      colorGrade: scene.colorGrade,
      weight: scene.durationWeight,
      prompt: scene.prompt.slice(0, 100),
    }))
  );

  console.log(
    "==================================="
  );

  return prompts;
}