import path from 'node:path';
import { promises as fs, existsSync } from 'node:fs';
import { db, DATA_DIR } from './db.js';

const LEGACY_JSONL = path.join(DATA_DIR, 'signups.jsonl');

const insertStmt = db.prepare(`
  INSERT INTO signups
    (ts, name, email, phone, did_underscore_before, has_ci_experience, cannot_attend_talk)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
const listStmt = db.prepare('SELECT * FROM signups ORDER BY ts DESC');
const countStmt = db.prepare('SELECT COUNT(*) AS c FROM signups');
const deleteStmt = db.prepare('DELETE FROM signups WHERE id = ?');

// one-time migration from the old JSONL, if present
try {
  if (existsSync(LEGACY_JSONL)) {
    const existing = countStmt.get().c;
    if (existing === 0) {
      const raw = await fs.readFile(LEGACY_JSONL, 'utf8');
      const lines = raw.split('\n').filter(Boolean);
      const tx = db.transaction((rows) => {
        for (const r of rows)
          insertStmt.run(
            r.ts,
            r.name,
            r.email,
            r.phone || '',
            r.didUnderscoreBefore ? 1 : 0,
            r.hasCiExperience ? 1 : 0,
            r.cannotAttendTalk ? 1 : 0,
          );
      });
      tx(lines.map((l) => JSON.parse(l)));
      await fs.rename(LEGACY_JSONL, LEGACY_JSONL + '.migrated');
      console.log(`[db] migrated ${lines.length} rows from signups.jsonl`);
    }
  }
} catch (err) {
  console.warn('[db] JSONL migration skipped:', err.message);
}

function rowFromDb(r) {
  return {
    id: r.id,
    ts: r.ts,
    name: r.name,
    email: r.email,
    phone: r.phone || '',
    didUnderscoreBefore: !!r.did_underscore_before,
    hasCiExperience: !!r.has_ci_experience,
    cannotAttendTalk: !!r.cannot_attend_talk,
  };
}

export function insertSignup(input) {
  const row = {
    ts: new Date().toISOString(),
    name: String(input.name ?? '').slice(0, 200).trim(),
    email: String(input.email ?? '').slice(0, 200).trim(),
    phone: String(input.phone ?? '').slice(0, 80).trim(),
    did: input.didUnderscoreBefore ? 1 : 0,
    ciExp: input.hasCiExperience ? 1 : 0,
    noTalk: input.cannotAttendTalk ? 1 : 0,
  };
  if (!row.name || !row.email) throw new Error('name and email are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw new Error('invalid email');
  const res = insertStmt.run(
    row.ts,
    row.name,
    row.email,
    row.phone,
    row.did,
    row.ciExp,
    row.noTalk,
  );
  return rowFromDb({
    id: res.lastInsertRowid,
    ts: row.ts,
    name: row.name,
    email: row.email,
    phone: row.phone,
    did_underscore_before: row.did,
    has_ci_experience: row.ciExp,
    cannot_attend_talk: row.noTalk,
  });
}

export function listSignups() {
  return listStmt.all().map(rowFromDb);
}

export function countSignups() {
  return countStmt.get().c;
}

export function deleteSignup(id) {
  const res = deleteStmt.run(id);
  return res.changes > 0;
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const yn = (b) => (b ? 'yes' : 'no');

export function signupsAsCsv() {
  const rows = listSignups();
  const lines = [
    'timestamp,name,email,phone,did_underscore_before,has_ci_experience,cannot_attend_talk',
  ];
  for (const r of rows) {
    lines.push(
      [
        r.ts,
        r.name,
        r.email,
        r.phone,
        yn(r.didUnderscoreBefore),
        yn(r.hasCiExperience),
        yn(r.cannotAttendTalk),
      ]
        .map(csvEscape)
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}
