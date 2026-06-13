const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Create order
router.post('/', (req, res) => {
  if (!req.session.user) return res.status(403).json({ error: 'Login required' });
  const { items, contact, district } = req.body; // items: [{product_id, quantity}]
  if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items' });
  let total = 0;
  // calculate total price by fetching products one at a time
  items.forEach(it => { 
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(it.product_id);
    if (p) total += p.price * (it.quantity || 1);
  });
  const insert = db.prepare('INSERT INTO orders (buyer_id,total_price,contact,district) VALUES (?,?,?,?)');
  const info = insert.run(req.session.user.id, total, contact || req.session.user.contact || null, district || null);
  // fetch order by buyer_id, total_price, and created_at to get the newly created one
  const order = db.prepare('SELECT * FROM orders WHERE buyer_id = ? AND total_price = ? ORDER BY created_at DESC LIMIT 1').get(req.session.user.id, total);
  
  // insert order items
  items.forEach(it => {
    const p = db.prepare('SELECT * FROM products WHERE id = ?').get(it.product_id);
    if (p && order) {
      db.prepare('INSERT INTO order_items (order_id,product_id,quantity,price) VALUES (?,?,?,?)').run(order.id, p.id, it.quantity || 1, p.price);
    }
  });
  
  if (req.session.user && req.session.user.role === 'buyer') {
    req.session.cart = [];
  }

  res.json({ order });
});

// Get orders for user
router.get('/', (req, res) => {
  if (!req.session.user) return res.status(403).json({ error: 'Login required' });
  if (req.session.user.role === 'admin') {
    const orders = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
    return res.json({ orders });
  }
  if (req.session.user.role === 'buyer') {
    const orders = db.prepare('SELECT * FROM orders WHERE buyer_id = ? ORDER BY created_at DESC').all(req.session.user.id);
    return res.json({ orders });
  }
  // farmer: orders for their products
  if (req.session.user.role === 'farmer') {
    const orders = db.prepare(`SELECT o.* FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id WHERE p.farmer_id = ? GROUP BY o.id ORDER BY o.created_at DESC`).all(req.session.user.id);
    return res.json({ orders });
  }
  res.json({ orders: [] });
});

module.exports = router;
