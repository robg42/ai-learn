const jwt = require('jsonwebtoken');
const { db } = require('../db');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme_in_production');
    // Fetch current role from DB so role changes take effect without re-login
    const result = await db.execute({
      sql: 'SELECT id, email, name, role FROM users WHERE id = ?',
      args: [payload.id]
    });
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = { ...payload, role: user.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
