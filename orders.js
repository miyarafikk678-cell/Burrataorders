const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ ok: false });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role === 'admin') { req.admin = payload; return next(); }
    return res.status(403).json({ ok: false });
  } catch (e) {
    return res.status(401).json({ ok: false });
  }
}

// GET orders (optional ?userId=)
router.get('/', async (req, res) => {
  const { userId } = req.query;
  const q = userId ? { userId } : {};
  const orders = await Order.find(q).sort({ createdAt: -1 }).populate('userId', 'username');
  res.json({ ok: true, orders });
});

// Create order (user or admin)
router.post('/', async (req, res) => {
  const { userId, items } = req.body;
  if (!userId || !items || !items.length) return res.status(400).json({ ok: false, message: 'userId and items required' });
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ ok: false, message: 'user not found' });
  const order = await Order.create({ userId, items });
  // emit via socket if available
  if (req.app.get('io')) req.app.get('io').to(String(userId)).emit('orderUpdated', { order, action: 'created' });
  res.json({ ok: true, order });
});

// Resend (admin only) -> set status to 'sent'
router.put('/:id/resend', adminAuth, async (req, res) => {
  const id = req.params.id;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ ok: false });
  order.status = 'sent';
  await order.save();
  // notify user
  if (req.app.get('io')) req.app.get('io').to(String(order.userId)).emit('orderUpdated', { order, action: 'resend' });
  res.json({ ok: true, order });
});

// Mark received (user)
router.put('/:id/received', async (req, res) => {
  const id = req.params.id;
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ ok: false });
  order.status = 'received';
  await order.save();
  // notify admin
  if (req.app.get('io')) req.app.get('io').emit('orderUpdated', { order, action: 'received' });
  res.json({ ok: true, order });
});

module.exports = router;
