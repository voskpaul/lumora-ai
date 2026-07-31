export function buildSubject(narration: string): string {
  const text = narration.toLowerCase();

  if (
    text.includes("developer") ||
    text.includes("programming") ||
    text.includes("coding") ||
    text.includes("software") ||
    text.includes("ai")
  ) {
    return `
A young software engineer interacting with futuristic AI holograms,
multiple transparent displays,
high-tech workstation,
natural facial expression,
photorealistic,
realistic hands,
cinematic pose
`
      .replace(/\n/g, " ")
      .trim();
  }

  if (
    text.includes("space") ||
    text.includes("planet") ||
    text.includes("galaxy")
  ) {
    return `
A breathtaking astronaut exploring deep space,
massive planets,
bright nebulae,
cinematic realism
`
      .replace(/\n/g, " ")
      .trim();
  }

  if (
    text.includes("forest") ||
    text.includes("nature") ||
    text.includes("wildlife")
  ) {
    return `
Beautiful untouched forest,
realistic wildlife,
morning sunlight,
photorealistic documentary photography
`
      .replace(/\n/g, " ")
      .trim();
  }

  if (
    text.includes("city") ||
    text.includes("building")
  ) {
    return `
Modern futuristic city skyline,
luxury architecture,
cinematic realism
`
      .replace(/\n/g, " ")
      .trim();
  }

  return `
${narration},
photorealistic,
cinematic realism,
highly detailed subject
`
    .replace(/\n/g, " ")
    .trim();
}