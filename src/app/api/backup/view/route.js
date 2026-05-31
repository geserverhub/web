import path from 'path';
import fs from 'fs';

const BACKUPS_DIR = path.join(process.cwd(), 'backups');
const MAX_DISPLAY_BYTES = 2 * 1024 * 1024; // 2 MB display limit

function safeFilename(name) {
  // prevent path traversal — only allow filename chars, no slashes or dots that go up
  return /^[\w\-\.]+\.sql(\.gz)?$/.test(name) && !name.includes('..');
}

function parseSqlMeta(content) {
  const tables = [];
  const createRx = /^CREATE TABLE `?(\w+)`?/gim;
  let m;
  while ((m = createRx.exec(content)) !== null) {
    tables.push(m[1]);
  }

  const hostMatch = content.match(/^-- Host:\s*(.+)$/im);
  const dbMatch = content.match(/^-- Database:\s*(.+)$/im);
  const serverMatch = content.match(/^-- Server version:\s*(.+)$/im);
  const dumpDateMatch = content.match(/^-- Dump completed on\s*(.+)$/im);

  return {
    tables,
    host: hostMatch ? hostMatch[1].trim() : null,
    database: dbMatch ? dbMatch[1].trim() : null,
    serverVersion: serverMatch ? serverMatch[1].trim() : null,
    dumpDate: dumpDateMatch ? dumpDateMatch[1].trim() : null,
  };
}

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const filename = url.searchParams.get('filename');

    if (!filename || !safeFilename(filename)) {
      return Response.json({ success: false, message: 'Invalid filename' }, { status: 400 });
    }

    const filepath = path.join(BACKUPS_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return Response.json({ success: false, message: 'File not found' }, { status: 404 });
    }

    const stats = fs.statSync(filepath);
    const sizeBytes = stats.size;
    const sizeMB = (sizeBytes / 1024 / 1024).toFixed(3);

    // Read file (up to display limit)
    const fd = fs.openSync(filepath, 'r');
    const readBytes = Math.min(sizeBytes, MAX_DISPLAY_BYTES);
    const buf = Buffer.alloc(readBytes);
    fs.readSync(fd, buf, 0, readBytes, 0);
    fs.closeSync(fd);

    const content = buf.toString('utf8');
    const truncated = sizeBytes > MAX_DISPLAY_BYTES;
    const lineCount = content.split('\n').length;

    const meta = parseSqlMeta(content);

    return Response.json({
      success: true,
      filename,
      sizeBytes,
      sizeMB,
      lineCount,
      truncated,
      truncatedAt: truncated ? `${(MAX_DISPLAY_BYTES / 1024 / 1024).toFixed(0)} MB` : null,
      created: stats.mtime.toISOString(),
      meta,
      content,
    });
  } catch (error) {
    console.error('Backup view error:', error);
    return Response.json({ success: false, message: error.message }, { status: 500 });
  }
}
