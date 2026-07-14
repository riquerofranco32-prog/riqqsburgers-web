import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import path from "node:path";

// Import dinámico: los import estáticos de ESM se evalúan antes que
// loadEnvConfig corra (hoisting), así que lib/instagram (vía lib/supabase)
// leería process.env vacío si se importara arriba.
async function main() {
  const { publishCarousel, publishStory, uploadCarouselImages } =
    await import("@/lib/instagram");
  const [type, ...rest] = process.argv.slice(2);

  if (type === "carousel") {
    const [caption, ...imagePaths] = rest;
    if (!caption || imagePaths.length < 2) {
      throw new Error("Uso: carousel <caption> <img1> <img2> [...hasta 10]");
    }
    const files = await Promise.all(imagePaths.map(toFile));
    const imageUrls = await uploadCarouselImages(files);
    const mediaId = await publishCarousel(imageUrls, caption);
    console.log(JSON.stringify({ mediaId, imageUrls }));
    return;
  }

  if (type === "story") {
    const [imagePath] = rest;
    if (!imagePath) throw new Error("Uso: story <img>");
    const [imageUrl] = await uploadCarouselImages([await toFile(imagePath)]);
    const mediaId = await publishStory(imageUrl);
    console.log(JSON.stringify({ mediaId, imageUrl }));
    return;
  }

  throw new Error("Primer argumento debe ser 'carousel' o 'story'");
}

async function toFile(filePath: string): Promise<File> {
  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile(filePath);
  const name = path.basename(filePath);
  const ext = path.extname(name).toLowerCase();
  const mime =
    ext === ".jpg" || ext === ".jpeg"
      ? "image/jpeg"
      : ext === ".webp"
        ? "image/webp"
        : "image/png";
  return new File([buffer], name, { type: mime });
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
