export type CameraMotionType =
  | "zoomIn"
  | "zoomOut"
  | "crashZoom"
  | "dollyIn"
  | "dollyOut"
  | "panLeft"
  | "panRight"
  | "panUp"
  | "panDown"
  | "truckLeft"
  | "truckRight"
  | "tiltUp"
  | "tiltDown"
  | "orbit"
  | "droneUp"
  | "macroSlide"
  | "whipPan"
  | "handheld"
  | "static";

export type CameraMotionFilter = {
  zoompan: string;
};

export function buildCameraMotion(
  movement: string,
  duration: number
): CameraMotionFilter {

  const frames = Math.max(
    1,
    Math.round(duration * 30)
  );

  const normalized = movement
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "")
    .toLowerCase();

  /*
   * IMPORTANT:
   *
   * zoompan `d` means the number of output frames
   * generated PER INPUT FRAME.
   *
   * Since the input image is already looped at 30fps,
   * we need ONE output frame per input frame.
   *
   * Therefore:
   *
   * d=1
   *
   * The total number of frames is controlled by the
   * render-scene pipeline.
   */

  const d = 1;

  switch (normalized) {

    // ----------------------------------
    // ZOOM IN
    // ----------------------------------
    case "zoomin":
    case "push":
    case "slowpushin":
    case "dollyin":

      return {
        zoompan:
          `zoompan=` +
          `z='1+0.30*pow(on/${frames},2)':` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // CRASH ZOOM
    // ----------------------------------
    case "crashzoom":

      return {
        zoompan:
          `zoompan=` +
          `z='1+0.55*pow(on/${frames},4)':` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // ZOOM OUT
    // ----------------------------------
    case "zoomout":
    case "pull":
    case "slowpullback":
    case "dollyout":

      return {
        zoompan:
          `zoompan=` +
          `z='1.30-0.25*pow(on/${frames},2)':` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // PAN LEFT
    // ----------------------------------
    case "panleft":
    case "slowpanleft":

      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)-pow(on/${frames},2)*220':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // PAN RIGHT
    // ----------------------------------
    case "panright":
    case "slowpanright":

      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)+pow(on/${frames},2)*220':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // PAN UP
    // ----------------------------------
    case "panup":
    case "tiltup":
    case "slowtiltup":

      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)-pow(on/${frames},2)*180':` +
          `fps=30`,
      };

    // ----------------------------------
    // PAN DOWN
    // ----------------------------------
    case "pandown":
    case "tiltdown":
    case "slowtiltdown":

      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)+pow(on/${frames},2)*180':` +
          `fps=30`,
      };

    // ----------------------------------
    // TRUCK LEFT
    // ----------------------------------
    case "driftleft":
    case "truckleft":

      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)-pow(on/${frames},1.15)*140':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // TRUCK RIGHT
    // ----------------------------------
    case "driftright":
    case "truckright":

      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)+pow(on/${frames},1.15)*140':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // ORBIT
    // ----------------------------------
    case "orbit":

      return {
        zoompan:
          `zoompan=` +
          `z=1.12:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)+sin(on/18)*25':` +
          `y='ih/2-(ih/zoom/2)+cos(on/18)*12':` +
          `fps=30`,
      };

    // ----------------------------------
    // DRONE UP / REVEAL
    // ----------------------------------
    case "droneup":
    case "dronereveal":

      return {
        zoompan:
          `zoompan=` +
          `z='1.30-0.20*(on/${frames})':` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)-pow(on/${frames},1.2)*220':` +
          `fps=30`,
      };

    // ----------------------------------
    // MACRO SLIDE
    // ----------------------------------
    case "macroslide":

      return {
        zoompan:
          `zoompan=` +
          `z='1.40+0.12*sin(on/15)':` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)+sin(on/20)*90':` +
          `y='ih/2-(ih/zoom/2)':` +
          `fps=30`,
      };

    // ----------------------------------
    // WHIP PAN
    // ----------------------------------
    case "whippan":

      return {
        zoompan:
          `zoompan=` +
          `z=1.15:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)+sin(on/3)*350':` +
          `y='ih/2-(ih/zoom/2)+sin(on/5)*35':` +
          `fps=30`,
      };

    // ----------------------------------
    // HANDHELD
    // ----------------------------------
    case "handheld":

      return {
        zoompan:
          `zoompan=` +
          `z=1.12:` +
          `d=${d}:` +
          `x='iw/2-(iw/zoom/2)+sin(on/8)*5':` +
          `y='ih/2-(ih/zoom/2)+cos(on/9)*4':` +
          `fps=30`,
      };

    // ----------------------------------
// STATIC
// ----------------------------------
case "static":
default:

  return {
    zoompan:
      `zoompan=` +
      `z=1:` +
      `d=${d}:` +
      `x='iw/2-(iw/zoom/2)':` +
      `y='ih/2-(ih/zoom/2)':` +
      `fps=30`,
  };
  }
}

export const getCameraMotion = buildCameraMotion;