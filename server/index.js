import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
import { buildSessionMiddleware } from './auth.js';
import { bootstrapAdmin, findUserById } from './users.js';
import { buildAuthRoutes } from './routes/auth.js';
import { buildUserRoutes } from './routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const PORT = Number(process.env.PORT || 3010);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Fail-closed: SESSION_SECRET is required for cookie signing AND captcha HMAC.
// Without it we'd silently downgrade to an insecure dev fallback or no auth at all.
if (!process.env.SESSION_SECRET) {
  console.error(
    '[fatal] SESSION_SECRET is required. Generate one with `openssl rand -hex 32` and set it in .env.',
  );
  process.exit(1);
}

const oidcConfigured =
  !!process.env.OIDC_ISSUER &&
  !!process.env.OIDC_CLIENT_ID &&
  !!process.env.OIDC_CLIENT_SECRET;

const localAuthEnabled = process.env.LOCAL_AUTH_DISABLED !== '1';

const app = express();
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        // admins can paste external image URLs into gallery content, so keep img permissive
        'img-src': ["'self'", 'data:', 'blob:', 'https:'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'font-src': ["'self'", 'data:'],
        'script-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
        'upgrade-insecure-requests': [],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);

app.use(express.json({ limit: '200kb' }));

// Signup rate limit: tolerant for a group signing up friends, strict for bots.
// 10 submissions / 15 min / IP lets a couple sign up a whole group in one session
// while capping storage-DoS via one captcha token (valid for 2h).
const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'too many signups from this address, try again later' },
});

if (localAuthEnabled) {
  app.use(buildSessionMiddleware(process.env.SESSION_SECRET));
}

if (oidcConfigured) {
  app.use(
    auth({
      authRequired: false,
      auth0Logout: true,
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
}

if (!oidcConfigured && !localAuthEnabled) {
  console.warn('[auth] both local auth and OIDC are disabled — admin endpoints will be unreachable.');
}

function currentUser(req) {
  if (localAuthEnabled && req.session?.userId) {
    const row = findUserById(req.session.userId);
    if (row) {
      return {
        sub: `local:${row.id}`,
        email: row.email,
        name: row.email,
        picture: null,
        isAdmin: !!row.is_admin,
        authSource: 'local',
      };
    }
  }
  if (oidcConfigured && req.oidc?.isAuthenticated()) {
    const u = req.oidc.user || {};
    const email = (u.email || '').toLowerCase();
    return {
      sub: u.sub,
      email,
      name: u.name || u.nickname || email,
      picture: u.picture || null,
      isAdmin: ADMIN_EMAILS.includes(email),
      authSource: 'oidc',
    };
  }
  return null;
}

function requireAdmin(req, res, next) {
  const u = currentUser(req);
  if (!u) return res.status(401).json({ error: 'not authenticated' });
  if (!u.isAdmin) return res.status(403).json({ error: 'not an admin' });
  req.currentUser = u;
  next();
}

// CSRF guard for cookie-authenticated mutations.
// We accept either a custom fetch header (SPA calls) or the OIDC callback path (handled by express-openid-connect itself).
function csrfGuard(req, res, next) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  if (req.get('x-requested-with') === 'fetch') return next();
  return res.status(403).json({ error: 'missing X-Requested-With header' });
}

if (localAuthEnabled) {
  app.use('/auth/local', csrfGuard, buildAuthRoutes());
}

app.get('/me', (req, res) => {
  res.json({ user: currentUser(req), oidcConfigured, localAuthEnabled });
});

app.get('/api/content', async (_req, res) => {
  try {
    res.json(await readContent());
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.put('/api/content', csrfGuard, requireAdmin, async (req, res) => {
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

// Static uploads get a locked-down CSP + nosniff so a malicious SVG cannot
// run script, fetch network resources, or be embedded cross-origin.
app.use(
  '/uploads',
  (_req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    next();
  },
  express.static(UPLOADS_DIR, { maxAge: '1h', fallthrough: false }),
);

app.post(
  '/api/uploads',
  csrfGuard,
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

app.post('/api/signup', signupLimiter, csrfGuard, async (req, res) => {
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

app.delete('/api/signups/:id', csrfGuard, requireAdmin, (req, res) => {
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

if (localAuthEnabled) {
  app.use('/api/users', csrfGuard, buildUserRoutes(requireAdmin));
}

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

async function start() {
  if (localAuthEnabled) {
    try {
      const result = await bootstrapAdmin({
        email: process.env.BOOTSTRAP_ADMIN_EMAIL,
        password: process.env.BOOTSTRAP_ADMIN_PASSWORD,
      });
      if (result.action && result.action !== 'skipped' && result.action !== 'noop') {
        console.log(`[auth] bootstrap admin ${result.action}: ${result.email}`);
      }
    } catch (err) {
      console.error('[auth] bootstrap failed:', err.message || err);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] listening on 0.0.0.0:${PORT}`);
    if (oidcConfigured) console.log(`[server] OIDC issuer: ${process.env.OIDC_ISSUER}`);
    if (localAuthEnabled) console.log('[server] local auth enabled');
    if (ADMIN_EMAILS.length) console.log(`[server] OIDC admins: ${ADMIN_EMAILS.join(', ')}`);
  });
}

start();
