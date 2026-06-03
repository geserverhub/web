/**
 * Generate Phone Remote launcher icons (programmatic — no external logo file).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

/** Phone Remote brand blue — matches capacitor.config.ts */
const BRAND_BG = { r: 30, g: 58, b: 95, alpha: 1 };
const ACCENT = '#60a5fa';

const MIPMAP_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

function logoSvg(size) {
  const pad = Math.round(size * 0.18);
  const inner = size - pad * 2;
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect x="${pad}" y="${Math.round(pad + inner * 0.08)}" width="${inner}" height="${Math.round(inner * 0.72)}" rx="${Math.round(inner * 0.08)}" fill="none" stroke="${ACCENT}" stroke-width="${Math.max(4, inner * 0.05)}"/>
  <rect x="${Math.round(pad + inner * 0.28)}" y="${Math.round(pad + inner * 0.22)}" width="${Math.round(inner * 0.44)}" height="${Math.round(inner * 0.34)}" rx="${Math.round(inner * 0.04)}" fill="${ACCENT}" opacity="0.9"/>
  <circle cx="${Math.round(pad + inner * 0.5)}" cy="${Math.round(pad + inner * 0.86)}" r="${Math.max(4, inner * 0.04)}" fill="${ACCENT}"/>
</svg>`;
}

async function writeIcon(destPath, size, { transparentBg = false } = {}) {
  const logoSize = Math.round(size * 0.72);
  const logo = await sharp(Buffer.from(logoSvg(logoSize))).png().toBuffer();
  const left = Math.round((size - logoSize) / 2);
  const top = Math.round((size - logoSize) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: transparentBg ? { r: 0, g: 0, b: 0, alpha: 0 } : BRAND_BG,
    },
  })
    .composite([{ input: logo, left, top }])
    .png()
    .toFile(destPath);
}

async function main() {
  const wwwDir = path.join(root, 'www');
  fs.mkdirSync(wwwDir, { recursive: true });
  await writeIcon(path.join(wwwDir, 'logo.png'), 192);

  const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(androidRes)) {
    console.log('Skip android icons — run: npx cap add android');
    return;
  }

  for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
    const dir = path.join(androidRes, folder);
    fs.mkdirSync(dir, { recursive: true });
    await writeIcon(path.join(dir, 'ic_launcher.png'), size);
    await writeIcon(path.join(dir, 'ic_launcher_round.png'), size);
    await writeIcon(path.join(dir, 'ic_launcher_foreground.png'), size, { transparentBg: true });
  }

  console.log('Generated Phone Remote launcher icons');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
