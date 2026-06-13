const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Get user details (admin or self)
router.get('/:id', (req, res) => {
  const id = req.params.id;
  if (!req.session.user) return res.status(403).json({ error: 'Login required' });
  if (req.session.user.role !== 'admin' && Number(req.session.user.id) !== Number(id)) return res.status(403).json({ error: 'Forbidden' });
  const user = db.prepare('SELECT id, name, email, role, district, contact, created_at FROM users WHERE id = ?').get(id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json({ user });
});

// Admin: list users
router.get('/', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  const users = db.prepare('SELECT id, name, email, role, district, contact, created_at FROM users ORDER BY created_at DESC').all();
  res.json({ users });
});

// Admin: delete user
router.delete('/:id', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.status(403).json({ error: 'Admin required' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
