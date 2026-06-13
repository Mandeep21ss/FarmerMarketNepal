const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
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

// Update user profile (self or admin)
router.put('/:id', async (req, res) => {
  const id = req.params.id;
  if (!req.session.user) return res.status(403).json({ error: 'Login required' });
  if (req.session.user.role !== 'admin' && Number(req.session.user.id) !== Number(id)) return res.status(403).json({ error: 'Forbidden' });

  const { name, email, district, contact, password } = req.body;
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  if (email && email !== existing.email) {
    const emailTaken = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (emailTaken) return res.status(400).json({ error: 'Email already in use' });
  }

  let hashedPassword = existing.password;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  db.prepare('UPDATE users SET name=?, email=?, district=?, contact=?, password=? WHERE id=?')
    .run(name || existing.name, email || existing.email, district || existing.district, contact || existing.contact, hashedPassword, id);

  const updated = db.prepare('SELECT id, name, email, role, district, contact FROM users WHERE id = ?').get(id);
  if (Number(req.session.user.id) === Number(id)) {
    req.session.user = updated;
  }
  res.json({ user: updated });
});

module.exports = router;
