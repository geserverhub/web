import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const geetRoot = process.env.GEET_ROOT || 'C:/geet';

const srcPath = path.join(root, 'src/app/ge-energy-tech/GeEnergyTechClientPage.jsx');
const destPath = path.join(geetRoot, 'app/GePage.jsx');

let s = fs.readFileSync(srcPath, 'utf8');

const portal = `const PORTAL_BASE = (
  process.env.NEXT_PUBLIC_PORTAL_BASE_URL ||
  process.env.NEXT_PUBLIC_PUBLIC_HUB_URL ||
  'https://strong-dory-enabled.ngrok-free.app'
).replace(/\\/$/, '');

function portalHref(path) {
  const normalized = path.startsWith('/') ? path : \`/\${path}\`;
  return \`\${PORTAL_BASE}\${normalized}\`;
}

`;

if (!s.includes('portalHref')) {
  s = s.replace(
    /const LANGUAGE_STORAGE_KEY = 'ge-energy-tech-lang';\s*/,
    `const LANGUAGE_STORAGE_KEY = 'ge-energy-tech-lang';\n\n${portal}`
  );
  s = s
    .replaceAll('href="/ge-energy-erp-login"', "href={portalHref('/ge-energy-erp-login')}")
    .replaceAll('href="/register-geet"', "href={portalHref('/register-geet')}")
    .replaceAll('href="/ge-energy-tech/login"', "href={portalHref('/ge-energy-tech/login')}");
}

s = s.replace(
  'export default function GeEnergyTechClientPage()',
  'export default function GePage()'
);

fs.writeFileSync(destPath, s, 'utf8');

const sample = s.match(/tag: '([^']+)'/)?.[1];
console.log('Wrote', destPath);
console.log('Thai sample:', sample);

