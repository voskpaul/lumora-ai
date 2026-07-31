import { buildEmotionPlan } from "./emotion-director";

const tests = [
  "Did you know AI is changing the world?",
  "The future belongs to creators.",
  "This secret will surprise you.",
  "Follow for more AI videos.",
];

for (const text of tests) {
  console.log("\n==========================");
  console.log(text);
  console.log(buildEmotionPlan(text));
}