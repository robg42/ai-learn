const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/me - Get current user with progress and badges
router.get('/me', authMiddleware, (req, res) => {
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

// POST /api/progress - Record subsection completion
router.post('/', authMiddleware, (req, res) => {
  const { sectionId, subsectionId, quizScore } = req.body;
  if (!sectionId || !subsectionId) {
    return res.status(400).json({ error: 'sectionId and subsectionId are required' });
  }

  try {
    db.prepare(`
      INSERT INTO progress (user_id, section_id, subsection_id, quiz_score)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, subsection_id)
      DO UPDATE SET completed_at = CURRENT_TIMESTAMP, quiz_score = excluded.quiz_score
    `).run(req.user.id, sectionId, subsectionId, quizScore ?? null);

    res.json({ success: true });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
