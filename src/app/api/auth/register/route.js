import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import { queryGeserverhub } from "@/lib/geserverhub-db";
import {
  escapeHtml,
  getMissingSmtpEnv,
  getSmtpTransportOptions,
} from "@/lib/smtp-config";

function validateDevice(device) {
  if (!device || typeof device !== "object") return false;
  const base =
    String(device.serial || "").trim() &&
    String(device.model || "").trim() &&
    String(device.installAddress || "").trim() &&
    String(device.installPostal || "").trim() &&
    String(device.installCountry || "").trim();
  if (!base) return false;

  const conn = String(device.connectionType || "").trim();
  if (conn === "sim") return Boolean(String(device.simPhone || "").trim());
  if (conn === "wifi") return Boolean(String(device.wifiDetail || "").trim());
  return false;
}

function formatDeviceConnection(d) {
  const conn = String(d.connectionType || "").trim();
  if (conn === "wifi") {
    return `Wi‑Fi: ${d.wifiDetail || "—"}`;
  }
  if (conn === "sim") {
    return `SIM: ${d.simPhone || "—"}`;
  }
  const legacy = String(d.simPhone || "").trim();
  return legacy ? `SIM: ${legacy}` : "—";
}

async function ensureDeviceRegistrationSchema() {
  await queryGeserverhub(`
    CREATE TABLE IF NOT EXISTS ge_platform_device_registration (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id VARCHAR(191) NOT NULL,
      device_id BIGINT NULL,
      serial_no VARCHAR(191) NOT NULL,
      model_name VARCHAR(191) NOT NULL,
      connection_type VARCHAR(32) NULL,
      sim_phone VARCHAR(64) NULL,
      wifi_detail VARCHAR(255) NULL,
      install_address TEXT NULL,
      install_postal VARCHAR(32) NULL,
      install_country VARCHAR(120) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_ge_platform_registration_user (user_id),
      UNIQUE KEY uq_ge_platform_registration_device (device_id),
      UNIQUE KEY uq_ge_platform_registration_serial_model (serial_no, model_name),
      KEY idx_ge_platform_registration_device (device_id),
      CONSTRAINT fk_ge_platform_registration_user
        FOREIGN KEY (user_id) REFERENCES \`User\`(id) ON DELETE CASCADE,
      CONSTRAINT fk_ge_platform_registration_device
        FOREIGN KEY (device_id) REFERENCES devices(deviceID) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function findDeviceBySerialAndModel(serial, model) {
  const serialNorm = String(serial || "").trim();
  const modelNorm = String(model || "").trim();
  if (!serialNorm || !modelNorm) return null;
  const rows = await queryGeserverhub(
    `SELECT d.deviceID, d.deviceName, d.series_no, d.location
     FROM devices d
     WHERE LOWER(TRIM(COALESCE(d.series_no, ''))) = LOWER(TRIM(?))
       AND LOWER(TRIM(COALESCE(d.deviceName, ''))) = LOWER(TRIM(?))
     ORDER BY d.deviceID DESC
     LIMIT 1`,
    [serialNorm, modelNorm]
  );
  return rows[0] || null;
}

async function updateDeviceProfile(deviceId, payload) {
  const cols = await queryGeserverhub(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'devices'`
  );
  const colSet = new Set(cols.map((r) => String(r.COLUMN_NAME)));
  const connectionType = String(payload.connectionType || "").trim();
  const meterPhone =
    connectionType === "sim"
      ? String(payload.simPhone || "").trim()
      : "";
  const updates = [];
  const params = [];
  if (colSet.has("U_email")) {
    updates.push("U_email = ?");
    params.push(payload.email || null);
  }
  if (colSet.has("customerName")) {
    updates.push("customerName = ?");
    params.push(payload.customerName || null);
  }
  if (colSet.has("customerPhone")) {
    updates.push("customerPhone = ?");
    params.push(payload.customerPhone || null);
  }
  if (colSet.has("customerAddress")) {
    updates.push("customerAddress = ?");
    params.push(payload.installAddress || null);
  }
  if (colSet.has("location")) {
    updates.push("location = COALESCE(NULLIF(?, ''), location)");
    params.push(payload.installCountry || "");
  }
  if (colSet.has("phone")) {
    updates.push("phone = COALESCE(NULLIF(?, ''), phone)");
    params.push(meterPhone);
  }
  if (colSet.has("pass_phone")) {
    updates.push("pass_phone = COALESCE(NULLIF(?, ''), pass_phone)");
    params.push(meterPhone);
  }
  if (colSet.has("updated_at")) {
    updates.push("updated_at = NOW()");
  }
  if (!updates.length) return;
  params.push(deviceId);
  await queryGeserverhub(`UPDATE devices SET ${updates.join(", ")} WHERE deviceID = ?`, params);
}

