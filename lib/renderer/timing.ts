import ffmpeg from "@/lib/ffmpeg";

export function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) return reject(err);

      resolve(metadata.format.duration || 0);
    });
  });
}