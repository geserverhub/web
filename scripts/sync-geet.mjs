/**
 * Sync GE Energy Tech corporate site from monorepo → C:\geet (pavinee23/geet)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const geetRoot = process.env.GEET_ROOT || 'C:/geet';

const copies = [
  ['src/app/ge-energy-tech/ge-energy-tech.css', 'app/ge-energy-tech.css'],
  ['src/app/ge-energy-tech/ge-energy-tech-auth.css', 'app/ge-energy-tech-auth.css'],
  ['src/lib/meter-order.js', 'lib/meter-order.js'],
  ['src/lib/ge-energy-tech-meter-order-i18n.js', 'lib/ge-energy-tech-meter-order-i18n.js'],
  ['src/lib/ge-energy-tech/customer-tools-i18n.js', 'lib/ge-energy-tech/customer-tools-i18n.js'],
  ['src/lib/ge-energy-tech/order-status-i18n.js', 'lib/ge-energy-tech/order-status-i18n.js'],
  ['src/lib/ge-energy-tech-api.js', 'lib/ge-energy-tech-api.js'],
  ['src/lib/smtp-config.js', 'lib/smtp-config.js'],
  ['src/components/ge-energy-tech/MeterOrderModal.jsx', 'components/ge-energy-tech/MeterOrderModal.jsx'],
  ['src/components/ge-energy-tech/PrivacyPolicyPage.jsx', 'components/ge-energy-tech/PrivacyPolicyPage.jsx'],
  ['src/lib/ge-energy-tech/privacy-policy-content.js', 'lib/ge-energy-tech/privacy-policy-content.js'],
  ['src/app/ge-energy-tech/shipping-tracking/page.jsx', 'app/shipping-tracking/page.jsx'],
  ['src/app/ge-energy-tech/after-sales-chat/page.jsx', 'app/after-sales-chat/page.jsx'],
  ['src/app/ge-energy-tech/privacy/page.jsx', 'app/privacy/page.jsx'],
];

for (const [from, to] of copies) {
  const src = path.join(root, from);
  const dest = path.join(geetRoot, to);
  if (!fs.existsSync(src)) {
    console.warn('Skip missing', from);
    continue;
  }
  let text = fs.readFileSync(src, 'utf8');
  text = text.replace(/\.\.\/ge-energy-tech\.css/g, '../ge-energy-tech.css');
  text = text.replace(/\.\.\/ge-energy-tech-auth\.css/g, '../ge-energy-tech-auth.css');
  const isPage = to.includes('page.jsx');
  if (isPage) {
    text = text.replaceAll('portalHubHref(', 'portalHref(');
    text = text.replace(
      "import { geEnergyTechApiUrl, portalHubHref } from '@/lib/ge-energy-tech-api';",
      "import { geEnergyTechApiUrl, portalHref } from '@/lib/ge-energy-tech-api';"
    );
    text = text.replace('homeHref="/ge-energy-tech"', 'homeHref="/"');
  }
  text = text.replaceAll('href="/ge-energy-tech"', 'href="/"');
  text = text.replaceAll("Link href=\"/ge-energy-tech\"", 'Link href="/"');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, text, 'utf8');
  console.log('Copied', to);
}

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

const srcPage = path.join(root, 'src/app/ge-energy-tech/GeEnergyTechClientPage.jsx');
const destPage = path.join(geetRoot, 'app/GePage.jsx');
let s = fs.readFileSync(srcPage, 'utf8');

s = s.replace(/import { publicHubHref } from '@\/lib\/data';\r?\n/, '');
s = s.replaceAll('publicHubHref(', 'portalHref(');
s = s.replaceAll('/ge-energy-tech/shipping-tracking', '/shipping-tracking');
s = s.replaceAll('/ge-energy-tech/after-sales-chat', '/after-sales-chat');
s = s.replaceAll(
  'href="/shipping-tracking"',
  `href={portalHref('/ge-energy-tech/shipping-tracking')}`
);
s = s.replaceAll(
  'href="/after-sales-chat"',
  `href={portalHref('/ge-energy-tech/after-sales-chat')}`
);
s = s.replaceAll('href="/ge-energy-tech/privacy"', 'href="/privacy"');
s = s.replace(
  'export default function GeEnergyTechClientPage()',
  'export default function GePage()'
);

if (!s.includes('function portalHref')) {
  s = s.replace(
    /const LANGUAGE_STORAGE_KEY = 'ge-energy-tech-lang';\s*/,
    `const LANGUAGE_STORAGE_KEY = 'ge-energy-tech-lang';\n\n${portal}`
  );
}

fs.writeFileSync(destPage, s, 'utf8');
console.log('Wrote app/GePage.jsx');

const envExample = path.join(geetRoot, '.env.local.example');
let envText = fs.existsSync(envExample) ? fs.readFileSync(envExample, 'utf8') : '';
if (!envText.includes('NEXT_PUBLIC_PUBLIC_HUB_URL')) {
  envText += `\n# Platform + API hub (localhost:3005 via ngrok)\nNEXT_PUBLIC_PUBLIC_HUB_URL=https://strong-dory-enabled.ngrok-free.app\n`;
}
if (!envText.includes('NEXT_PUBLIC_PORTAL_BASE_URL')) {
  envText += `NEXT_PUBLIC_PORTAL_BASE_URL=https://strong-dory-enabled.ngrok-free.app\n`;
}
fs.writeFileSync(envExample, envText, 'utf8');
console.log('Updated .env.local.example');

console.log('Done — cd geet && npm run build && git push');
