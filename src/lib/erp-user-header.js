function decodeBase64Json(raw) {
  try {
    const json = Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function parseErpUserHeader(req) {
  const b64 = req.headers.get('x-erp-user-b64');
  if (b64) {
    const parsed = decodeBase64Json(b64);
    if (parsed) return parsed;
  }

  const raw = req.headers.get('x-erp-user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
