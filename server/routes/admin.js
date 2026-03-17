const express = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { sendWelcomeEmail } = require('../email');

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
    const created = { ...newUser.rows[0] };
    // Fire welcome email (non-blocking)
    sendWelcomeEmail({ to: created.email, name: created.name }).catch(() => {});
    res.status(201).json(created);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    // Single aggregated query replaces N×3 per-user queries
    const result = await db.execute({
      sql: `SELECT
              u.id, u.email, u.name, u.role, u.created_at, u.last_login_at, u.login_count,
              u.show_on_leaderboard, u.can_view_leaderboard,
              COUNT(DISTINCT p.id)  AS total_completed,
              COUNT(DISTINCT ba.id) AS total_badges,
              MAX(p.completed_at)   AS last_active,
              COUNT(DISTINCT CASE WHEN p.section_id = 'llm-basics'  THEN p.id END) AS llm_completed,
              COUNT(DISTINCT CASE WHEN p.section_id = 'agentic-ai'  THEN p.id END) AS agentic_completed,
              COUNT(DISTINCT CASE WHEN p.section_id = 'ai-security' THEN p.id END) AS security_completed
            FROM users u
            LEFT JOIN progress p     ON p.user_id  = u.id
            LEFT JOIN badge_awards ba ON ba.user_id = u.id
            GROUP BY u.id
            ORDER BY u.created_at DESC`,
      args: []
    });

    // Second query: all badge awards across all users in one shot
    const badgesResult = await db.execute({
      sql: `SELECT ba.user_id, ba.awarded_at, bd.slug, bd.name, bd.icon, bd.color
            FROM badge_awards ba
            JOIN badge_definitions bd ON bd.id = ba.badge_id
            ORDER BY ba.awarded_at DESC`,
      args: []
    });

    // Group badges by user_id
    const badgesByUser = {};
    for (const row of badgesResult.rows) {
      if (!badgesByUser[row.user_id]) badgesByUser[row.user_id] = [];
      badgesByUser[row.user_id].push({ awarded_at: row.awarded_at, slug: row.slug, name: row.name, icon: row.icon, color: row.color });
    }

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      created_at: row.created_at,
      last_login_at: row.last_login_at,
      login_count: Number(row.login_count || 0),
      show_on_leaderboard: row.show_on_leaderboard,
      can_view_leaderboard: row.can_view_leaderboard,
      totalCompleted: Number(row.total_completed || 0),
      lastActive: row.last_active || null,
      badges: badgesByUser[row.id] || [],
      progressSummary: {
        'llm-basics':  { total: 18, completed: Number(row.llm_completed  || 0) },
        'agentic-ai':  { total: 18, completed: Number(row.agentic_completed || 0) },
        'ai-security': { total: 18, completed: Number(row.security_completed || 0) },
      },
    }));

    res.json(users);
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

// PATCH /api/admin/users/:id/leaderboard — toggle leaderboard visibility settings
router.patch('/users/:id/leaderboard', async (req, res) => {
  try {
    const { id } = req.params;
    const { showOnLeaderboard, canViewLeaderboard } = req.body;
    const sets = [];
    const args = [];
    if (showOnLeaderboard !== undefined) { sets.push('show_on_leaderboard = ?'); args.push(showOnLeaderboard ? 1 : 0); }
    if (canViewLeaderboard !== undefined) { sets.push('can_view_leaderboard = ?'); args.push(canViewLeaderboard ? 1 : 0); }
    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' });
    args.push(id);
    await db.execute({ sql: `UPDATE users SET ${sets.join(', ')} WHERE id = ?`, args });
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /admin/users/:id/leaderboard error:', err);
    res.status(500).json({ error: 'Failed to update leaderboard settings' });
  }
});

// PATCH /api/admin/users/:id/role — promote to admin or demote to user
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'role must be "user" or "admin"' });
    }
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }
    const userResult = await db.execute({ sql: 'SELECT id, role FROM users WHERE id = ?', args: [id] });
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });

    // Prevent demoting the last admin
    if (role === 'user' && userResult.rows[0].role === 'admin') {
      const adminCount = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM users WHERE role = ?',
        args: ['admin']
      });
      if (Number(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot demote the last admin account' });
      }
    }

    await db.execute({ sql: 'UPDATE users SET role = ? WHERE id = ?', args: [role, id] });
    res.json({ ok: true, role });
  } catch (err) {
    console.error('PATCH /admin/users/:id/role error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
    const userResult = await db.execute({ sql: 'SELECT id, role FROM users WHERE id = ?', args: [id] });
    if (!userResult.rows[0]) return res.status(404).json({ error: 'User not found' });

    // Prevent deleting the last admin
    if (userResult.rows[0].role === 'admin') {
      const adminCount = await db.execute({
        sql: 'SELECT COUNT(*) as count FROM users WHERE role = ?',
        args: ['admin']
      });
      if (Number(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin account' });
      }
    }
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
                   COUNT(DISTINCT CASE WHEN sub_count >= 18 THEN user_id END) as users_completed
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

    const totalSubsections = 54; // 3 sections × 18 subsections each
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
