import fs from "fs";
import path from "path";

export async function createSlideshow(
  imagesDir: string,
  totalDuration: number
) {
  const images = fs
    .readdirSync(imagesDir)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .sort();

  if (!images.length) {
    throw new Error("No images found.");
  }

  const durationPerImage = totalDuration / images.length;

  const listPath = path.join(imagesDir, "list.txt");

  let content = "";

  for (const img of images) {
    content += `file '${path.join(imagesDir, img).replace(/\\/g, "/")}'\n`;
    content += `duration ${durationPerImage}\n`;
  }

  content += `file '${path
    .join(imagesDir, images[images.length - 1])
    .replace(/\\/g, "/")}'\n`;

  fs.writeFileSync(listPath, content);

  console.log("✅ list.txt created");
  console.log("Images:", images.length);
  console.log("Voice duration:", totalDuration);
  console.log("Per image:", durationPerImage);

  return listPath;
}