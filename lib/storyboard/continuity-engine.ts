import type { StoryboardScene } from "./scene-splitter";
import type { SubjectMemory } from "./subject-memory";
import type { EnvironmentMemory } from "./environment-memory";
import type { ShotPlan } from "./shot-director";

export type ContinuityScene = {
  scene: StoryboardScene;

  subject: SubjectMemory;

  environment: EnvironmentMemory;

  shot: ShotPlan;

  continuityPrompt: string;
};

export function buildContinuityScene(
  scene: StoryboardScene,
  subject: SubjectMemory,
  environment: EnvironmentMemory,
  shot: ShotPlan
): ContinuityScene {

  const continuityPrompt = `
Main subject:
${subject.mainSubject}

Appearance:
${subject.appearance}

Clothing:
${subject.clothing}

Age:
${subject.age}

Gender:
${subject.gender}

Location:
${environment.primaryLocation}

Architecture:
${environment.architecture}

Atmosphere:
${environment.atmosphere}

Weather:
${environment.weather}

Time:
${environment.timeOfDay}

Camera Shot:
${shot.shot}

Camera Angle:
${shot.angle}

Lens:
${shot.lens}

Camera Movement:
${shot.movement}

Framing:
${shot.framing}

Continuity:
${subject.consistencyNote}

Environment Continuity:
${environment.consistencyNote}
`
    .replace(/\n{2,}/g, "\n")
    .trim();

  return {
    scene,
    subject,
    environment,
    shot,
    continuityPrompt,
  };
}