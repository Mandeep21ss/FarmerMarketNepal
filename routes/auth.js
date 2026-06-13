const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../database/db');

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Register route, content-type:', req.headers['content-type']);
    console.log('Register body:', req.body);
    const { name, email, password, role, district, contact } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const hash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name,email,password,role,district,contact) VALUES (?,?,?,?,?,?)');
    const info = stmt.run(name, email, hash, role || 'buyer', district || null, contact || null);
    console.log('Insert info:', info);
    // fetch by email to avoid relying on lastInsertRowid
    const user = db.prepare('SELECT id, name, email, role, district, contact FROM users WHERE email = ?').get(email);
    console.log('Fetched user:', user);
    req.session.user = user;
    res.json({ user });
  } catch (err) {
    if (err && (err.code === 'SQLITE_CONSTRAINT_UNIQUE' || (err.message && err.message.includes('UNIQUE')))) return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
    const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role, district: user.district, contact: user.contact };
    req.session.user = sessionUser;
    res.json({ user: sessionUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

module.exports = router;
