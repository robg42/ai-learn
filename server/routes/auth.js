const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { db } = require('../db');
const { sendMagicLink } = require('../email');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_in_production';
const BASE_URL = process.env.MAGIC_LINK_BASE_URL || 'http://localhost:3000';
const TOKEN_TTL_MINUTES = 15;

// POST /api/auth/magic-request
router.post('/magic-request', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalEmail = email.toLowerCase().trim();
    const userResult = await db.execute({
      sql: 'SELECT id, email, name, role FROM users WHERE email = ?',
      args: [normalEmail]
    });
    const user = userResult.rows[0] ? { ...userResult.rows[0] } : null;

    // Unknown email — silently return success to avoid leaking whether an account exists
    if (!user) {
      console.log(`[MAGIC LINK] Unknown email attempted: ${normalEmail}`);
      return res.json({ message: 'Magic link sent' });
    }

    await db.execute({
      sql: 'UPDATE magic_link_tokens SET used = 1 WHERE user_id = ? AND used = 0',
      args: [user.id]
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000).toISOString();

    await db.execute({
      sql: 'INSERT INTO magic_link_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      args: [user.id, token, expiresAt]
    });

    const magicLink = `${BASE_URL}?token=${token}`;
    await sendMagicLink({ to: user.email, name: user.name, magicLink, token, ttlMinutes: TOKEN_TTL_MINUTES });

    res.json({ message: 'Magic link sent' });
  } catch (err) {
    console.error('Magic request error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/magic-verify
router.post('/magic-verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });

    const recordResult = await db.execute({
      sql: 'SELECT * FROM magic_link_tokens WHERE token = ?',
      args: [token]
    });
    const record = recordResult.rows[0] ? { ...recordResult.rows[0] } : null;

    if (!record) return res.status(400).json({ error: 'Invalid or expired magic link' });
    if (record.used) return res.status(400).json({ error: 'This magic link has already been used' });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'This magic link has expired. Please request a new one.' });
    }

    await db.execute({
      sql: 'UPDATE magic_link_tokens SET used = 1 WHERE id = ?',
      args: [record.id]
    });

    const userResult = await db.execute({
      sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      args: [record.user_id]
    });
    const user = userResult.rows[0] ? { ...userResult.rows[0] } : null;
    if (!user) return res.status(400).json({ error: 'User not found' });

    const sessionToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token: sessionToken, user });
  } catch (err) {
    console.error('Magic verify error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
