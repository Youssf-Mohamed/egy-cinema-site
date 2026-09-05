import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, '../public/images/mockup/desktop-preview.png');
const dst = path.resolve(__dirname, '../public/images/mockup/desktop-preview.webp');
await sharp(src).webp({ quality: 85 }).toFile(dst);
console.log('done');
