export const TRANSITIONS = [
  "fade",
  "fadeblack",
  "fadewhite",
  "smoothleft",
  "smoothright",
  "smoothup",
  "smoothdown",
  "circleopen",
  "circleclose",
  "rectcrop",
  "distance",
  "wipeleft",
  "wiperight",
  "wipeup",
  "wipedown",
  "pixelize",
];

export function randomTransition() {

  return TRANSITIONS[
    Math.floor(
      Math.random() *
      TRANSITIONS.length
    )
  ];

}