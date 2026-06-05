/** Normalize UI/locale date strings to MySQL DATETIME (YYYY-MM-DD HH:MM:SS). */
export function toMysqlDateTime(value: string | undefined | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed === '—' || trimmed === '-') return null;

  const mysqlMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/);
  if (mysqlMatch) {
    return mysqlMatch[2] ? `${mysqlMatch[1]} ${mysqlMatch[2]}` : `${mysqlMatch[1]} 00:00:00`;
  }

  const iso = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/,
  );
  if (iso) return `${iso[1]} ${iso[2]}`;

  const us = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/i,
  );
  if (us) {
    const month = Number(us[1]);
    const day = Number(us[2]);
    const year = Number(us[3]);
    let hour = Number(us[4]);
    const minute = Number(us[5]);
    const second = Number(us[6]);
    const ampm = us[7].toUpperCase();
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}:${pad(parsed.getSeconds())}`;
}
