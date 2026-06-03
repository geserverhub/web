/**
 * Generate Momoge launcher icons with safe-zone padding (Android adaptive icon).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '../..');
/** Transparent PNG — run: node scripts/build-logo-transparent.mjs */
const srcLogo = path.join(repoRoot, 'public', 'momoge', 'Logo-brand.png');
const srcLogoFallback = path.join(repoRoot, 'public', 'momoge', 'Logo-brand.jpg');

/** Momoge brand green — matches capacitor.config.ts */
const BRAND_BG = { r: 4, g: 120, b: 87, alpha: 1 };

/**
 * Max logo width/height as fraction of icon canvas.
 * Android adaptive icons mask to circle/squircle — keep art inside ~50% to avoid clipping.
 */
const LOGO_MAX_FRACTION = 0.45;

const MIPMAP_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function writeIcon(logoPath, destPath, size, { transparentBg = false } = {}) {
  const meta = await sharp(logoPath).metadata();
  const aspect = (meta.width || 1) / (meta.height || 1);
  /** Square store-style artwork can fill more of the adaptive icon safe zone. */
  const maxFraction = aspect >= 0.9 && aspect <= 1.1 ? 0.88 : LOGO_MAX_FRACTION;
  const maxW = Math.round(size * maxFraction);
  const maxH = Math.round(size * maxFraction);
  let targetW;
  let targetH;
  if (aspect >= 1) {
    targetW = maxW;
    targetH = Math.round(maxW / aspect);
    if (targetH > maxH) {
      targetH = maxH;
      targetW = Math.round(maxH * aspect);
    }
  } else {
    targetH = maxH;
    targetW = Math.round(maxH * aspect);
    if (targetW > maxW) {
      targetW = maxW;
      targetH = Math.round(maxW / aspect);
    }
  }

  const logo = await sharp(logoPath)
    .resize(targetW, targetH, { fit: 'inside', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const left = Math.round((size - targetW) / 2);
  const top = Math.round((size - targetH) / 2);

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: transparentBg ? { r: 0, g: 0, b: 0, alpha: 0 } : BRAND_BG,
    },
  })
    .composite([{ input: logo, left, top, width: targetW, height: targetH }])
    .png()
    .toFile(destPath);
}

async function main() {
  const logoPath = fs.existsSync(srcLogo) ? srcLogo : srcLogoFallback;
  if (!fs.existsSync(logoPath)) {
    console.error('Logo not found:', srcLogo, 'or', srcLogoFallback);
    process.exit(1);
  }

  const wwwDir = path.join(root, 'www');
  fs.mkdirSync(wwwDir, { recursive: true });
  await writeIcon(logoPath, path.join(wwwDir, 'logo.png'), 192);

  const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(androidRes)) {
    console.log('Skip android icons — run: npx cap add android');
    console.log('Copied logo to www/logo.png');
    return;
  }

  for (const [folder, size] of Object.entries(MIPMAP_SIZES)) {
    const dir = path.join(androidRes, folder);
    fs.mkdirSync(dir, { recursive: true });

    await writeIcon(logoPath, path.join(dir, 'ic_launcher.png'), size);
    await writeIcon(logoPath, path.join(dir, 'ic_launcher_round.png'), size);
    await writeIcon(logoPath, path.join(dir, 'ic_launcher_foreground.png'), size, {
      transparentBg: true,
    });
  }

  console.log('Generated padded launcher icons in android/res');
  console.log('Copied logo to www/logo.png');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
