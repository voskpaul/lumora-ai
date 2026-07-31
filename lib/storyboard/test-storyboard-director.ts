import { buildStoryboardDirector } from "./storyboard-director";

import type { SemanticScene } from "../renderer/semantic-scenes";

const semanticScenes: SemanticScene[] = [
  {
    text: "Did you know AI can create Hollywood-quality videos?",
    start: 0,
    end: 3,
    duration: 3,
  },
  {
    text: "Today we're exploring the future of AI filmmaking.",
    start: 3,
    end: 6,
    duration: 3,
  },
  {
    text: "AI automatically generates cinematic scenes with realistic lighting.",
    start: 6,
    end: 9,
    duration: 3,
  },
  {
    text: "Follow for more AI content.",
    start: 9,
    end: 12,
    duration: 3,
  },
];

const storyboard = buildStoryboardDirector(
  semanticScenes
);

console.log("\n========== STORYBOARD DIRECTOR ==========\n");

console.table(
  storyboard.map((scene) => ({
    scene: scene.scene.id,
    type: scene.scene.sceneType,
    subject: scene.subject.mainSubject,
    location: scene.environment.primaryLocation,
    shot: scene.shot.shot,
    movement: scene.shot.movement,
  }))
);

storyboard.forEach((scene) => {
  console.log("\n--------------------------------");
  console.log(`Scene ${scene.scene.id}`);
  console.log(`Type: ${scene.scene.sceneType}`);
  console.log(`Duration: ${scene.scene.narration.length}`);

  console.log("\nPROMPT\n");
  console.log(scene.finalPrompt);
});