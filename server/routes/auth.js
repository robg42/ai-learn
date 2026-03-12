const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_in_production';
const BASE_URL = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';
const TOKEN_TTL_MINUTES = 15;

// POST /api/auth/magic-request
// Body: { email, name? }
// Creates account if new (name required), generates single-use token, logs link to console.
router.post('/magic-request', (req, res) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalEmail = email.toLowerCase().trim();
  let user = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(normalEmail);

  if (!user) {
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required for new accounts' });
    }
    const result = db.prepare(
      'INSERT INTO users (email, name, role) VALUES (?, ?, ?)'
    ).run(normalEmail, name.trim(), 'user');
    user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(result.lastInsertRowid);
  }

  // Invalidate any existing unused tokens for this user
  db.prepare('UPDATE magic_link_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(user.id);

  // Generate a secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

  db.prepare(
    'INSERT INTO magic_link_tokens (user_id, token, expires_at) VALUES (?, ?, ?)'
  ).run(user.id, token, expiresAt);

  const magicLink = `${BASE_URL}/auth/verify?token=${token}`;
  console.log(`\n[MAGIC LINK] User: ${user.email} (${user.name})`);
  console.log(`[MAGIC LINK] Link (expires in ${TOKEN_TTL_MINUTES} min): ${magicLink}`);
  console.log(`[MAGIC LINK] Token only: ${token}\n`);

  res.json({ message: 'Magic link sent' });
});

// POST /api/auth/magic-verify
// Body: { token }
// Verifies token, marks used, returns session JWT.
router.post('/magic-verify', (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  const record = db.prepare(
    'SELECT * FROM magic_link_tokens WHERE token = ?'
  ).get(token);

  if (!record) {
    return res.status(400).json({ error: 'Invalid or expired magic link' });
  }
  if (record.used) {
    return res.status(400).json({ error: 'This magic link has already been used' });
  }
  if (new Date(record.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This magic link has expired. Please request a new one.' });
  }

  // Mark token as used
  db.prepare('UPDATE magic_link_tokens SET used = 1 WHERE id = ?').run(record.id);

  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(record.user_id);
  if (!user) {
    return res.status(400).json({ error: 'User not found' });
  }

  const sessionToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token: sessionToken, user });
});

module.exports = router;
