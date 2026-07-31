export const transitions = [
  "fade",
  "wipeleft",
  "wiperight",
  "wipeup",
  "wipedown",
  "slideleft",
  "slideright",
  "slideup",
  "slidedown",
  "circlecrop",
  "rectcrop",
  "distance",
  "fadeblack",
  "fadewhite",
];

export function randomTransition() {
  return transitions[
    Math.floor(Math.random() * transitions.length)
  ];
}

export function transitionFilter(
  index: number,
  duration: number
) {
  const transition = randomTransition();

  return {
    transition,
    offset: index * duration,
  };
}