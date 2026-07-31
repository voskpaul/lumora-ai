export function distributeSceneDurations(
  totalDuration: number,
  imageCount: number
): number[] {
  const weights = Array.from(
    { length: imageCount },
    () => 0.8 + Math.random() * 0.4
  );

  const totalWeight = weights.reduce(
    (a, b) => a + b,
    0
  );

  return weights.map(
    (w) => (w / totalWeight) * totalDuration
  );
}