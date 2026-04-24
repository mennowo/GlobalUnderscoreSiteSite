import { db } from './db.js';
import { hashPassword, fingerprintEnvPassword } from './auth.js';

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    bootstrap_fingerprint TEXT,
    created_at TEXT NOT NULL
  );
`);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function findUserByEmail(email) {
  const row = db
    .prepare('SELECT id, email, password_hash, is_admin, bootstrap_fingerprint, created_at FROM users WHERE email = ?')
    .get(normalizeEmail(email));
  return row || null;
}

export function findUserById(id) {
  if (!Number.isInteger(id)) return null;
  const row = db
    .prepare('SELECT id, email, password_hash, is_admin, bootstrap_fingerprint, created_at FROM users WHERE id = ?')
    .get(id);
  return row || null;
}

export function listUsers() {
  return db
    .prepare('SELECT id, email, is_admin, created_at FROM users ORDER BY created_at ASC, id ASC')
    .all();
}

export function countAdmins() {
  return db.prepare('SELECT COUNT(*) AS n FROM users WHERE is_admin = 1').get().n;
}

export async function createUser({ email, password, isAdmin = false, bootstrapFingerprint = null }) {
  const e = normalizeEmail(email);
  if (!e || !e.includes('@')) throw new Error('invalid email');
  const hash = await hashPassword(password);
  const now = new Date().toISOString();
  const info = db
    .prepare(
      'INSERT INTO users (email, password_hash, is_admin, bootstrap_fingerprint, created_at) VALUES (?, ?, ?, ?, ?)',
    )
    .run(e, hash, isAdmin ? 1 : 0, bootstrapFingerprint, now);
  return findUserById(Number(info.lastInsertRowid));
}

export async function updateUserPassword(id, newPassword) {
  const hash = await hashPassword(newPassword);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, id);
}

export function deleteUserById(id) {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return info.changes > 0;
}

// Bootstrap the first admin from env vars. Re-syncs the password if the env password changes.
export async function bootstrapAdmin({ email, password }) {
  const e = normalizeEmail(email);
  if (!e || !password) return { action: 'skipped' };
  const fp = fingerprintEnvPassword(password);
  const existing = findUserByEmail(e);
  if (!existing) {
    await createUser({ email: e, password, isAdmin: true, bootstrapFingerprint: fp });
    return { action: 'created', email: e };
  }
  if (existing.bootstrap_fingerprint !== fp) {
    const hash = await hashPassword(password);
    db.prepare(
      'UPDATE users SET password_hash = ?, is_admin = 1, bootstrap_fingerprint = ? WHERE id = ?',
    ).run(hash, fp, existing.id);
    return { action: 'reset', email: e };
  }
  // Ensure they are still admin (an accidental demotion should not lock the env-owner out).
  if (!existing.is_admin) {
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(existing.id);
    return { action: 'repromoted', email: e };
  }
  return { action: 'noop', email: e };
}
