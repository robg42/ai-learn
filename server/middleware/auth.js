const jwt = require('jsonwebtoken');
const { db } = require('../db');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch current role from DB so role changes take effect without re-login
    const result = await db.execute({
      sql: 'SELECT id, email, name, role, last_seen_date FROM users WHERE id = ?',
      args: [payload.id]
    });
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = { ...payload, role: user.role };

    // Track daily active sessions — increment login_count once per calendar day
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    if (user.last_seen_date !== today) {
      db.execute({
        sql: `UPDATE users
              SET last_seen_date = ?, last_login_at = CURRENT_TIMESTAMP,
                  login_count = COALESCE(login_count, 0) + 1
              WHERE id = ? AND (last_seen_date IS NULL OR last_seen_date != ?)`,
        args: [today, payload.id, today]
      }).catch(() => {}); // fire-and-forget, never block the request
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
