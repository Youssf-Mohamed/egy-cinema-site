import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.resolve(__dirname, '../public/images/mockup');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.png')).sort();

for (const file of files) {
  const src = path.join(srcDir, file);
  const dst = path.join(srcDir, file.replace('.png', '.webp'));
  await sharp(src).webp({ quality: 82 }).toFile(dst);
  const s = fs.statSync(src).size;
  const d = fs.statSync(dst).size;
  console.log(`${file} ${ (s/1024/1024).toFixed(2)}MB -> ${(d/1024).toFixed(0)}KB`);
}
console.log('done');
