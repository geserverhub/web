import bcrypt from 'bcryptjs';

const hash = '$2b$12$/qEiWd21PFZ/CMhA4oX.renuGGsZwQ4c4/xPDnNbVNGhOsME6enfi';
const candidates = ['23504000', '2350400018644', 'Admin2026', 'goeun'];

for (const p of candidates) {
  const ok = await bcrypt.compare(p, hash);
  console.log(p, ok ? 'OK' : 'no');
}
