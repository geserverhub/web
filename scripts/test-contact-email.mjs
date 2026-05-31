/**
 * Test SMTP for GE Energy Tech contact form.
 * Usage:
 *   node scripts/test-contact-email.mjs          # uses .env.local
 *   node scripts/test-contact-email.mjs --ethereal  # smoke test without real SMTP
 */
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import {
  getMissingSmtpEnv,
  getSmtpTransportOptions,
} from '../src/lib/smtp-config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env.local') });

const useEthereal = process.argv.includes('--ethereal');

async function sendTest(transporter, from, to) {
  const info = await transporter.sendMail({
    from,
    to,
    subject: '[GE Energy Tech] SMTP test',
    text: 'This is a test message from scripts/test-contact-email.mjs',
    html: '<p>SMTP test OK — contact form can send email.</p>',
  });
  return info;
}

async function main() {
  if (useEthereal) {
    console.log('Creating Ethereal test account (no real inbox)...');
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    const info = await sendTest(
      transporter,
      `"GE Energy Tech Test" <${testAccount.user}>`,
      testAccount.user
    );
    console.log('OK — Ethereal smoke test passed');
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return;
  }

  const missing = getMissingSmtpEnv();
  const opts = getSmtpTransportOptions();
  if (missing.length || !opts.host) {
    console.error('Missing configuration:', missing.join(', ') || 'SMTP_HOST');
    console.error('Fill .env.local (see .env.local.example) or run: node scripts/test-contact-email.mjs --ethereal');
    process.exit(1);
  }

  console.log('SMTP host:', opts.host + ':' + opts.port, opts.secure ? '(SSL)' : '(STARTTLS)');
  console.log('From:', process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER);
  console.log('To:', process.env.CONTACT_TO_EMAIL);

  const transporter = nodemailer.createTransport({
    ...opts,
    tls: { minVersion: 'TLSv1.2' },
  });

  await transporter.verify();
  console.log('SMTP connection verified');

  const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  const info = await sendTest(transporter, from, process.env.CONTACT_TO_EMAIL);
  console.log('OK — Test email sent. MessageId:', info.messageId);
}

main().catch((err) => {
  console.error('FAIL —', err.message);
  if (/Invalid login|535|534|authentication/i.test(err.message)) {
    console.error('Tip: Gmail/Outlook need an App Password (not your normal login password).');
  }
  process.exit(1);
});
