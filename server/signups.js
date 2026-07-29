import { randomUUID } from 'node:crypto';
import { db } from './db.js';

const insertStmt = db.prepare(
  'INSERT INTO signups (ts, data, confirmed, confirm_token) VALUES (?, ?, ?, ?)',
);
const listStmt = db.prepare('SELECT * FROM signups ORDER BY ts DESC');
const listConfirmedStmt = db.prepare('SELECT * FROM signups WHERE confirmed = 1 ORDER BY ts DESC');
const countStmt = db.prepare('SELECT COUNT(*) AS c FROM signups');
const countConfirmedStmt = db.prepare('SELECT COUNT(*) AS c FROM signups WHERE confirmed = 1');
const deleteStmt = db.prepare('DELETE FROM signups WHERE id = ?');
const findByTokenStmt = db.prepare('SELECT * FROM signups WHERE confirm_token = ?');
const confirmByIdStmt = db.prepare(
  'UPDATE signups SET confirmed = 1, confirm_token = NULL WHERE id = ?',
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rowFromDb(r) {
  let data = {};
  try {
    data = JSON.parse(r.data) || {};
  } catch {
    // corrupt row — surface an empty payload rather than crashing the panel
  }
  return { id: r.id, ts: r.ts, data, confirmed: !!r.confirmed };
}

function cleanValue(field, raw) {
  if (field.kind === 'checkbox') return !!raw;
  if (field.kind === 'radio') {
    const s = String(raw ?? '').slice(0, 200).trim();
    if (field.required && !s) throw new Error(`${field.label || field.id} is required`);
    const allowed = Array.isArray(field.options) ? field.options.map((o) => o.id) : [];
    if (s && allowed.length && !allowed.includes(s)) throw new Error(`invalid ${field.label || field.id}`);
    return s;
  }
  const s = String(raw ?? '').slice(0, 4000).trim();
  if (field.required && !s) throw new Error(`${field.label || field.id} is required`);
  if (field.kind === 'email' && s && !EMAIL_RE.test(s)) throw new Error('invalid email');
  return s;
}

// Returns { signup, token } — token is null when auto-confirmed (no email configured).
export function insertSignup(input, fields, autoConfirm = false) {
  const values = (input && typeof input.data === 'object' && input.data) || {};
  const list = Array.isArray(fields) ? fields : [];
  const clean = {};
  for (const f of list) {
    if (!f || !f.id) continue;
    clean[f.id] = cleanValue(f, values[f.id]);
  }
  const ts = new Date().toISOString();
  const token = autoConfirm ? null : randomUUID();
  const res = insertStmt.run(ts, JSON.stringify(clean), autoConfirm ? 1 : 0, token);
  return { signup: { id: res.lastInsertRowid, ts, data: clean, confirmed: autoConfirm }, token };
}

export function confirmSignupByToken(token) {
  const row = findByTokenStmt.get(token);
  if (!row) return null;
  if (row.confirmed) return rowFromDb(row);
  confirmByIdStmt.run(row.id);
  return rowFromDb({ ...row, confirmed: 1, confirm_token: null });
}

export function confirmSignupById(id) {
  return confirmByIdStmt.run(id).changes > 0;
}

export function listSignups() {
  return listStmt.all().map(rowFromDb);
}

export function listConfirmedSignups() {
  return listConfirmedStmt.all().map(rowFromDb);
}

export function countSignups() {
  return countStmt.get().c;
}

export function countConfirmedSignups() {
  return countConfirmedStmt.get().c;
}

export function deleteSignup(id) {
  return deleteStmt.run(id).changes > 0;
}

function csvEscape(v) {
  let s = typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v ?? '');
  // CSV injection: Excel/Sheets interpret leading =, +, -, @, tab, CR as a formula.
  // Prefix with a single quote so the cell renders as text.
  if (s && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function signupsAsCsv(fields) {
  const list = Array.isArray(fields) ? fields : [];
  const rows = listSignups();
  const header = ['timestamp', 'confirmed', ...list.map((f) => f.id)];
  const lines = [header.map(csvEscape).join(',')];
  for (const r of rows) {
    lines.push(
      [r.ts, r.confirmed ? 'yes' : 'no', ...list.map((f) => r.data?.[f.id])]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}
