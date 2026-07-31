export function applyDirectorTiming(
  durations: number[],
  weights: number[],
  targetDuration: number
): number[] {

  const weighted = durations.map((duration, index) => {
    return duration * weights[index];
  });

  const totalWeighted = weighted.reduce(
    (sum, value) => sum + value,
    0
  );

  if (totalWeighted === 0) {
    return durations;
  }

  const scale = targetDuration / totalWeighted;

  const scaled = weighted.map((value) => value * scale);

  const rounded = scaled.map((value) =>
    Math.max(1, Math.round(value))
  );

  // Ensure exact total duration

  let difference =
    targetDuration -
    rounded.reduce((a, b) => a + b, 0);

  let index = 0;

  while (difference !== 0) {

    if (difference > 0) {
      rounded[index]++;
      difference--;
    } else if (rounded[index] > 1) {
      rounded[index]--;
      difference++;
    }

    index = (index + 1) % rounded.length;
  }

  return rounded;
}