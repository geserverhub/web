import bcrypt from 'bcryptjs';
const hash = '$2b$12$P0J5qt02Y.64EWCY5umIIeoZ/N1SyISZ5UfFUXbHz8GdD1m3q/FcS';
for (const p of ['898989', '23504000', '2350400018644', 'partner01', 'Admin2026', 'goeun', 'ge-server-hub-1']) {
  console.log(p, (await bcrypt.compare(p, hash)) ? 'OK' : '-');
}
