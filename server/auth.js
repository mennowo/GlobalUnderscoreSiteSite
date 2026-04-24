import { randomBytes, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import session from 'express-session';
import SqliteStoreFactory from 'better-sqlite3-session-store';
import { db } from './db.js';

const scryptAsync = promisify(scrypt);

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;

export const MIN_PASSWORD_LEN = 12;

export async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length < MIN_PASSWORD_LEN) {
    throw new Error(`password must be at least ${MIN_PASSWORD_LEN} characters`);
  }
  const salt = randomBytes(16);
  const derived = await scryptAsync(plain, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'hex');
  const expected = Buffer.from(parts[5], 'hex');
  const derived = await scryptAsync(plain, salt, expected.length, { N, r, p });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

// cheap change-detector for the bootstrap env password; not used for auth.
export function fingerprintEnvPassword(plain) {
  return createHash('sha256').update(plain, 'utf8').digest('hex');
}

const SqliteStore = SqliteStoreFactory(session);

export function buildSessionMiddleware(secret) {
  if (!secret) throw new Error('SESSION_SECRET required for local auth');
  const store = new SqliteStore({
    client: db,
    expired: { clear: true, intervalMs: 15 * 60 * 1000 },
  });
  return session({
    name: 'gu.sid',
    store,
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 14,
    },
  });
}

export function rotateSession(req) {
  return new Promise((resolve, reject) => {
    const data = { ...req.session };
    delete data.cookie;
    req.session.regenerate((err) => {
      if (err) return reject(err);
      Object.assign(req.session, data);
      req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
    });
  });
}
