import { readFileSync } from 'fs';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { queryGeserverhub } from '@/lib/geserverhub-db';

let schemaReady = false;

/** face-api: typical match threshold (euclidean distance). */
export const FACE_MATCH_THRESHOLD = 0.55;
export const FACE_MATCH_MIN_MARGIN = 0.04;

export async function ensureFaceAttendanceSchema() {
  if (schemaReady) return;
  const sqlPath = join(process.cwd(), 'prisma', 'migrate-ge-energy-erp-face-attendance.sql');
  const raw = readFileSync(sqlPath, 'utf8');
  const statements = raw
    .split(';')
    .map((s) => s.replace(/--[^\n]*/g, '').trim())
    .filter((s) => s.length > 0 && !/^USE /i.test(s));

  for (const stmt of statements) {
    try {
      await queryGeserverhub(stmt);
    } catch (err) {
      const msg = err?.message || '';
      if (/already exists|Duplicate column|Duplicate key name|errno: 1050|errno: 1061/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }
  schemaReady = true;
}

function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = Number(a[i]) - Number(b[i]);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export function matchEmployeeFromDescriptor(descriptor, enrolledRows) {
  const scores = [];
  for (const row of enrolledRows) {
    let desc = row.face_descriptor;
    if (typeof desc === 'string') {
      try {
        desc = JSON.parse(desc);
      } catch {
        continue;
      }
    }
    const distance = euclideanDistance(descriptor, desc);
    scores.push({
      employeeId: row.employee_id,
      employeeCode: row.employee_code,
      fullName: row.full_name,
      faceId: row.id,
      distance,
    });
  }
  scores.sort((x, y) => x.distance - y.distance);
  if (!scores.length) {
    return { ok: false, error: 'no_enrolled_faces' };
  }
  const best = scores[0];
  const second = scores[1];
  if (best.distance > FACE_MATCH_THRESHOLD) {
    return { ok: false, error: 'face_not_recognized', best };
  }
  if (second && second.distance - best.distance < FACE_MATCH_MIN_MARGIN) {
    return { ok: false, error: 'ambiguous_match', best, second };
  }
  return { ok: true, match: best };
}

export async function listEmployeesWithFaceStatus() {
  await ensureFaceAttendanceSchema();
  return queryGeserverhub(
    `SELECT e.id, e.employee_code, e.full_name, e.department_id, e.status,
            f.id AS face_id, f.photo_path AS face_photo, f.enrolled_at
     FROM ge_erp_employee e
     LEFT JOIN ge_erp_employee_face f ON f.employee_id = e.id
     WHERE e.status = 'active'
     ORDER BY e.full_name ASC`
  );
}

export async function getEnrolledDescriptorsForMatch() {
  await ensureFaceAttendanceSchema();
  return queryGeserverhub(
    `SELECT f.id, f.employee_id, f.face_descriptor,
            e.employee_code, e.full_name
     FROM ge_erp_employee_face f
     JOIN ge_erp_employee e ON e.id = f.employee_id
     WHERE e.status = 'active' AND f.is_primary = 1`
  );
}

export async function saveFacePhoto(base64DataUrl) {
  const match = String(base64DataUrl || '').match(/^data:image\/(\w+);base64,(.+)$/);
  if (!match) throw new Error('Invalid image data');
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 4 * 1024 * 1024) throw new Error('Image too large (max 4MB)');

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', 'erp-face');
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, safeName), buffer);
  return `/uploads/erp-face/${safeName}`;
}

export async function upsertEmployeeFace({ employeeId, descriptor, photoPath, enrolledBy }) {
  await ensureFaceAttendanceSchema();
  if (!employeeId || !Array.isArray(descriptor) || descriptor.length < 64) {
    throw new Error('employeeId and valid face descriptor required');
  }
  const descJson = JSON.stringify(descriptor);
  await queryGeserverhub(
    `INSERT INTO ge_erp_employee_face (employee_id, face_descriptor, photo_path, is_primary, enrolled_by)
     VALUES (?, ?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE
       face_descriptor = VALUES(face_descriptor),
       photo_path = VALUES(photo_path),
       enrolled_by = VALUES(enrolled_by),
       updated_at = CURRENT_TIMESTAMP`,
    [employeeId, descJson, photoPath, enrolledBy || null]
  );
}

