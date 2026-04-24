import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'express-openid-connect';
const { auth } = pkg;
import { readContent, writeContent } from './content.js';
import {
  insertSignup,
  listSignups,
  countSignups,
  deleteSignup,
  signupsAsCsv,
} from './signups.js';
import { issueChallenge, verifyChallenge } from './captcha.js';
import { saveUpload, UPLOADS_DIR, UPLOAD_LIMIT } from './uploads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 3010);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

const oidcConfigured =
  !!process.env.OIDC_ISSUER &&
  !!process.env.OIDC_CLIENT_ID &&
  !!process.env.OIDC_CLIENT_SECRET &&
  !!process.env.SESSION_SECRET;

const app = express();
app.use(express.json({ limit: '200kb' }));

if (oidcConfigured) {
  app.use(
    auth({
      authRequired: false,
      auth0Logout: false,
      idpLogout: true,
      baseURL: BASE_URL,
      clientID: process.env.OIDC_CLIENT_ID,
      clientSecret: process.env.OIDC_CLIENT_SECRET,
      issuerBaseURL: process.env.OIDC_ISSUER,
      secret: process.env.SESSION_SECRET,
      authorizationParams: { response_type: 'code', scope: 'openid email profile' },
      routes: { login: '/auth/login', logout: '/auth/logout', callback: '/auth/callback' },
    }),
  );
} else {
  console.warn(
    '[auth] OIDC env vars missing — running without auth. Admin endpoints will be disabled.',
  );
}

function currentUser(req) {
  if (!oidcConfigured) return null;
  if (!req.oidc?.isAuthenticated()) return null;
  const u = req.oidc.user || {};
  const email = (u.email || '').toLowerCase();
  return {
    sub: u.sub,
    email,
    name: u.name || u.nickname || email,
    picture: u.picture || null,
    isAdmin: ADMIN_EMAILS.includes(email),
  };
}

function requireAdmin(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'not authenticated' });
  if (!u.isAdmin) return res.status(403).json({ error: 'not an admin' });
  next();
}

app.get('/me', (req, res) => {
  res.json({ user: currentUser(req), oidcConfigured });
});

app.get('/api/content', async (_req, res) => {
  try {
    res.json(await readContent());
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.put('/api/content', requireAdmin, async (req, res) => {
  try {
    const next = req.body;
    if (!next || typeof next !== 'object') {
      return res.status(400).json({ error: 'body must be an object' });
    }
    await writeContent(next);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '1h', fallthrough: false }));

app.post(
  '/api/uploads',
  requireAdmin,
  express.raw({
    type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    limit: UPLOAD_LIMIT,
  }),
  async (req, res) => {
    try {
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return res.status(400).json({ error: 'empty or non-binary body' });
      }
      const info = await saveUpload(req.body, req.headers['content-type']);
      res.json(info);
    } catch (err) {
      res.status(400).json({ error: String(err.message || err) });
    }
  },
);

app.get('/api/challenge', (_req, res) => {
  res.json(issueChallenge());
});

app.post('/api/signup', async (req, res) => {
  try {
    const body = req.body || {};
    const check = verifyChallenge(body.token, body.hp);
    if (!check.ok) return res.status(400).json({ error: `rejected: ${check.reason}` });
    const content = await readContent();
    const row = insertSignup(body, content.signup?.fields || []);
    res.json({ ok: true, row });
  } catch (err) {
    res.status(400).json({ error: String(err.message || err) });
  }
});

app.get('/api/signups', requireAdmin, async (_req, res) => {
  try {
    const content = await readContent();
    res.json({
      count: countSignups(),
      fields: content.signup?.fields || [],
      rows: listSignups(),
    });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.delete('/api/signups/:id', requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad id' });
    const ok = deleteSignup(id);
    if (!ok) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get('/api/signups.csv', requireAdmin, async (_req, res) => {
  try {
    const content = await readContent();
    const csv = signupsAsCsv(content.signup?.fields || []);
    res.setHeader('content-type', 'text/csv; charset=utf-8');
    res.setHeader('content-disposition', 'attachment; filename="signups.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(ROOT, 'dist');
  app.use(express.static(dist));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/uploads') ||
      req.path === '/me'
    ) {
      return next();
    }
    res.sendFile(path.join(dist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[server] listening on 0.0.0.0:${PORT}`);
  if (oidcConfigured) console.log(`[server] OIDC issuer: ${process.env.OIDC_ISSUER}`);
  if (ADMIN_EMAILS.length) console.log(`[server] admins: ${ADMIN_EMAILS.join(', ')}`);
});
