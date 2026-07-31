export type CameraMotionType =
  | "slow push in"
  | "slow pull back"
  | "slow pan left"
  | "slow pan right"
  | "slow tilt up"
  | "slow tilt down"
  | "handheld"
  | "drone reveal"
  | "orbit"
  | "static";

export type CameraMotionFilter = {
  zoompan: string;
};

export function buildCameraMotion(
  movement: string,
  duration: number
): CameraMotionFilter {

  const frames = Math.max(1, Math.round(duration * 30));

  movement = movement
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "")
    .toLowerCase();

  switch (movement) {

    //----------------------------------
    // ZOOM IN
    //----------------------------------
    case "zoomin":
    case "push":
    case "slowpushin":
      return {
        zoompan:
          `zoompan=` +
          `z='min(zoom+0.0018,1.35)':` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)'`
      };

    //----------------------------------
    // ZOOM OUT
    //----------------------------------
    case "zoomout":
    case "pull":
    case "slowpullback":
      return {
        zoompan:
          `zoompan=` +
          `z='if(eq(on,1),1.35,max(zoom-0.0015,1.0))':` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)'`
      };

    //----------------------------------
    // PAN LEFT
    //----------------------------------
    case "panleft":
    case "slowpanleft":
      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)-on*2':` +
          `y='ih/2-(ih/zoom/2)'`
      };

    //----------------------------------
    // PAN RIGHT
    //----------------------------------
    case "panright":
    case "slowpanright":
      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)+on*2':` +
          `y='ih/2-(ih/zoom/2)'`
      };

    //----------------------------------
    // PAN UP
    //----------------------------------
    case "panup":
    case "tiltup":
    case "slowtiltup":
      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)-on*2'`
      };

    //----------------------------------
    // PAN DOWN
    //----------------------------------
    case "pandown":
    case "tiltdown":
    case "slowtiltdown":
      return {
        zoompan:
          `zoompan=` +
          `z=1.08:` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)+on*2'`
      };

    //----------------------------------
    // HANDHELD
    //----------------------------------
    case "handheld":
      return {
        zoompan:
          `zoompan=` +
          `z=1.12:` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)+sin(on/8)*5':` +
          `y='ih/2-(ih/zoom/2)+cos(on/9)*4'`
      };

    //----------------------------------
    // DRONE
    //----------------------------------
    case "dronereveal":
      return {
        zoompan:
          `zoompan=` +
          `z='max(1.35-on*0.0015,1)':` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)-on*2'`
      };

    //----------------------------------
    // ORBIT
    //----------------------------------
    case "orbit":
      return {
        zoompan:
          `zoompan=` +
          `z=1.12:` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)+sin(on/18)*25':` +
          `y='ih/2-(ih/zoom/2)+cos(on/18)*12'`
      };

    //----------------------------------
    // STATIC
    //----------------------------------
    case "static":
    default:
      return {
        zoompan:
          `zoompan=` +
          `z=1.05:` +
          `d=${frames}:` +
          `x='iw/2-(iw/zoom/2)':` +
          `y='ih/2-(ih/zoom/2)'`
      };
  }
}

export const getCameraMotion = buildCameraMotion;