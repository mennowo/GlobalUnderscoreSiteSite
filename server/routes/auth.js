import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { findUserByEmail, findUserById, updateUserPassword } from '../users.js';
import { verifyPassword, rotateSession } from '../auth.js';

export function buildAuthRoutes() {
  const router = Router();

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'too many login attempts, try again later' },
  });

  router.post('/login', loginLimiter, async (req, res) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password required' });
      }
      const user = findUserByEmail(email);
      const ok = user ? await verifyPassword(password, user.password_hash) : false;
      if (!ok) {
        return res.status(401).json({ error: 'invalid credentials' });
      }
      req.session.userId = user.id;
      await rotateSession(req);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err.message || err) });
    }
  });

  router.post('/logout', (req, res) => {
    if (!req.session) return res.json({ ok: true });
    req.session.destroy(() => {
      res.clearCookie('gu.sid');
      res.json({ ok: true });
    });
  });

  router.post('/password', async (req, res) => {
    try {
      const userId = req.session?.userId;
      if (!userId) return res.status(401).json({ error: 'not authenticated' });
      const { currentPassword, newPassword } = req.body || {};
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'currentPassword and newPassword required' });
      }
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return res.status(400).json({ error: 'new password must be at least 8 characters' });
      }
      const user = findUserById(userId);
      if (!user) return res.status(401).json({ error: 'not authenticated' });
      const ok = await verifyPassword(currentPassword, user.password_hash);
      if (!ok) return res.status(401).json({ error: 'current password is wrong' });
      await updateUserPassword(user.id, newPassword);
      req.session.userId = user.id;
      await rotateSession(req);
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: String(err.message || err) });
    }
  });

  return router;
}
