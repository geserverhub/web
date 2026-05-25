import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

function formatDatetime(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}_${h}-${mi}-${s}`;
}

// GET: List all backup files
export async function GET(req) {
  try {
    const backupDir = path.join(process.cwd(), 'backups');

    if (!fs.existsSync(backupDir)) {
      return Response.json({ success: true, backups: [], message: 'ไม่มีไฟล์ backup' });
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(f => f.endsWith('.tar') || f.endsWith('.tar.gz') || f.endsWith('.sql') || f.endsWith('.sql.gz'))
      .map(filename => {
        const filepath = path.join(backupDir, filename);
        const stats = fs.statSync(filepath);
        return {
          filename,
          size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
          sizeBytes: stats.size,
          created: stats.mtime.toISOString(),
          createdDate: new Date(stats.mtime).toLocaleString('th-TH'),
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));

    return Response.json({
      success: true,
      backups,
      totalBackups: backups.length,
      totalSize: `${(backups.reduce((sum, b) => sum + b.sizeBytes, 0) / 1024 / 1024).toFixed(2)} MB`,
    });
  } catch (error) {
    console.error('Backup list error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST: Create full .tar.gz backup (all databases + timestamp)
export async function POST(req) {
  const backupDir = path.join(process.cwd(), 'backups');
  const tmpDir = path.join(backupDir, `_tmp_${Date.now()}`);

  try {
    const now = new Date();
    const dateStr = formatDatetime(now);
    const archiveName = `geserverhub_backup_${dateStr}.tar.gz`;
    const archivePath = path.join(backupDir, archiveName);
    const sqlFile = path.join(tmpDir, 'all_databases.sql');

    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    fs.mkdirSync(tmpDir, { recursive: true });

    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'geserverhub';
    const dbPassword = process.env.DB_PASSWORD || '';

    // Dump all databases
    const dumpCmd = dbPassword
      ? `mysqldump -h ${dbHost} -u ${dbUser} -p'${dbPassword}' --all-databases --single-transaction --routines --triggers > ${sqlFile}`
      : `mysqldump -h ${dbHost} -u ${dbUser} --all-databases --single-transaction --routines --triggers > ${sqlFile}`;

    await execPromise(dumpCmd);

    // Pack into .tar.gz
    await execPromise(`tar -czf ${archivePath} -C ${tmpDir} .`);

    // Clean up temp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });

    if (!fs.existsSync(archivePath)) {
      return Response.json({ success: false, message: 'ไม่สามารถสร้างไฟล์ backup' }, { status: 500 });
    }

    const stats = fs.statSync(archivePath);
    return Response.json({
      success: true,
      message: 'Full backup สำเร็จ',
      filename: archiveName,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      sizeBytes: stats.size,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Backup error:', error);
    // Clean up temp dir on error
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
