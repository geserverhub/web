import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  escapeHtml,
  getMissingSmtpEnv,
  getSmtpTransportOptions,
} from '@/lib/smtp-config';

export async function POST(request) {
  try {
    const missing = getMissingSmtpEnv();
    const smtpOpts = getSmtpTransportOptions();
    if (missing.length > 0 || !smtpOpts.host) {
      return NextResponse.json(
        {
          error: `Email service is not configured. Set in .env.local: ${[...missing, !smtpOpts.host ? 'SMTP_HOST or SMTP_PROVIDER' : ''].filter(Boolean).join(', ')}`,
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const subject = String(body?.subject || '').trim();
    const message = String(body?.message || '').trim();
    const lang = String(body?.lang || 'en').trim();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      ...smtpOpts,
      tls: { minVersion: 'TLSv1.2' },
    });

    const safe = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      subject: escapeHtml(subject),
      message: escapeHtml(message),
      lang: escapeHtml(lang),
    };

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL?.trim() || process.env.SMTP_USER,
      to: process.env.CONTACT_TO_EMAIL.trim(),
      replyTo: email,
      subject: `[GE Energy Tech Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nLanguage: ${lang}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
          <h2 style="margin:0 0 12px;color:#166534">New Contact Message</h2>
          <p><strong>Name:</strong> ${safe.name}</p>
          <p><strong>Email:</strong> ${safe.email}</p>
          <p><strong>Language:</strong> ${safe.lang}</p>
          <p><strong>Subject:</strong> ${safe.subject}</p>
          <p><strong>Message:</strong></p>
          <div style="padding:10px 12px;border:1px solid #bbf7d0;background:#f0fdf4;border-radius:8px;white-space:pre-wrap">${safe.message}</div>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[contact]', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
