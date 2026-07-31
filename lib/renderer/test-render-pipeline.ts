import { runRenderPipeline } from "./render-pipeline";
import type { SemanticScene } from "./semantic-scenes";

const scenes: SemanticScene[] = [
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
    text: "AI automatically generates cinematic scenes.",
    start: 6,
    end: 8,
    duration: 2,
  },
  {
    text: "Follow for more AI content.",
    start: 8,
    end: 10,
    duration: 2,
  },
];

const pipeline = runRenderPipeline(scenes);

console.log("\n========== RENDER PIPELINE ==========\n");

console.table({
  totalScenes: pipeline.totalScenes,
  totalDuration: pipeline.totalDuration,
});

pipeline.scenes.forEach((scene) => {
  console.log("\n--------------------------------");
  console.log(`Scene ${scene.id}`);
  console.log(`Duration: ${scene.duration}s`);
  console.log(`Shot: ${scene.camera.shot}`);
  console.log(`Angle: ${scene.camera.angle}`);
  console.log(`Lens: ${scene.camera.lens}`);
  console.log(`Movement: ${scene.camera.movement}`);
  console.log(`Location: ${scene.environment.location}`);
});