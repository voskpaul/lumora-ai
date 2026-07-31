// lib/renderer/prompt-director.ts

export interface PromptDirection {
  subject: string;

  environment: string;

  shot: string;

  angle: string;

  lens: string;

  lighting: string;

  colors: string;

  composition: string;

  atmosphere: string;

  style: string;

  negative: string[];
}

export function buildPromptDirection(
  narration: string
): PromptDirection {

  const text = narration.toLowerCase();

  //--------------------------------------------------
  // Defaults
  //--------------------------------------------------

  let environment = "modern environment";

  let shot = "medium shot";

  let angle = "eye level";

  let lens = "35mm lens";

  let lighting = "soft cinematic lighting";

  let colors = "natural cinematic colors";

  let composition = "rule of thirds";

  let atmosphere = "dramatic";

  //--------------------------------------------------
  // Hooks
  //--------------------------------------------------

  if (
    text.includes("did you know") ||
    text.includes("imagine") ||
    text.includes("what if") ||
    text.includes("secret")
  ) {

    shot = "extreme close up";

    angle = "low angle";

    lighting = "high contrast lighting";

    atmosphere = "mysterious";

  }

  //--------------------------------------------------
  // AI / Technology
  //--------------------------------------------------

  if (
    text.includes("ai") ||
    text.includes("artificial intelligence") ||
    text.includes("technology") ||
    text.includes("developer") ||
    text.includes("coding")
  ) {

    environment = "futuristic workspace";

    colors = "blue neon color palette";

    lighting = "modern cyber lighting";

  }

  //--------------------------------------------------
  // Nature
  //--------------------------------------------------

  if (
    text.includes("forest") ||
    text.includes("mountain") ||
    text.includes("ocean") ||
    text.includes("river")
  ) {

    environment = "beautiful natural landscape";

    lighting = "golden hour lighting";

    colors = "vibrant nature colors";

  }

  //--------------------------------------------------
  // Business / Success
  //--------------------------------------------------

  if (
    text.includes("money") ||
    text.includes("success") ||
    text.includes("business") ||
    text.includes("million")
  ) {

    environment = "luxury modern office";

    colors = "gold and black";

    lighting = "premium cinematic lighting";

  }

  //--------------------------------------------------
  // Emotional
  //--------------------------------------------------

  if (
    text.includes("sad") ||
    text.includes("cry") ||
    text.includes("loss") ||
    text.includes("alone")
  ) {

    lighting = "moody cinematic lighting";

    colors = "desaturated cool colors";

    atmosphere = "emotional";

  }

  //--------------------------------------------------
  // Ending / CTA
  //--------------------------------------------------

  if (
    text.includes("follow") ||
    text.includes("subscribe") ||
    text.includes("like") ||
    text.includes("comment")
  ) {

    shot = "wide shot";

    lighting = "bright cinematic lighting";

    atmosphere = "uplifting";

  }

  return {

    subject: narration,

    environment,

    shot,

    angle,

    lens,

    lighting,

    colors,

    composition,

    atmosphere,

    style: "ultra realistic cinematic photography",

    negative: [

      "text",

      "captions",

      "logo",

      "watermark",

      "low quality",

      "blurry",

      "deformed",

      "cropped"

    ]

  };

}

export function buildPrompt(
  direction: PromptDirection
): string {

  return `
${direction.style},

${direction.subject},

inside a ${direction.environment},

${direction.shot},

${direction.angle},

${direction.lens},

${direction.lighting},

${direction.colors},

${direction.composition},

${direction.atmosphere},

masterpiece,
professional photography,
8K,
HDR,
volumetric lighting,
global illumination,
depth of field,
photorealistic,
ultra detailed,

${direction.negative.map(n => `no ${n}`).join(", ")}
`
.replace(/\n+/g, " ")
.replace(/\s+/g, " ")
.trim();

}