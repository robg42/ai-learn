require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB (runs schema + seed)
require('./db');

const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const badgeRoutes = require('./routes/badges');
const adminRoutes = require('./routes/admin');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/admin', adminRoutes);

// /api/me shortcut (delegates to progress router's /me handler)
app.get('/api/me', authMiddleware, (req, res) => {
  const db = require('./db');
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').all(req.user.id);
  const badges = db.prepare(`
    SELECT ba.awarded_at, ba.awarded_by, bd.*
    FROM badge_awards ba
    JOIN badge_definitions bd ON bd.id = ba.badge_id
    WHERE ba.user_id = ?
    ORDER BY ba.awarded_at DESC
  `).all(req.user.id);

  res.json({ user, progress, badges });
});

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, 'public');
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`\nAI Learn server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log('Client dev server should be running on http://localhost:3000');
  }
});
