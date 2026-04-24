import { Router } from 'express';
import {
  listUsers,
  createUser,
  deleteUserById,
  findUserById,
  countAdmins,
} from '../users.js';

export function buildUserRoutes(requireAdmin) {
  const router = Router();

  router.get('/', requireAdmin, (_req, res) => {
    res.json({ users: listUsers() });
  });

  router.post('/', requireAdmin, async (req, res) => {
    try {
      const { email, password, isAdmin = true } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'email and password required' });
      }
      const existing = listUsers().find((u) => u.email === String(email).toLowerCase());
      if (existing) return res.status(409).json({ error: 'email already exists' });
      const u = await createUser({ email, password, isAdmin: !!isAdmin });
      res.json({ user: { id: u.id, email: u.email, is_admin: u.is_admin, created_at: u.created_at } });
    } catch (err) {
      res.status(400).json({ error: String(err.message || err) });
    }
  });

  router.delete('/:id', requireAdmin, (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) return res.status(400).json({ error: 'bad id' });
      const target = findUserById(id);
      if (!target) return res.status(404).json({ error: 'not found' });

      const currentUserId = req.session?.userId;
      if (currentUserId && currentUserId === id) {
        return res.status(400).json({ error: 'cannot delete yourself' });
      }
      if (target.is_admin && countAdmins() <= 1) {
        return res.status(400).json({ error: 'cannot delete the last admin' });
      }
      deleteUserById(id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err.message || err) });
    }
  });

  return router;
}
