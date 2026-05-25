import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = promisify(exec);

export async function POST(req) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups');
    const filename = `geserverhub_${timestamp}.sql`;
    const filepath = path.join(backupDir, filename);

    // สร้างโฟลเดอร์ backups ถ้าไม่มี
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // MySQL dump command
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'geserverhub';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbName = process.env.DB_NAME || 'geserverhub';

    const command = `mysqldump -h ${dbHost} -u ${dbUser} -p'${dbPassword}' ${dbName} > ${filepath}`;

    // รัน mysqldump
    await execPromise(command);

    // ตรวจสอบว่าไฟล์ถูกสร้างสำเร็จ
    if (fs.existsSync(filepath)) {
      const stats = fs.statSync(filepath);
      return Response.json({
        success: true,
        message: 'Backup สำเร็จ',
        filename: filename,
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        timestamp: new Date().toISOString(),
      });
    } else {
      return Response.json(
        { success: false, message: 'ไม่สามารถสร้างไฟล์ backup' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Backup error:', error);
    return Response.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
