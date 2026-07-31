export function getQuality(): string {
  return `
masterpiece,
best quality,
award-winning photography,
Hollywood cinematography,
IMAX film still,
cinematic composition,
photorealistic,
ultra realistic,
extremely detailed,
8K,
HDR,
RAW photography,
global illumination,
volumetric lighting,
ray tracing,
sharp focus,
depth of field,
35mm anamorphic lens,
professional color grading,
film grain,
realistic skin texture,
natural anatomy,
high detail,
epic cinematic atmosphere
`
    .replace(/\n/g, " ")
    .trim();
}