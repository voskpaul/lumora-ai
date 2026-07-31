export function splitScenes(script: string) {
  const paragraphs = script
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  return paragraphs.map((scene, index) => ({
    index: index + 1,
    text: scene,
    imagePrompt: scene,
  }));
}