async function upsertMomogeCustomer(deviceId, payload) {
  const rows = await queryGeserverhub(
    `SELECT mmgID FROM momoge_cus WHERE device_id = ? ORDER BY mmgID DESC LIMIT 1`,
    [deviceId]
  );
  const existing = rows[0];
  if (existing?.mmgID) {
    await queryGeserverhub(
      `UPDATE momoge_cus
       SET nameTH = COALESCE(NULLIF(?, ''), nameTH),
           nameEN = COALESCE(NULLIF(?, ''), nameEN),
           phone = COALESCE(NULLIF(?, ''), phone),
           address = COALESCE(NULLIF(?, ''), address),
           serailID = COALESCE(NULLIF(?, ''), serailID),
           updated_at = NOW()
       WHERE mmgID = ?`,
      [
        payload.customerName || "",
        payload.customerNameEn || "",
        payload.customerPhone || "",
        payload.installAddress || "",
        payload.serial || "",
        existing.mmgID,
      ]
    );
    return;
  }
  await queryGeserverhub(
    `INSERT INTO momoge_cus (device_id, serailID, nameTH, nameEN, phone, address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      deviceId,
      payload.serial || null,
      payload.customerName || null,
      payload.customerNameEn || null,
      payload.customerPhone || null,
      payload.installAddress || null,
    ]
  );
}

async function notifyRegistrationEmail(payload) {
  const missing = getMissingSmtpEnv();
  const smtpOpts = getSmtpTransportOptions();
  if (missing.length > 0 || !smtpOpts.host) return;

  const d = payload.device;
  const transporter = nodemailer.createTransport({
    ...smtpOpts,
    tls: { minVersion: "TLSv1.2" },
  });

  const safe = {
    name: escapeHtml(payload.name),
    company: escapeHtml(payload.company || "—"),
    email: escapeHtml(payload.email),
    phone: escapeHtml(payload.phone || "—"),
    username: escapeHtml(payload.username || "—"),
    serial: escapeHtml(d.serial),
    model: escapeHtml(d.model),
    connection: escapeHtml(formatDeviceConnection(d)),
    simPhone: escapeHtml(d.simPhone || "—"),
    wifiDetail: escapeHtml(d.wifiDetail || "—"),
    installAddress: escapeHtml(d.installAddress),
    installPostal: escapeHtml(d.installPostal),
    installCountry: escapeHtml(d.installCountry),
    lang: escapeHtml(payload.lang || "th"),
  };

  await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_USER,
    to: process.env.CONTACT_TO_EMAIL.trim(),
    replyTo: payload.email,
    subject: `[GE Energy Tech] ลงทะเบียนแพลตฟอร์ม — ${payload.name}`,
    text: [
      `ชื่อ: ${payload.name}`,
      `บริษัท: ${payload.company || "—"}`,
      `อีเมล: ${payload.email}`,
      `โทร: ${payload.phone || "—"}`,
      `Username: ${payload.username || "—"}`,
      "",
      "— อุปกรณ์ —",
      `Serial: ${d.serial}`,
      `Model: ${d.model}`,
      `Connection: ${formatDeviceConnection(d)}`,
      `ที่อยู่ติดตั้ง: ${d.installAddress}`,
      `รหัสไปรษณีย์: ${d.installPostal}`,
      `ประเทศ: ${d.installCountry}`,
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="color:#166534">ลงทะเบียนแพลตฟอร์ม GE Energy Tech</h2>
        <h3>ข้อมูลผู้สมัคร</h3>
        <p><strong>ชื่อ:</strong> ${safe.name}</p>
        <p><strong>บริษัท:</strong> ${safe.company}</p>
        <p><strong>อีเมล:</strong> ${safe.email}</p>
        <p><strong>โทร:</strong> ${safe.phone}</p>
        <p><strong>Username:</strong> ${safe.username}</p>
        <p><strong>ภาษา:</strong> ${safe.lang}</p>
        <h3>ข้อมูลอุปกรณ์</h3>
        <p><strong>เลขซีเรียล:</strong> ${safe.serial}</p>
        <p><strong>รุ่น:</strong> ${safe.model}</p>
        <p><strong>การเชื่อมต่อ:</strong> ${safe.connection}</p>
        <p><strong>ที่อยู่ติดตั้ง:</strong><br/>${safe.installAddress}</p>
        <p><strong>รหัสไปรษณีย์:</strong> ${safe.installPostal}</p>
        <p><strong>ประเทศ:</strong> ${safe.installCountry}</p>
      </div>
    `,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, company, phone, username, device, lang } = body;

    if (!email || !password || !name?.trim()) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    if (!validateDevice(device)) {
      return NextResponse.json(
        {
          error:
            "กรุณากรอกข้อมูลอุปกรณ์ให้ครบ (เลขซีเรียล รุ่น ที่อยู่ รหัสไปรษณีย์ ประเทศ) และเลือกการเชื่อมต่อซิมหรือ Wi‑Fi พร้อมระบุรายละเอียด",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" }, { status: 400 });
    }

    const emailNorm = String(email).trim().toLowerCase();
    const usernameNorm = String(username || emailNorm.split("@")[0] || "")
      .trim()
      .toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
    }

    if (usernameNorm) {
      const existingUser = await prisma.user.findUnique({ where: { username: usernameNorm } });
      if (existingUser) {
        return NextResponse.json({ error: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว" }, { status: 409 });
      }
    }

    const matchedDevice = await findDeviceBySerialAndModel(
      device?.serial,
      device?.model
    );
    if (!matchedDevice) {
      return NextResponse.json(
        {
          error:
            "ไม่พบข้อมูลอุปกรณ์ที่ตรงกับเลขซีเรียลและชื่อรุ่นจากหน้าจัดการอุปกรณ์ กรุณาตรวจสอบข้อมูลอีกครั้ง",
          code: "DEVICE_NOT_MATCHED",
        },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);
    const displayName = [String(name).trim(), company?.trim() ? `(${company.trim()})` : ""]
      .filter(Boolean)
      .join(" ");
    const metaNote = phone?.trim() ? ` · tel:${phone.trim()}` : "";
    const connTag =
      device.connectionType === "wifi"
        ? `wifi:${String(device.wifiDetail || "").trim()}`
        : `sim:${String(device.simPhone || "").trim()}`;
    const deviceNote = ` · device:${device.serial}|${device.model}|${connTag}`;

    const createdUser = await prisma.user.create({
      data: {
        name: `${displayName}${metaNote}${deviceNote}`,
        email: emailNorm,
        username: usernameNorm || null,
        password: hashed,
        role: "CLIENT",
      },
    });

    const connectionType = String(device.connectionType || "").trim();
    const devicePayload = {
      serial: String(device.serial).trim(),
      model: String(device.model).trim(),
      connectionType,
      simPhone: connectionType === "sim" ? String(device.simPhone || "").trim() : "",
      wifiDetail: connectionType === "wifi" ? String(device.wifiDetail || "").trim() : "",
      installAddress: String(device.installAddress).trim(),
      installPostal: String(device.installPostal).trim(),
      installCountry: String(device.installCountry).trim(),
    };

    await ensureDeviceRegistrationSchema();
    await queryGeserverhub(
      `INSERT INTO ge_platform_device_registration
        (user_id, device_id, serial_no, model_name, connection_type, sim_phone, wifi_detail, install_address, install_postal, install_country)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         device_id = VALUES(device_id),
         serial_no = VALUES(serial_no),
         model_name = VALUES(model_name),
         connection_type = VALUES(connection_type),
         sim_phone = VALUES(sim_phone),
         wifi_detail = VALUES(wifi_detail),
         install_address = VALUES(install_address),
         install_postal = VALUES(install_postal),
         install_country = VALUES(install_country),
         updated_at = NOW()`,
      [
        createdUser.id,
        matchedDevice.deviceID,
        devicePayload.serial,
        devicePayload.model,
        devicePayload.connectionType || null,
        devicePayload.simPhone || null,
        devicePayload.wifiDetail || null,
        devicePayload.installAddress || null,
        devicePayload.installPostal || null,
        devicePayload.installCountry || null,
      ]
    );

    await updateDeviceProfile(matchedDevice.deviceID, {
      email: emailNorm,
      customerName: String(name || "").trim(),
      customerNameEn: String(name || "").trim(),
      customerPhone: phone?.trim() || "",
      ...devicePayload,
    });
    await upsertMomogeCustomer(matchedDevice.deviceID, {
      customerName: String(name || "").trim(),
      customerNameEn: String(name || "").trim(),
      customerPhone: phone?.trim() || "",
      ...devicePayload,
    });

    try {
      await notifyRegistrationEmail({
        name: String(name).trim(),
        company: company?.trim(),
        email: emailNorm,
        phone: phone?.trim(),
        username: usernameNorm,
        lang,
        device: devicePayload,
      });
    } catch (mailErr) {
      console.error("[register] notification email failed:", mailErr);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดภายใน" }, { status: 500 });
  }
}
