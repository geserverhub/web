import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execPromise = promisify(exec);
const BACKUPS_DIR = path.join(process.cwd(), 'backups');

// GET: return info about the latest backup
export async function GET() {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return Response.json({ success: false, message: 'ไม่พบโฟลเดอร์ backup' }, { status: 404 });
    }

    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.tar.gz') || f.endsWith('.tar') || f.endsWith('.sql') || f.endsWith('.sql.gz'))
      .map(filename => {
        const filepath = path.join(BACKUPS_DIR, filename);
        const stats = fs.statSync(filepath);
        return { filename, mtime: stats.mtime, size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`, created: stats.mtime.toISOString() };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (!files.length) {
      return Response.json({ success: false, message: 'ไม่มีไฟล์ backup' }, { status: 404 });
    }

    const latest = files[0];
    return Response.json({ success: true, latest, totalBackups: files.length });
  } catch (err) {
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST: restore from the latest backup file
export async function POST() {
  const tmpDir = path.join(BACKUPS_DIR, `_restore_tmp_${Date.now()}`);
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return Response.json({ success: false, message: 'ไม่พบโฟลเดอร์ backup' }, { status: 404 });
    }

    const files = fs.readdirSync(BACKUPS_DIR)
      .filter(f => f.endsWith('.tar.gz') || f.endsWith('.tar') || f.endsWith('.sql') || f.endsWith('.sql.gz'))
      .map(filename => ({ filename, mtime: fs.statSync(path.join(BACKUPS_DIR, filename)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);

    if (!files.length) {
      return Response.json({ success: false, message: 'ไม่มีไฟล์ backup ให้กู้คืน' }, { status: 404 });
    }

    const latestFile = files[0].filename;
    const latestPath = path.join(BACKUPS_DIR, latestFile);

    const dbHost = process.env.DB_HOST || '127.0.0.1';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';

    let sqlFile;

    if (latestFile.endsWith('.tar.gz') || latestFile.endsWith('.tar')) {
      fs.mkdirSync(tmpDir, { recursive: true });
      const tarFlag = latestFile.endsWith('.tar.gz') ? '-xzf' : '-xf';
      await execPromise(`tar ${tarFlag} ${latestPath} -C ${tmpDir}`);
      const extracted = fs.readdirSync(tmpDir).find(f => f.endsWith('.sql'));
      if (!extracted) {
        return Response.json({ success: false, message: 'ไม่พบไฟล์ .sql ใน archive' }, { status: 500 });
      }
      sqlFile = path.join(tmpDir, extracted);
    } else if (latestFile.endsWith('.sql.gz')) {
      fs.mkdirSync(tmpDir, { recursive: true });
      sqlFile = path.join(tmpDir, 'dump.sql');
      await execPromise(`gunzip -c ${latestPath} > ${sqlFile}`);
    } else {
      sqlFile = latestPath;
    }

    const mysqlCmd = dbPassword
      ? `mysql -h ${dbHost} -u ${dbUser} -p'${dbPassword}' < ${sqlFile}`
      : `mysql -h ${dbHost} -u ${dbUser} < ${sqlFile}`;

    await execPromise(mysqlCmd);

    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });

    return Response.json({
      success: true,
      message: `กู้คืนฐานข้อมูลสำเร็จ จากไฟล์ ${latestFile}`,
      filename: latestFile,
    });
  } catch (err) {
    console.error('[restore]', err);
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    return Response.json({ success: false, message: err.message }, { status: 500 });
  }
}
