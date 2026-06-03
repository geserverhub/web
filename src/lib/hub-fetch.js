/** Safe JSON parsing + ngrok-friendly headers for /downloads API calls. */

export async function readJsonResponse(response) {
  const text = await response.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      const trimmed = text.trimStart();
      if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html")) {
        throw new Error(
          "เซิร์ฟเวอร์ตอบกลับหน้า HTML แทน JSON — ตรวจสอบ URL/ngrok หรือรัน npm run db:migrate-software-downloads"
        );
      }
      throw new Error(`เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง (${response.status})`);
    }
  }
  if (!response.ok) {
    throw new Error(data.error || `เกิดข้อผิดพลาด (${response.status})`);
  }
  return data;
}

export function hubFetchHeaders(extra = {}) {
  return {
    "ngrok-skip-browser-warning": "true",
    ...extra,
  };
}

export async function hubJsonFetch(url, options = {}) {
  const headers = hubFetchHeaders(options.headers || {});
  const res = await fetch(url, { ...options, headers });
  return readJsonResponse(res);
}
