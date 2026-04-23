import path from 'node:path';
import { promises as fs, existsSync, mkdirSync } from 'node:fs';
import crypto from 'node:crypto';
import { DATA_DIR } from './db.js';

export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

export const UPLOAD_LIMIT = 12 * 1024 * 1024;

function sanitizeSvg(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\s(href|xlink:href)\s*=\s*"\s*javascript:[^"]*"/gi, '')
    .replace(/\s(href|xlink:href)\s*=\s*'\s*javascript:[^']*'/gi, '');
}

export async function saveUpload(buffer, contentType) {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase();
  const ext = ALLOWED[ct];
  if (!ext) throw new Error(`unsupported content-type: ${ct}`);
  let data = buffer;
  if (ct === 'image/svg+xml') {
    data = Buffer.from(sanitizeSvg(buffer.toString('utf8')), 'utf8');
  }
  const id = crypto.randomBytes(12).toString('hex');
  const filename = `${id}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), data);
  return { url: `/uploads/${filename}`, filename, contentType: ct, bytes: data.length };
}
