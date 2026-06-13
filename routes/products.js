const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../database/db');

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// List / search / filter
router.get('/', (req, res) => {
  const { q, category } = req.query;
  let sql = 'SELECT p.*, u.name as farmer_name, c.name as category_name FROM products p LEFT JOIN users u ON p.farmer_id = u.id LEFT JOIN categories c ON p.category_id = c.id';
  const clauses = [];
  const params = [];
  if (q) { clauses.push('(p.name_en LIKE ? OR p.name_np LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category) { clauses.push('c.name = ?'); params.push(category); }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  sql += ' ORDER BY p.created_at DESC';
  const products = db.prepare(sql).all(...params);
  res.json({ products });
});

// Create product (farmer) - supports multipart/form-data (file) and JSON
router.post('/', (req, res, next) => {
  // if multipart, let multer handle file
  const contentType = req.headers['content-type'] || '';
  if (contentType.indexOf('multipart/form-data') === 0) return upload.single('image')(req, res, err => {
    if (err) return res.status(400).json({ error: 'Upload error' });
    handleCreate(req, res);
  });
  // otherwise parse JSON body
  handleCreate(req, res);
});

function handleCreate(req, res) {
  if (!req.session.user || req.session.user.role !== 'farmer') return res.status(403).json({ error: 'Forbidden' });
  const { name_en, name_np, description, price, category_id } = req.body;
  const image = req.file ? path.relative(path.join(__dirname, '..', 'public'), req.file.path) : null;
  const stmt = db.prepare('INSERT INTO products (farmer_id,name_en,name_np,description,price,category_id,image) VALUES (?,?,?,?,?,?,?)');
  const info = stmt.run(req.session.user.id, name_en, name_np, description, parseInt(price || 0), category_id || null, req.file ? `/uploads/${path.basename(req.file.path)}` : null);
  // fetch by farmer_id and name_en (unique identifier for this insertion)
  const product = db.prepare('SELECT * FROM products WHERE farmer_id = ? AND name_en = ? ORDER BY created_at DESC LIMIT 1').get(req.session.user.id, name_en);
  res.json({ product });
}

// Edit product
router.put('/:id', upload.single('image'), (req, res) => {
  const id = req.params.id;
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (!req.session.user || (req.session.user.role !== 'farmer' && req.session.user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
  if (req.session.user.role === 'farmer' && p.farmer_id !== req.session.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { name_en, name_np, description, price, category_id } = req.body;
  let imagePath = p.image;
  if (req.file) imagePath = `/uploads/${path.basename(req.file.path)}`;
  db.prepare('UPDATE products SET name_en=?, name_np=?, description=?, price=?, category_id=?, image=? WHERE id = ?').run(name_en||p.name_en, name_np||p.name_np, description||p.description, price?parseInt(price):p.price, category_id||p.category_id, imagePath, id);
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.json({ product });
});

// Delete product
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (!req.session.user) return res.status(403).json({ error: 'Forbidden' });
  if (req.session.user.role === 'farmer' && p.farmer_id !== req.session.user.id) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ ok: true });
});

// Farmer's products
router.get('/mine/list', (req, res) => {
  if (!req.session.user || req.session.user.role !== 'farmer') return res.status(403).json({ error: 'Forbidden' });
  const products = db.prepare('SELECT * FROM products WHERE farmer_id = ?').all(req.session.user.id);
  res.json({ products });
});

module.exports = router;
