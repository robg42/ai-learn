const express = require('express');
const cors = require('cors');
const { db, initDb } = require('../server/db');
const authRoutes = require('../server/routes/auth');
const progressRoutes = require('../server/routes/progress');
const badgeRoutes = require('../server/routes/badges');
const adminRoutes = require('../server/routes/admin');
const leaderboardRoutes = require('../server/routes/leaderboard');
const notesRoutes = require('../server/routes/notes');
const authMiddleware = require('../server/middleware/auth');

const app = express();

const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [/\.vercel\.app$/, 'https://learn.robgregg.com']
  : ['http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Initialize DB once per process (idempotent due to IF NOT EXISTS)
const dbReady = initDb();

app.use(async (req, res, next) => {
  try {
    await dbReady;
    next();
  } catch (err) {
    console.error('DB init failed:', err);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notes', notesRoutes);

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await db.execute({
      sql: 'SELECT id, email, name, role, created_at, can_view_leaderboard, show_on_leaderboard FROM users WHERE id = ?',
      args: [req.user.id]
    });
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const progressResult = await db.execute({
      sql: 'SELECT * FROM progress WHERE user_id = ?',
      args: [req.user.id]
    });
    const badgesResult = await db.execute({
      sql: `SELECT ba.awarded_at, ba.awarded_by, bd.*
            FROM badge_awards ba
            JOIN badge_definitions bd ON bd.id = ba.badge_id
            WHERE ba.user_id = ?
            ORDER BY ba.awarded_at DESC`,
      args: [req.user.id]
    });

    res.json({
      user: { ...user },
      progress: progressResult.rows.map(r => ({ ...r })),
      badges: badgesResult.rows.map(r => ({ ...r }))
    });
  } catch (err) {
    console.error('/api/me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = app;
