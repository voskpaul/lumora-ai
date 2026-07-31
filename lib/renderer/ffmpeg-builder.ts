import ffmpeg from "@/lib/ffmpeg";

type BuilderOptions = {
  images: string[];
  voicePath: string;
  sceneDurations: number[];
};

export function createBuilder({
  images,
  voicePath,
  sceneDurations,
}: BuilderOptions) {

  const command = ffmpeg();

  images.forEach((image, index) => {

    const duration = sceneDurations[index] ?? 3;

    command
      .input(image)
      .inputOptions([
        "-loop 1",

        `-t ${duration}`,

        "-framerate 30",
      ]);
  });

  command.input(voicePath);

  return command;
}