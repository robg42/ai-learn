const express = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

router.use(authMiddleware, adminOnly);

// POST /api/admin/users — create a new user account
router.post('/users', async (req, res) => {
  const { email, name, role = 'user' } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'email and name are required' });
  }
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'role must be user or admin' });
  }

  const normalEmail = email.toLowerCase().trim();

  try {
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [normalEmail]
    });
    if (existing.rows[0]) {
      return res.status(409).json({ error: 'An account with that email already exists' });
    }

    const result = await db.execute({
      sql: 'INSERT INTO users (email, name, role) VALUES (?, ?, ?)',
      args: [normalEmail, name.trim(), role]
    });
    const newUser = await db.execute({
      sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    });
    res.status(201).json({ ...newUser.rows[0] });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const usersResult = await db.execute({
      sql: 'SELECT id, email, name, role, created_at, last_login_at, login_count FROM users ORDER BY created_at DESC',
      args: []
    });

    const result = await Promise.all(usersResult.rows.map(async (user) => {
      const progressResult = await db.execute({
        sql: 'SELECT section_id, subsection_id FROM progress WHERE user_id = ?',
        args: [user.id]
      });
      const badgesResult = await db.execute({
        sql: `SELECT ba.awarded_at, bd.slug, bd.name, bd.icon, bd.color
              FROM badge_awards ba
              JOIN badge_definitions bd ON bd.id = ba.badge_id
              WHERE ba.user_id = ?
              ORDER BY ba.awarded_at DESC`,
        args: [user.id]
      });
      const lastActiveResult = await db.execute({
        sql: 'SELECT MAX(completed_at) as last_active FROM progress WHERE user_id = ?',
        args: [user.id]
      });

      const progressRows = progressResult.rows;
      const sectionCounts = {
        'llm-basics': { total: 6, completed: 0 },
        'agentic-ai': { total: 6, completed: 0 },
        'ai-security': { total: 6, completed: 0 }
      };
      for (const row of progressRows) {
        if (sectionCounts[row.section_id]) {
          sectionCounts[row.section_id].completed++;
        }
      }

      return {
        ...user,
        progressSummary: sectionCounts,
        totalCompleted: progressRows.length,
        badges: badgesResult.rows.map(r => ({ ...r })),
        lastActive: lastActiveResult.rows[0]?.last_active || null
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('GET /admin/users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const userResult = await db.execute({
      sql: 'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
      args: [req.params.id]
    });
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const progressResult = await db.execute({
      sql: 'SELECT * FROM progress WHERE user_id = ? ORDER BY completed_at DESC',
      args: [user.id]
    });
    const badgesResult = await db.execute({
      sql: `SELECT ba.*, bd.slug, bd.name, bd.description, bd.icon, bd.color, bd.type
            FROM badge_awards ba
            JOIN badge_definitions bd ON bd.id = ba.badge_id
            WHERE ba.user_id = ?
            ORDER BY ba.awarded_at DESC`,
      args: [user.id]
    });

    res.json({
      user: { ...user },
      progress: progressResult.rows.map(r => ({ ...r })),
      badges: badgesResult.rows.map(r => ({ ...r }))
    });
  } catch (err) {
    console.error('GET /admin/users/:id error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/badges
router.post('/badges', async (req, res) => {
  const { name, description, icon, color } = req.body;
  if (!name || !description || !icon || !color) {
    return res.status(400).json({ error: 'name, description, icon, and color are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

  try {
    const result = await db.execute({
      sql: `INSERT INTO badge_definitions (slug, name, description, icon, color, type, created_by)
            VALUES (?, ?, ?, ?, ?, 'custom', ?)`,
      args: [slug, name, description, icon, color, req.user.id]
    });
    const badgeResult = await db.execute({
      sql: 'SELECT * FROM badge_definitions WHERE id = ?',
      args: [Number(result.lastInsertRowid)]
    });
    res.status(201).json({ ...badgeResult.rows[0] });
  } catch (err) {
    console.error('Badge creation error:', err);
    res.status(500).json({ error: 'Failed to create badge' });
  }
});

// GET /api/admin/badges
router.get('/badges', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM badge_definitions ORDER BY created_at DESC',
      args: []
    });
    res.json(result.rows.map(r => ({ ...r })));
  } catch (err) {
    console.error('GET /admin/badges error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/badges/award
router.post('/badges/award', async (req, res) => {
  const { userId, badgeId } = req.body;
  if (!userId || !badgeId) {
    return res.status(400).json({ error: 'userId and badgeId are required' });
  }

  try {
    const userResult = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [userId] });
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });

    const badgeResult = await db.execute({ sql: 'SELECT id FROM badge_definitions WHERE id = ?', args: [badgeId] });
    if (!badgeResult.rows[0]) return res.status(404).json({ error: 'Badge not found' });

    await db.execute({
      sql: `INSERT OR IGNORE INTO badge_awards (user_id, badge_id, awarded_by) VALUES (?, ?, ?)`,
      args: [userId, badgeId, req.user.id]
    });
    res.json({ success: true });
  } catch (err) {
    console.error('Badge award error:', err);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
    const userResult = await db.execute({ sql: 'SELECT id FROM users WHERE id = ?', args: [id] });
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });
    await db.batch([
      { sql: 'DELETE FROM progress WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM badge_awards WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM magic_link_tokens WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM password_reset_tokens WHERE user_id = ?', args: [id] },
      { sql: 'DELETE FROM users WHERE id = ?', args: [id] },
    ], 'write');
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /admin/users/:id error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const totalUsersResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM users WHERE role = ?',
      args: ['user']
    });

    const subsectionCompletionResult = await db.execute({
      sql: `SELECT subsection_id, section_id, COUNT(*) as completed_count,
                   AVG(quiz_score) as avg_score
            FROM progress
            GROUP BY subsection_id
            ORDER BY section_id, subsection_id`,
      args: []
    });

    const sectionCompletionResult = await db.execute({
      sql: `SELECT section_id,
                   COUNT(DISTINCT user_id) as users_started,
                   COUNT(DISTINCT CASE WHEN sub_count >= 6 THEN user_id END) as users_completed
            FROM (
              SELECT user_id, section_id, COUNT(*) as sub_count
              FROM progress
              GROUP BY user_id, section_id
            )
            GROUP BY section_id`,
      args: []
    });

    const signupsOverTimeResult = await db.execute({
      sql: `SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at >= DATE('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC`,
      args: []
    });

    const avgCompletionResult = await db.execute({
      sql: `SELECT AVG(user_count) as avg
            FROM (
              SELECT user_id, COUNT(*) as user_count FROM progress GROUP BY user_id
            )`,
      args: []
    });

    const topSubsectionsResult = await db.execute({
      sql: `SELECT subsection_id, section_id, COUNT(*) as count
            FROM progress
            GROUP BY subsection_id
            ORDER BY count DESC
            LIMIT 5`,
      args: []
    });

    const totalSubsections = 18;
    const avgRaw = avgCompletionResult.rows[0]?.avg;

    res.json({
      totalUsers: totalUsersResult.rows[0].count,
      avgCompletionPercent: avgRaw ? Math.round((Number(avgRaw) / totalSubsections) * 100) : 0,
      subsectionCompletion: subsectionCompletionResult.rows.map(r => ({ ...r })),
      sectionCompletion: sectionCompletionResult.rows.map(r => ({ ...r })),
      signupsOverTime: signupsOverTimeResult.rows.map(r => ({ ...r })),
      topSubsections: topSubsectionsResult.rows.map(r => ({ ...r }))
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