async function syncAttendanceLog(employeeId, eventType, capturedAt) {
  const logDate = String(capturedAt).slice(0, 10);
  const timePart = String(capturedAt).slice(11, 19);

  const existing = await queryGeserverhub(
    `SELECT id, check_in, check_out FROM ge_erp_attendance_log
     WHERE employee_id = ? AND log_date = ? LIMIT 1`,
    [employeeId, logDate]
  );

  if (eventType === 'check_in') {
    if (existing[0]?.check_in) {
      throw new Error('already_checked_in');
    }
    if (existing[0]?.id) {
      await queryGeserverhub(
        `UPDATE ge_erp_attendance_log SET check_in = ?, status = 'present' WHERE id = ?`,
        [timePart, existing[0].id]
      );
    } else {
      await queryGeserverhub(
        `INSERT INTO ge_erp_attendance_log (employee_id, log_date, check_in, status)
         VALUES (?, ?, ?, 'present')`,
        [employeeId, logDate, timePart]
      );
    }
    return;
  }

  if (eventType === 'check_out') {
    if (!existing[0]?.check_in) {
      throw new Error('check_in_required_first');
    }
    if (existing[0]?.check_out) {
      throw new Error('already_checked_out');
    }
    await queryGeserverhub(
      `UPDATE ge_erp_attendance_log SET check_out = ? WHERE id = ?`,
      [timePart, existing[0].id]
    );
  }
}

export async function recordFaceAttendance({
  employeeId,
  faceId,
  eventType,
  photoPath,
  matchScore,
  deviceNote,
  createdBy,
  capturedAt = new Date(),
}) {
  await ensureFaceAttendanceSchema();
  const captured =
    capturedAt instanceof Date
      ? capturedAt.toISOString().slice(0, 19).replace('T', ' ')
      : String(capturedAt).slice(0, 19);

  await syncAttendanceLog(employeeId, eventType, captured);

  const result = await queryGeserverhub(
    `INSERT INTO ge_erp_face_attendance
      (employee_id, event_type, captured_at, photo_path, match_score, face_id, device_note, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      employeeId,
      eventType,
      captured,
      photoPath,
      matchScore,
      faceId || null,
      deviceNote || null,
      createdBy || null,
    ]
  );

  const insertId = result?.insertId ?? result?.[0]?.insertId;
  return { id: insertId, capturedAt: captured };
}

export async function listFaceAttendance({ limit = 50 } = {}) {
  await ensureFaceAttendanceSchema();
  const cap = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return queryGeserverhub(
    `SELECT a.id, a.event_type AS eventType, a.captured_at AS capturedAt,
            a.photo_path AS photoPath, a.match_score AS matchScore,
            e.employee_code AS employeeCode, e.full_name AS employeeName
     FROM ge_erp_face_attendance a
     JOIN ge_erp_employee e ON e.id = a.employee_id
     ORDER BY a.id DESC
     LIMIT ${cap}`
  );
}

export async function clockByDescriptor({
  descriptor,
  photoPath,
  eventType,
  deviceNote,
  createdBy,
}) {
  const enrolled = await getEnrolledDescriptorsForMatch();
  const matched = matchEmployeeFromDescriptor(descriptor, enrolled);
  if (!matched.ok) {
    return matched;
  }
  const { match } = matched;
  try {
    const record = await recordFaceAttendance({
      employeeId: match.employeeId,
      faceId: match.faceId,
      eventType,
      photoPath,
      matchScore: match.distance,
      deviceNote,
      createdBy,
    });
    return {
      ok: true,
      employee: {
        id: match.employeeId,
        code: match.employeeCode,
        name: match.fullName,
      },
      matchScore: match.distance,
      ...record,
    };
  } catch (err) {
    const msg = err?.message || 'record_failed';
    return { ok: false, error: msg, match };
  }
}
