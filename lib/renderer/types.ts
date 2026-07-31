export interface VideoAsset {
  path: string;
  duration?: number;
}

export interface RenderInput {
  videoId: string;
  images: VideoAsset[];
  voicePath: string;
  captionsPath: string;
  outputPath: string;
}