import ffmpeg from "@/lib/ffmpeg";
import fs from "fs";
import path from "path";

export type TimelineMusicTrackInput = {
  id: string;
  name?: string | null;
  audioPath: string;
  duration: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  muted: boolean;
};

/**
 * Mixes timeline music clips over an existing video while copying its video
 * stream without re-encoding. trimEnd is the amount removed from the clip tail.
 */
export async function attachTimelineMusic({
  video,
  tracks,
  output,
}: {
  video: string;
  tracks: TimelineMusicTrackInput[];
  output: string;
}): Promise<void> {
  if (!fs.existsSync(video)) {
    throw new Error(`Timeline music input video is missing: ${video}`);
  }

  const activeTracks = tracks.filter(
    (track) => !track.muted && track.volume > 0
  );

  if (activeTracks.length === 0) {
    fs.copyFileSync(video, output);
    return;
  }

  for (const track of activeTracks) {
    if (!fs.existsSync(track.audioPath)) {
      throw new Error(
        `Music file is missing for track ${track.id}: ${track.audioPath}`
      );
    }

    const values = [
      track.duration,
      track.startTime,
      track.trimStart,
      track.trimEnd,
      track.volume,
    ];

    if (
      values.some((value) => !Number.isFinite(value)) ||
      track.duration <= 0 ||
      track.startTime < 0 ||
      track.trimStart < 0 ||
      track.trimEnd < 0 ||
      track.trimStart + track.trimEnd >= track.duration ||
      track.volume < 0 ||
      track.volume > 1
    ) {
      throw new Error(
        `Invalid timing or volume for music track ${track.id}`
      );
    }
  }

  const filters: string[] = [
    "[0:a]aresample=async=1:first_pts=0[narration]",
  ];
  const mixLabels = ["[narration]"];

  activeTracks.forEach((track, index) => {
    const inputIndex = index + 1;
    const label = `music${index}`;
    const clipEnd = Math.max(0.01, track.duration - track.trimEnd);
    const delayMs = Math.round(track.startTime * 1000);

    filters.push(
      `[${inputIndex}:a]atrim=start=${track.trimStart}:end=${clipEnd},` +
        `asetpts=PTS-STARTPTS,adelay=${delayMs}|${delayMs},` +
        `volume=${track.volume},aresample=async=1:first_pts=0[${label}]`
    );

    mixLabels.push(`[${label}]`);
  });

  filters.push(
    `${mixLabels.join("")}amix=inputs=${mixLabels.length}:duration=first:` +
      `dropout_transition=2:normalize=0[mixed]`
  );

  await new Promise<void>((resolve, reject) => {
    let command = ffmpeg().input(video);

    for (const track of activeTracks) {
      command = command.input(track.audioPath);
    }

    command
      .complexFilter(filters)
      .outputOptions([
        "-map 0:v:0",
        "-map [mixed]",
        "-c:v copy",
        "-c:a aac",
        "-b:a 192k",
        "-shortest",
        "-movflags +faststart",
      ])
      .on("start", (cmd: string) => {
        console.log("========== TIMELINE MUSIC FFMPEG ==========");
        console.log(cmd);
        console.log("===========================================");
      })
      .on("end", () => resolve())
            .on("error", (error: Error) => {
        console.error("Timeline music mix failed:", error);
        reject(error);
      })
      .save(output);
  });
}

export function resolvePublicAudioPath(audioUrl: string): string {
  if (!audioUrl || audioUrl.includes("\\") || audioUrl.includes("\0")) {
    throw new Error("Invalid music audio URL.");
  }

  // Timeline tracks must currently reference an audio file stored under /public.
  // This avoids letting an arbitrary user-supplied URL make the render server
  // fetch private network resources.
  if (/^https?:\/\//i.test(audioUrl)) {
    throw new Error(
      "Use a music file URL served from this app's /public folder for timeline rendering."
    );
  }

  const publicDir = path.resolve(process.cwd(), "public");
  const relativePath = decodeURIComponent(
    audioUrl.split("?")[0].replace(/^\/+/, "")
  );
  const resolvedPath = path.resolve(publicDir, relativePath);

  if (
    resolvedPath !== publicDir &&
    !resolvedPath.startsWith(publicDir + path.sep)
  ) {
    throw new Error("Music file path must remain inside the public folder.");
  }

  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isFile()) {
    throw new Error(`Music file not found: ${audioUrl}`);
  }

  return resolvedPath;
}