/**
 * Shared WSL fallback when Windows localhost MySQL rejects the app user.
 */
import { spawnSync } from 'child_process';

export function runInWsl(command, { cwd, label = 'db' } = {}) {
  const wslPath = process.env.WSL_PROJECT_DIR || '/mnt/c/web/web';
  const wrapped = `cd ${wslPath} 2>/dev/null || cd ~/web; ${command}`;
  console.log(`[${label}] Windows MySQL unavailable — running in WSL…`);
  const result = spawnSync('wsl', ['-e', 'bash', '-lc', wrapped], {
    stdio: 'inherit',
    cwd: cwd || process.cwd(),
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

export function shouldFallbackToWsl(err, noFallback) {
  return (
    !noFallback &&
    process.platform === 'win32' &&
    (err?.code === 'ER_ACCESS_DENIED_ERROR' ||
      err?.code === 'ECONNREFUSED' ||
      String(err?.message || '').includes('P1000'))
  );
}

export function printWindowsDbHelp() {
  console.error(`
Windows MySQL ไม่มี user geserverhub หรือรหัสผ่านไม่ตรงกับ .env.local
เลือกอย่างใดอย่างหนึ่ง:
  1) รันใน WSL:  wsl -e bash -lc "cd /mnt/c/web/web && npm run db:check"
  2) สร้าง user บน Windows MySQL:
       $env:MYSQL_ROOT_PASSWORD="รหัส-root"
       node scripts/setup-windows-db-user.mjs
  3) รัน dev ผ่าน WSL:  npm run dev  (ไม่ใช้ dev:fast)
`);
}
