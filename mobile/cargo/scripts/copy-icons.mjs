/**
 * Generate Cargo launcher icons with safe-zone padding (Android adaptive icon).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '../..');
const srcLogo = path.join(repoRoot, 'public', 'uploads', 'logos', 'cargo.jpg');

/** Cargo portal dark background */
const BRAND_BG = { r: 22, g: 24, b: 31, alpha: 1 };

const LOGO_SCALE = 0.58;

const MIPMAP_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function writeIcon(destPath, size, { transparentBg = false } = {}) {
  const logoSize = Math.round(size * LOGO_SCALE);
  const logo = await sharp(srcLogo)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

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
  if (!fs.existsSync(srcLogo)) {
    console.error('Logo not found:', srcLogo);
    process.exit(1);
  }

  const wwwDir = path.join(root, 'www');
  fs.mkdirSync(wwwDir, { recursive: true });
  await writeIcon(path.join(wwwDir, 'logo.png'), 192);

  const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(androidRes)) {
    console.log('Skip android icons — run: npx cap add android');
    console.log('Copied logo to www/logo.png');
    return;
  }

  for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
    const dir = path.join(androidRes, folder);
    fs.mkdirSync(dir, { recursive: true });

    await writeIcon(path.join(dir, 'ic_launcher.png'), size);
    await writeIcon(path.join(dir, 'ic_launcher_round.png'), size);
    await writeIcon(path.join(dir, 'ic_launcher_foreground.png'), size, { transparentBg: true });
  }

  console.log('Generated padded launcher icons in android/res');
  console.log('Copied logo to www/logo.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
