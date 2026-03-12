const express = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// GET /api/progress/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userResult = await db.execute({
      sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
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
    console.error('GET /me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/progress
router.post('/', authMiddleware, async (req, res) => {
  const { sectionId, subsectionId, quizScore } = req.body;
  if (!sectionId || !subsectionId) {
    return res.status(400).json({ error: 'sectionId and subsectionId are required' });
  }

  try {
    await db.execute({
      sql: `INSERT INTO progress (user_id, section_id, subsection_id, quiz_score)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, subsection_id)
            DO UPDATE SET completed_at = CURRENT_TIMESTAMP, quiz_score = excluded.quiz_score`,
      args: [req.user.id, sectionId, subsectionId, quizScore ?? null]
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

module.exports = router;
