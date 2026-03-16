const express = require('express');
const { db } = require('../db');

const router = express.Router();

// GET /api/leaderboard — public, no auth required
// Only returns users where show_on_leaderboard = 1
router.get('/', async (req, res) => {
  try {
    const usersResult = await db.execute({
      sql: `SELECT u.id, u.name
            FROM users u
            WHERE u.show_on_leaderboard = 1
            ORDER BY u.created_at ASC`,
      args: []
    });

    const result = await Promise.all(usersResult.rows.map(async (user) => {
      const progressResult = await db.execute({
        sql: 'SELECT COUNT(*) as total FROM progress WHERE user_id = ?',
        args: [user.id]
      });
      const badgesResult = await db.execute({
        sql: 'SELECT COUNT(*) as total FROM badge_awards WHERE user_id = ?',
        args: [user.id]
      });
      const lastActiveResult = await db.execute({
        sql: 'SELECT MAX(completed_at) as last_active FROM progress WHERE user_id = ?',
        args: [user.id]
      });

      return {
        id: user.id,
        name: user.name,
        lessonsCompleted: Number(progressResult.rows[0]?.total || 0),
        badgesEarned: Number(badgesResult.rows[0]?.total || 0),
        lastActive: lastActiveResult.rows[0]?.last_active || null,
      };
    }));

    // Sort by lessons completed desc, then badges desc
    result.sort((a, b) => b.lessonsCompleted - a.lessonsCompleted || b.badgesEarned - a.badgesEarned);

    res.json(result);
  } catch (err) {
    console.error('GET /api/leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
