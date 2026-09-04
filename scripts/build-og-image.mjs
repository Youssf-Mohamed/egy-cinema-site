// Build-time OG image generator.
// Creates a 1200x630 PNG with the EGY CINEMA marquee branding.
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const W = 1200;
const H = 630;
const NIGHTFALL = '#131313';
const OCHRE = '#FE2020';
const LANTERN = '#E4E2E1';
const SMOKE = '#8F8D8B';

// Build an SVG and rasterize it via sharp.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0E1320"/>
      <stop offset="100%" stop-color="#070912"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${LANTERN}"/>
      <stop offset="100%" stop-color="#B8A88A"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="20%" r="60%">
      <stop offset="0%" stop-color="${OCHRE}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${OCHRE}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Top hairline -->
  <line x1="80" y1="80" x2="${W - 80}" y2="80" stroke="${OCHRE}" stroke-opacity="0.4" stroke-width="1"/>

  <!-- Eyebrow -->
  <text x="80" y="118" font-family="IBM Plex Mono, monospace" font-size="16" font-weight="500" fill="${OCHRE}" letter-spacing="6">
    NOW PLAYING ON YOUR DESKTOP
  </text>

  <!-- Title -->
  <text x="80" y="280" font-family="Cairo, sans-serif" font-size="160" font-weight="900" fill="url(#title)" letter-spacing="-3">
    EGY CINEMA
  </text>

  <!-- Tagline -->
  <text x="80" y="360" font-family="Cairo, sans-serif" font-size="32" font-weight="400" fill="${LANTERN}" fill-opacity="0.85">
    Movies and TV, in Arabic, on Windows and Android. Free.
  </text>

  <!-- Marquee rule with section label -->
  <line x1="80" y1="500" x2="${W - 80}" y2="500" stroke="${OCHRE}" stroke-opacity="0.4" stroke-width="1"/>
  <rect x="80" y="488" width="240" height="24" fill="${NIGHTFALL}"/>
  <text x="92" y="506" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="500" fill="${OCHRE}" letter-spacing="4">
    DOWNLOAD · egy-cinema.vercel.app
  </text>

  <!-- Platforms -->
  <g font-family="IBM Plex Mono, monospace" font-size="13" font-weight="500" fill="${SMOKE}" letter-spacing="2">
    <text x="80" y="560">WINDOWS</text>
    <text x="220" y="560">ANDROID</text>
  </g>

  <!-- Bottom hairline -->
  <line x1="80" y1="${H - 80}" x2="${W - 80}" y2="${H - 80}" stroke="${OCHRE}" stroke-opacity="0.2" stroke-width="1"/>
</svg>
`.trim();

async function main() {
  const out = path.resolve('public/og-image.png');
  await sharp(Buffer.from(svg)).png({ quality: 95 }).toFile(out);
  console.log(`Wrote ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
