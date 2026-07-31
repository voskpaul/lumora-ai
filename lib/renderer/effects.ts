/**
 * Common FFmpeg video effects.
 * These functions simply return FFmpeg filter strings.
 * They are reusable throughout the renderer.
 */

/**
 * Fade in
 */
export function fadeIn(seconds = 0.5) {
  return `fade=t=in:st=0:d=${seconds}`;
}

/**
 * Fade out
 */
export function fadeOut(
  videoDuration: number,
  seconds = 0.5
) {
  const start = Math.max(0, videoDuration - seconds);

  return `fade=t=out:st=${start}:d=${seconds}`;
}

/**
 * Slight sharpening
 */
export function sharpen() {
  return "unsharp=5:5:1.0:5:5:0.0";
}

/**
 * Increase saturation a bit
 */
export function saturation(value = 1.15) {
  return `eq=saturation=${value}`;
}

/**
 * Slight brightness adjustment
 */
export function brightness(value = 0.03) {
  return `eq=brightness=${value}`;
}

/**
 * Slight contrast boost
 */
export function contrast(value = 1.08) {
  return `eq=contrast=${value}`;
}

/**
 * Vibrance (using eq approximation)
 */
export function cinematicColor() {
  return [
    "eq=saturation=1.18",
    "eq=contrast=1.08",
    "eq=brightness=0.02",
  ].join(",");
}

/**
 * Gaussian blur
 */
export function blur(radius = 2) {
  return `gblur=sigma=${radius}`;
}

/**
 * Slight vignette
 */
export function vignette() {
  return "vignette";
}

/**
 * Combine multiple filters safely.
 */
export function combineEffects(...filters: string[]) {
  return filters.filter(Boolean).join(",");
}