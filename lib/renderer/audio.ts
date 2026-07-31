import ffmpeg from "@/lib/ffmpeg";

export function applyAudio(command: ReturnType<typeof ffmpeg>, voicePath: string) {
  return command
    .input(voicePath)
    .audioCodec("aac")
    .outputOptions([
      "-b:a 192k",
      "-ar 48000",
      "-shortest",
    ]);
}