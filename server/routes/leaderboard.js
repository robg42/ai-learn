const express = require('express');
const { db } = require('../db');

const router = express.Router();

// GET /api/leaderboard — public, no auth required
// Only returns users where show_on_leaderboard = 1
router.get('/', async (req, res) => {
  try {
    // Single aggregated query replaces N×3 per-user queries
    const result = await db.execute({
      sql: `SELECT
              u.id, u.name,
              COUNT(DISTINCT p.id)  AS lessons_completed,
              COUNT(DISTINCT ba.id) AS badges_earned,
              MAX(p.completed_at)   AS last_active
            FROM users u
            LEFT JOIN progress p     ON p.user_id  = u.id
            LEFT JOIN badge_awards ba ON ba.user_id = u.id
            WHERE u.show_on_leaderboard = 1
            GROUP BY u.id
            ORDER BY lessons_completed DESC, badges_earned DESC`,
      args: []
    });

    const leaderboard = result.rows.map((row, idx) => ({
      rank: idx + 1,
      name: row.name,
      lessonsCompleted: Number(row.lessons_completed || 0),
      badgesEarned: Number(row.badges_earned || 0),
    }));

    res.json(leaderboard);
  } catch (err) {
    console.error('GET /api/leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
