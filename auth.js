const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Admin login route (simple)
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin', username }, JWT_SECRET, { expiresIn: '12h' });
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ ok: false, message: 'Invalid admin credentials' });
});

// User login (create or get)
router.post('/user/login', async (req, res) => {
  let { username } = req.body;
  if (!username) return res.status(400).json({ ok: false, message: 'username required' });
  username = username.trim();
  let user = await User.findOne({ username });
  if (!user) user = await User.create({ username });
  res.json({ ok: true, user });
});

module.exports = router;
