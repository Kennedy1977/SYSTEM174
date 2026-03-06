import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [, , inputPathArg, slugArg] = process.argv;

if (!inputPathArg) {
  console.error("Usage: npm run artwork -- <input-file> [slug]");
  process.exit(1);
}

const inputPath = path.resolve(process.cwd(), inputPathArg);
const rawSlug = slugArg ?? path.parse(inputPath).name;
const slug = rawSlug
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

if (!slug) {
  console.error("Invalid slug. Use letters and numbers.");
  process.exit(1);
}

const outputDir = path.resolve(process.cwd(), "public/artwork/releases");
await mkdir(outputDir, { recursive: true });

const variants = [
  { suffix: "sm", width: 480, quality: 78 },
  { suffix: "md", width: 960, quality: 82 },
  { suffix: "lg", width: 1280, quality: 84 },
];

for (const variant of variants) {
  const outputPath = path.join(outputDir, `${slug}-${variant.suffix}.webp`);
  await sharp(inputPath)
    .rotate()
    .resize({
      width: variant.width,
      height: variant.width,
      fit: "cover",
      position: "attention",
      withoutEnlargement: true,
    })
    .webp({ quality: variant.quality })
    .toFile(outputPath);
  console.log(`Created ${path.relative(process.cwd(), outputPath)}`);
}
