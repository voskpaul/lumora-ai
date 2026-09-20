import type { MotionPreset } from "./cinematic";
import type { CameraPlan } from "./cinematographer";

export function motionFilter(
  motion: MotionPreset,
  duration: number,
  camera: CameraPlan
) {
  const frames = Math.round(duration * 30);

  const zoom = camera.zoomSpeed;
  const pan = camera.panSpeed;
  const shake = camera.shake;

  switch (motion) {

    case "zoomIn":
      return `
zoompan=
z='min(zoom+${zoom},1.35)':
x='iw/2-(iw/zoom/2)+sin(on*0.08)*${shake * 25}':
y='ih/2-(ih/zoom/2)+cos(on*0.08)*${shake * 25}':
d=${frames}
`.replace(/\n/g, "");

    case "zoomOut":
      return `
zoompan=
z='max(1.35-on*${zoom},1.0)':
x='iw/2-(iw/zoom/2)':
y='ih/2-(ih/zoom/2)':
d=${frames}
`.replace(/\n/g, "");

    case "panLeft":
      return `
zoompan=
z='1.12':
x='iw-iw/zoom-on*${pan}':
y='ih/2-(ih/zoom/2)':
d=${frames}
`.replace(/\n/g, "");

    case "panRight":
      return `
zoompan=
z='1.12':
x='on*${pan}':
y='ih/2-(ih/zoom/2)':
d=${frames}
`.replace(/\n/g, "");

    case "panUp":
      return `
zoompan=
z='1.10':
x='iw/2-(iw/zoom/2)':
y='ih-ih/zoom-on*${pan}':
d=${frames}
`.replace(/\n/g, "");

    case "panDown":
      return `
zoompan=
z='1.10':
x='iw/2-(iw/zoom/2)':
y='on*${pan}':
d=${frames}
`.replace(/\n/g, "");

    default:
      return `
zoompan=
z='1.08':
x='iw/2-(iw/zoom/2)':
y='ih/2-(ih/zoom/2)':
d=${frames}
`.replace(/\n/g, "");
  }
}