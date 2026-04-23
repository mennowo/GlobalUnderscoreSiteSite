import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

// Signed time-token + honeypot. No API keys, no external deps.
//
// The client fetches /api/challenge on page load -> gets `{ token }`.
// Token format: `<ts>.<nonce>.<hmac>` (all base64url).
// On signup POST:
//   - reject if honeypot field (`hp`) is non-empty
//   - verify HMAC signature
//   - reject if age < MIN_MS (bots submit instantly) or > MAX_MS (stale page)
//
// Stateless: no server-side store required. Good enough to block drive-by bots.

const MIN_MS = 2_000;          // humans take > 2s to fill the form
const MAX_MS = 2 * 60 * 60_000; // tokens valid for 2h

function secret() {
  return process.env.SESSION_SECRET || 'dev-insecure-secret';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function sign(ts, nonce) {
  return createHmac('sha256', secret()).update(`${ts}.${nonce}`).digest();
}

export function issueChallenge() {
  const ts = Date.now();
  const nonce = b64url(randomBytes(12));
  const sig = b64url(sign(ts, nonce));
  return { token: `${ts}.${nonce}.${sig}` };
}

export function verifyChallenge(token, hp) {
  if (typeof hp === 'string' && hp.trim() !== '') {
    return { ok: false, reason: 'honeypot' };
  }
  if (typeof token !== 'string' || !token) {
    return { ok: false, reason: 'missing token' };
  }
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'bad token' };
  const [tsStr, nonce, sig] = parts;
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return { ok: false, reason: 'bad token' };

  const expected = sign(ts, nonce);
  let provided;
  try {
    provided = Buffer.from(sig, 'base64url');
  } catch {
    return { ok: false, reason: 'bad token' };
  }
  if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return { ok: false, reason: 'bad signature' };
  }

  const age = Date.now() - ts;
  if (age < MIN_MS) return { ok: false, reason: 'too fast' };
  if (age > MAX_MS) return { ok: false, reason: 'token expired — reload the page' };
  return { ok: true };
}
