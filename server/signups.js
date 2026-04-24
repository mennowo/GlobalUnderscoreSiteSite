import { db } from './db.js';

const insertStmt = db.prepare('INSERT INTO signups (ts, data) VALUES (?, ?)');
const listStmt = db.prepare('SELECT * FROM signups ORDER BY ts DESC');
const countStmt = db.prepare('SELECT COUNT(*) AS c FROM signups');
const deleteStmt = db.prepare('DELETE FROM signups WHERE id = ?');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rowFromDb(r) {
  let data = {};
  try {
    data = JSON.parse(r.data) || {};
  } catch {
    // corrupt row — surface an empty payload rather than crashing the panel
  }
  return { id: r.id, ts: r.ts, data };
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

export function insertSignup(input, fields) {
  const values = (input && typeof input.data === 'object' && input.data) || {};
  const list = Array.isArray(fields) ? fields : [];
  const clean = {};
  for (const f of list) {
    if (!f || !f.id) continue;
    clean[f.id] = cleanValue(f, values[f.id]);
  }
  const ts = new Date().toISOString();
  const res = insertStmt.run(ts, JSON.stringify(clean));
  return { id: res.lastInsertRowid, ts, data: clean };
}

export function listSignups() {
  return listStmt.all().map(rowFromDb);
}

export function countSignups() {
  return countStmt.get().c;
}

export function deleteSignup(id) {
  return deleteStmt.run(id).changes > 0;
}

function csvEscape(v) {
  const s = typeof v === 'boolean' ? (v ? 'yes' : 'no') : String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function signupsAsCsv(fields) {
  const list = Array.isArray(fields) ? fields : [];
  const rows = listSignups();
  const header = ['timestamp', ...list.map((f) => f.id)];
  const lines = [header.map(csvEscape).join(',')];
  for (const r of rows) {
    lines.push([r.ts, ...list.map((f) => r.data?.[f.id])].map(csvEscape).join(','));
  }
  return lines.join('\n') + '\n';
}
