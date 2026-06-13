const express = require('express');
const router = express.Router();
const db = require('../database/db');

router.get('/', (req, res) => {
  // show home page with products
  const products = db.prepare('SELECT p.*, u.name as farmer_name, c.name as category_name FROM products p LEFT JOIN users u ON p.farmer_id = u.id LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC LIMIT 12').all();
  res.render('index', { user: req.session.user || null, products });
});

// Simple dashboards
router.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const role = req.session.user.role;
  if (role === 'farmer') return res.redirect('/dashboard/farmer');
  if (role === 'admin') return res.redirect('/dashboard/admin');
  return res.redirect('/dashboard/buyer');
});

router.get('/dashboard/farmer', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'farmer') return res.redirect('/login');
  const products = db.prepare('SELECT * FROM products WHERE farmer_id = ?').all(req.session.user.id);
  res.render('dashboard_farmer', { user: req.session.user, products });
});

router.get('/dashboard/buyer', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const products = db.prepare('SELECT p.*, u.name as farmer_name FROM products p LEFT JOIN users u ON p.farmer_id = u.id').all();
  res.render('dashboard_buyer', { user: req.session.user, products });
});

router.get('/dashboard/admin', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
  const users = db.prepare('SELECT * FROM users').all();
  const products = db.prepare('SELECT * FROM products').all();
  res.render('dashboard_admin', { user: req.session.user, users, products });
});

// Auth pages
router.get('/login', (req, res) => res.render('login', { error: null }));
router.get('/register', (req, res) => res.render('register', { error: null }));

module.exports = router;
