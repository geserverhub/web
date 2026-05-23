/**
 * Parse a fetch Response as JSON; avoid "Unexpected token '<'" when the server returns HTML.
 */
export async function parseJsonResponse(res) {
  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed) {
    return { error: res.ok ? null : `Request failed (${res.status})` };
  }
  if (trimmed.startsWith('<')) {
    const message =
      res.status >= 500
        ? 'Server error — run: npx prisma generate && restart dev server'
        : `Request failed (${res.status})`;
    return { error: message, _html: true };
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    const preview = trimmed.slice(0, 120).replace(/\s+/g, ' ');
    return {
      error: 'Invalid response from server',
      _parseError: true,
      _preview: preview,
    };
  }
}
