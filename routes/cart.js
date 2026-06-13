const express = require('express');
const router = express.Router();
const db = require('../database/db');

function getCart(req) {
  return req.session.cart || [];
}

function saveCart(req, cart) {
  req.session.cart = cart;
  return cart;
}

function buildCartResponse(req) {
  const cart = getCart(req);
  const items = cart.map(item => {
    const product = db.prepare('SELECT id, name_en, price, image FROM products WHERE id = ?').get(item.product_id);
    return product ? {
      product_id: product.id,
      name: product.name_en,
      price: product.price,
      image: product.image,
      quantity: item.quantity,
      total: product.price * item.quantity
    } : null;
  }).filter(Boolean);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.total, 0);
  return { items, totalItems, totalPrice };
}

router.use((req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'buyer') return res.status(403).json({ error: 'Buyer login required' });
  next();
});

router.get('/', (req, res) => {
  res.json(buildCartResponse(req));
});

router.post('/', (req, res) => {
  const productId = Number(req.body.product_id || req.body.productId || req.body.id);
  const quantity = Number(req.body.quantity || 1);
  if (!productId || quantity <= 0) return res.status(400).json({ error: 'Invalid product or quantity' });

  const product = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const cart = getCart(req);
  const existing = cart.find(item => item.product_id === productId);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({ product_id: productId, quantity });
  }
  saveCart(req, cart);
  res.json(buildCartResponse(req));
});

router.put('/:id', (req, res) => {
  const productId = Number(req.params.id);
  const quantity = Number(req.body.quantity);
  if (!productId || quantity < 0) return res.status(400).json({ error: 'Invalid product or quantity' });

  const cart = getCart(req);
  const existing = cart.find(item => item.product_id === productId);
  if (!existing) return res.status(404).json({ error: 'Product not found in cart' });

  if (quantity === 0) {
    req.session.cart = cart.filter(item => item.product_id !== productId);
  } else {
    existing.quantity = quantity;
    saveCart(req, cart);
  }
  res.json(buildCartResponse(req));
});

router.delete('/:id', (req, res) => {
  const productId = Number(req.params.id);
  if (!productId) return res.status(400).json({ error: 'Invalid product' });
  const cart = getCart(req);
  req.session.cart = cart.filter(item => item.product_id !== productId);
  res.json(buildCartResponse(req));
});

router.delete('/', (req, res) => {
  req.session.cart = [];
  res.json({ items: [], totalItems: 0, totalPrice: 0 });
});

module.exports = router;
