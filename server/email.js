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
