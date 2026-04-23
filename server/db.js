import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = path.resolve(__dirname, '..', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DB_FILE = path.join(DATA_DIR, 'gu.sqlite');
export const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    did_underscore_before INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_signups_ts ON signups(ts);

  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// idempotent column additions — runs on every boot, no-ops if already present
const signupCols = new Set(db.prepare('PRAGMA table_info(signups)').all().map((c) => c.name));
const addCol = (name, sql) => {
  if (!signupCols.has(name)) db.exec(`ALTER TABLE signups ADD COLUMN ${sql}`);
};
addCol('phone', "phone TEXT NOT NULL DEFAULT ''");
addCol('has_ci_experience', 'has_ci_experience INTEGER NOT NULL DEFAULT 0');
addCol('cannot_attend_talk', 'cannot_attend_talk INTEGER NOT NULL DEFAULT 0');
