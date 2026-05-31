/**
 * Copy Momoge logo into Capacitor www + Android mipmap (after `cap add android`).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const repoRoot = path.resolve(root, '../..');
const srcLogo = path.join(repoRoot, 'public', 'momoge', 'Logo-brand.png');

if (!fs.existsSync(srcLogo)) {
  console.error('Logo not found:', srcLogo);
  process.exit(1);
}

const wwwDir = path.join(root, 'www');
fs.mkdirSync(wwwDir, { recursive: true });
fs.copyFileSync(srcLogo, path.join(wwwDir, 'logo.png'));

const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');
const targets = [
  'mipmap-mdpi/ic_launcher.png',
  'mipmap-hdpi/ic_launcher.png',
  'mipmap-xhdpi/ic_launcher.png',
  'mipmap-xxhdpi/ic_launcher.png',
  'mipmap-xxxhdpi/ic_launcher.png',
  'mipmap-mdpi/ic_launcher_foreground.png',
  'mipmap-hdpi/ic_launcher_foreground.png',
  'mipmap-xhdpi/ic_launcher_foreground.png',
  'mipmap-xxhdpi/ic_launcher_foreground.png',
  'mipmap-xxxhdpi/ic_launcher_foreground.png',
];

if (fs.existsSync(androidRes)) {
  for (const rel of targets) {
    const dest = path.join(androidRes, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(srcLogo, dest);
  }
  console.log('Copied launcher icons to android/res');
} else {
  console.log('Skip android icons — run: npx cap add android');
}

console.log('Copied logo to www/logo.png');
