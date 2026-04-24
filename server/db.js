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
    data TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_signups_ts ON signups(ts);

  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// one-time destructive migration from the fixed-column schema to JSON-blob rows.
// Backwards compatibility is explicitly out of scope; any old rows are discarded.
const signupCols = new Set(db.prepare('PRAGMA table_info(signups)').all().map((c) => c.name));
if (!signupCols.has('data')) {
  db.exec('DROP TABLE IF EXISTS signups');
  db.exec(`
    CREATE TABLE signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      data TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_signups_ts ON signups(ts);
  `);
  console.log('[db] migrated signups table to dynamic-fields schema (old rows dropped)');
}
