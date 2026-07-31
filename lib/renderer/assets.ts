import fs from "fs";
import path from "path";

export type RenderAssets = {
  images: string[];
  imageCount: number;
};

export function getAssets(imagesDir: string): RenderAssets {
  if (!fs.existsSync(imagesDir)) {
    throw new Error(`Images directory not found: ${imagesDir}`);
  }

  const images = fs
    .readdirSync(imagesDir)
    .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => path.join(imagesDir, file));

  if (images.length === 0) {
    throw new Error("No images found.");
  }

  console.log("========== ASSETS ==========");
  console.log("Images found:", images.length);

  images.forEach((img, index) => {
    console.log(`${index + 1}. ${img}`);
  });

  console.log("============================");

  return {
    images,
    imageCount: images.length,
  };
}