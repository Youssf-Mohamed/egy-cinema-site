/**
 * Converts login background JPEGs to WebP for better performance.
 * Run: node scripts/convert-bg-images.mjs
 */
import sharp from 'sharp';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename, extname } from 'path';

const inputDir = join(process.cwd(), 'public/images/login');
const outputDir = inputDir; // output to same folder

const files = readdirSync(inputDir).filter(f => extname(f).toLowerCase() === '.jpg');

console.log(`Converting ${files.length} images to WebP...`);

for (const file of files) {
  const input = join(inputDir, file);
  const name = basename(file, extname(file));
  const output = join(outputDir, `${name}.webp`);

  if (existsSync(output)) {
    console.log(`  [SKIP] ${file} → already exists as .webp`);
    continue;
  }

  await sharp(input)
    .resize(420, 630, { fit: 'cover' }) // 2:3 ratio, 2x display size (210px * 2)
    .webp({ quality: 72, effort: 4 })
    .toFile(output);

  console.log(`  [OK]   ${file} → ${name}.webp`);
}

console.log('Done.');
