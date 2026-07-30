import { Resend } from 'resend';

let _client = null;

function client() {
  if (!_client) _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

export function isEmailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

function interpolate(tmpl, vars) {
  return String(tmpl ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

// Rolling window: max 10 admin notification batches per hour across all IPs.
// Resets on server restart — the IP rate limiter on /api/confirm is the primary defence.
const _adminNotifTs = [];
const ADMIN_NOTIF_MAX_PER_HOUR = 10;

function adminNotifAllowed() {
  const now = Date.now();
  const cutoff = now - 60 * 60 * 1000;
  while (_adminNotifTs.length && _adminNotifTs[0] < cutoff) _adminNotifTs.shift();
  if (_adminNotifTs.length >= ADMIN_NOTIF_MAX_PER_HOUR) return false;
  _adminNotifTs.push(now);
  return true;
}

export async function sendConfirmationEmail(signup, token, emailCfg, baseUrl) {
  const name = signup.data?.name || 'there';
  const confirmUrl = `${baseUrl}/api/confirm/${token}`;
  const { error } = await client().emails.send({
    from: emailCfg.from,
    to: signup.data.email,
    subject: interpolate(emailCfg.confirmation.subject, { name, confirmUrl }),
    text: interpolate(emailCfg.confirmation.body, { name, confirmUrl }),
  });
  if (error) throw new Error(error.message || 'send failed');
}

export async function sendWelcomeEmail(signup, emailCfg) {
  const name = signup.data?.name || 'there';
  const { error } = await client().emails.send({
    from: emailCfg.from,
    to: signup.data.email,
    subject: interpolate(emailCfg.welcome.subject, { name }),
    text: interpolate(emailCfg.welcome.body, { name }),
  });
  if (error) throw new Error(error.message || 'send failed');
}

export async function sendAdminNotificationEmail(emailCfg, name, totalSignups, confirmedSignups) {
  const toList = (emailCfg.adminNotification?.to || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);
  if (!toList.length) return;
  if (!adminNotifAllowed()) {
    console.warn('[email] admin notification rate limit reached, skipping');
    return;
  }
  const vars = { name, totalSignups: String(totalSignups), confirmedSignups: String(confirmedSignups) };
  const cfg = emailCfg.adminNotification;
  for (const to of toList) {
    const { error } = await client().emails.send({
      from: emailCfg.from,
      to,
      subject: interpolate(cfg.subject, vars),
      text: interpolate(cfg.body, vars),
    });
    if (error) throw new Error(error.message || 'send failed');
  }
}

export async function sendBroadcast({ from, recipients, subject, body }) {
  const CHUNK = 100;
  let sent = 0;
  for (let i = 0; i < recipients.length; i += CHUNK) {
    const emails = recipients.slice(i, i + CHUNK).map((to) => ({
      from, to, subject, text: body,
    }));
    const { data, error } = await client().batch.send(emails);
    if (error) throw new Error(error.message || 'batch send failed');
    sent += data?.length ?? emails.length;
  }
  return sent;
}
