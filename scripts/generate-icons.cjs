const sharp = require('sharp');
const path = require('path');
const outDir = path.join(__dirname, '..', 'public');

const sizes = [192, 512];
const accent = '#0ea5e9';
const white = '#ffffff';

async function generate(size) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="${accent}"/>
    <text x="${size / 2}" y="${size * 0.65}" font-size="${size * 0.42}" font-weight="bold" text-anchor="middle" fill="${white}" font-family="Arial, sans-serif">CF</text>
  </svg>`;

  await sharp(Buffer.from(svg)).png().toFile(path.join(outDir, `icon-${size}.png`));
}

(async () => {
  for (const s of sizes) { await generate(s); }
  console.log('Icons generated in public/');
})();
