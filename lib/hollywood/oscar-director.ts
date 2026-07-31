import type { ContinuityScene } from "../storyboard/continuity-engine";
import { buildCinematography } from "./cinematographer";
import { buildProductionDesign } from "./production-designer";

export function buildHollywoodDirectorPrompt(
  continuity: ContinuityScene,
  narration: string
): string {

  const cinematography = buildCinematography(
    narration,
    continuity.scene.sceneType
  );

  const production = buildProductionDesign(
    narration
  );

  return `
Oscar-winning cinematic frame.

${continuity.continuityPrompt}

Scene Description:

${narration}

PRODUCTION DESIGN

Environment:
${production.environment}

Architecture:
${production.architecture}

Props:
${production.props}

Atmosphere:
${production.atmosphere}

Textures:
${production.textures}

Visual Style:
${production.realism}

CINEMATOGRAPHY

Shot:
${cinematography.shot}

Lens:
${cinematography.lens}

Camera Angle:
${cinematography.angle}

Camera Movement:
${cinematography.movement}

Focus:
${cinematography.focus}

Transition:
${cinematography.transition}

Editing Rhythm:
${cinematography.pacing}

DIRECTOR STYLE

Hollywood blockbuster.

Roger Deakins cinematography.

Christopher Nolan realism.

Denis Villeneuve lighting.

Natural skin pores.

True human anatomy.

Practical lighting.

Volumetric lighting.

Film grain.

Kodak Vision3 color science.

Global illumination.

Photorealistic.

Ultra realistic.

8K HDR.

Vertical composition.

Perfect continuity.

No text.

No subtitles.

No captions.

No logo.

No watermark.

No blur.

No duplicate people.

No cropped body.

No extra limbs.

No deformed anatomy.

No artifacts.
`
    .replace(/\n{2,}/g, "\n")
    .trim();
}