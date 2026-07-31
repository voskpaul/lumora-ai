import { getEmotion } from "./emotion-director";
import { getEnvironment } from "./environment-director";
import { getCamera } from "./camera-director";
import { getLighting } from "./lighting-director";
import { getComposition } from "./composition-director";
import { getColorPalette } from "./color-director";
import { buildSubject } from "./subject-director";
import { getQuality } from "./quality-director";

export function buildHollywoodPrompt(
  narration: string,
  sceneType: string
) {
  const subject = buildSubject(narration);

  const emotion = getEmotion(sceneType);

  const environment = getEnvironment(narration);

  const camera = getCamera(sceneType);

  const lighting = getLighting(sceneType);

  const composition = getComposition(sceneType);

  const colors = getColorPalette(sceneType);

  const quality = getQuality();

  return `
${subject}.

Emotion:
${emotion}

Environment:
${environment}

Camera:
${camera.shot},
${camera.angle},
${camera.lens},
${camera.movement}

Lighting:
${lighting.lighting}

Atmosphere:
${lighting.atmosphere}

Composition:
${composition.composition}

${composition.detail}

Color grading:
${colors}

${quality}

No text.
No captions.
No logo.
No watermark.
No blurry.
No cropped body.
`
    .replace(/\n{2,}/g, "\n")
    .trim();
}