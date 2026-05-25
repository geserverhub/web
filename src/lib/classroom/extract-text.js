/**
 * Extract plain text from uploaded homework question files (server-side).
 */

const TEXT_EXT = new Set(['.txt', '.md', '.csv', '.log']);

export function getFileExt(name) {
  const i = String(name || '').lastIndexOf('.');
  return i >= 0 ? String(name).slice(i).toLowerCase() : '';
}

export async function extractTextFromBuffer(buffer, filename, mime = '') {
  const ext = getFileExt(filename);
  const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (TEXT_EXT.has(ext) || mime.startsWith('text/')) {
    return buf.toString('utf8');
  }

  if (ext === '.pdf' || mime === 'application/pdf') {
    return extractRoughPdfText(buf);
  }

  if (ext === '.docx' || mime.includes('wordprocessingml')) {
    return extractRoughDocxText(buf);
  }

  if (ext === '.doc' || mime === 'application/msword') {
    return extractRoughDocText(buf);
  }

  if (ext === '.pptx' || mime.includes('presentationml')) {
    return extractRoughPptxText(buf);
  }

  if (ext === '.ppt' || mime.includes('powerpoint')) {
    return extractRoughDocText(buf);
  }

  throw new Error(
    'Unsupported file type. Use .txt, .pdf, .doc, .docx, .ppt, or .pptx — or paste question text below.',
  );
}

/** Best-effort PDF text (no native parser). */
function extractRoughPdfText(buf) {
  const raw = buf.toString('latin1');
  const chunks = [];
  const paren = /\(([^\\)]{2,500})\)/g;
  let m;
  while ((m = paren.exec(raw)) !== null) {
    const t = m[1].replace(/\\n/g, '\n').replace(/\\r/g, '').trim();
    if (t.length > 1 && /[\p{L}\p{N}]/u.test(t)) chunks.push(t);
  }
  const joined = [...new Set(chunks)].join('\n').trim();
  if (joined.length > 40) return joined;
  const utf = buf.toString('utf8');
  const lines = utf
    .split(/\r?\n/)
    .map((l) => l.replace(/[^\x20-\x7E\u0E00-\u0E7F\uAC00-\uD7AF]/g, ' ').trim())
    .filter((l) => l.length > 8);
  return lines.join('\n').trim();
}

/** DOCX = zip with word/document.xml */
function extractRoughDocxText(buf) {
  const raw = buf.toString('utf8');
  const texts = [];
  const re = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    if (m[1].trim()) texts.push(m[1]);
  }
  const joined = texts.join(' ').replace(/\s+/g, ' ').trim();
  if (joined.length > 20) return joined;
  throw new Error('Could not read .docx — paste question text in the box below.');
}

function extractRoughDocText(buf) {
  const raw = buf.toString('utf8');
  const cleaned = raw
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u0E00-\u0E7F\uAC00-\uD7AF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length > 40) return cleaned.slice(0, 50000);
  throw new Error('Could not read .doc — paste question text in the box below.');
}

function extractRoughPptxText(buf) {
  const raw = buf.toString('utf8');
  const texts = [];
  const re = /<a:t>([^<]*)<\/a:t>/g;
  let m;
  while ((m = re.exec(raw)) !== null) {
    if (m[1].trim()) texts.push(m[1]);
  }
  const joined = texts.join('\n').trim();
  if (joined.length > 20) return joined;
  throw new Error('Could not read .pptx — paste question text in the box below.');
}
