import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
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

    await prisma.user.create({
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
