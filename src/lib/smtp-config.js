/** SMTP presets for GE Energy Tech contact form */
export const SMTP_PRESETS = {
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
  outlook: { host: 'smtp.office365.com', port: 587, secure: false },
  hotmail: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
  zoho: { host: 'smtp.zoho.com', port: 587, secure: false },
  sendgrid: { host: 'smtp.sendgrid.net', port: 587, secure: false },
  yahoo: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
};

export function getMissingSmtpEnv() {
  const required = ['SMTP_USER', 'SMTP_PASS', 'CONTACT_TO_EMAIL'];
  return required.filter((name) => !process.env[name]?.trim());
}

export function getSmtpTransportOptions() {
  const provider = (process.env.SMTP_PROVIDER || '').trim().toLowerCase();
  const preset = SMTP_PRESETS[provider] || {};

  const port = Number(process.env.SMTP_PORT || preset.port || 587);
  const secure =
    process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1' || port === 465;

  return {
    host: (process.env.SMTP_HOST || preset.host || '').trim(),
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.replace(/\s/g, ''),
    },
  };
}

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
