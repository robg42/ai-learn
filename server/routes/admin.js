const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminOnly);

// GET /api/admin/users - List all users with progress summaries
router.get('/users', (req, res) => {
  const users = db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC').all();

  const result = users.map(user => {
    const progressRows = db.prepare('SELECT section_id, subsection_id FROM progress WHERE user_id = ?').all(user.id);
    const badges = db.prepare(`
      SELECT ba.awarded_at, bd.slug, bd.name, bd.icon, bd.color
      FROM badge_awards ba
      JOIN badge_definitions bd ON bd.id = ba.badge_id
      WHERE ba.user_id = ?
      ORDER BY ba.awarded_at DESC
    `).all(user.id);

    // Calculate completion per section
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

    const lastActive = db.prepare(
      'SELECT MAX(completed_at) as last_active FROM progress WHERE user_id = ?'
    ).get(user.id);

    return {
      ...user,
      progressSummary: sectionCounts,
      totalCompleted: progressRows.length,
      badges,
      lastActive: lastActive?.last_active || null
    };
  });

  res.json(result);
});

// GET /api/admin/users/:id - Get full user profile
router.get('/users/:id', (req, res) => {
  const user = db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const progress = db.prepare('SELECT * FROM progress WHERE user_id = ? ORDER BY completed_at DESC').all(user.id);
  const badges = db.prepare(`
    SELECT ba.*, bd.slug, bd.name, bd.description, bd.icon, bd.color, bd.type
    FROM badge_awards ba
    JOIN badge_definitions bd ON bd.id = ba.badge_id
    WHERE ba.user_id = ?
    ORDER BY ba.awarded_at DESC
  `).all(user.id);

  res.json({ user, progress, badges });
});

// POST /api/admin/badges - Create a custom badge
router.post('/badges', (req, res) => {
  const { name, description, icon, color } = req.body;
  if (!name || !description || !icon || !color) {
    return res.status(400).json({ error: 'name, description, icon, and color are required' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

  try {
    const result = db.prepare(`
      INSERT INTO badge_definitions (slug, name, description, icon, color, type, created_by)
      VALUES (?, ?, ?, ?, ?, 'custom', ?)
    `).run(slug, name, description, icon, color, req.user.id);

    const badge = db.prepare('SELECT * FROM badge_definitions WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(badge);
  } catch (err) {
    console.error('Badge creation error:', err);
    res.status(500).json({ error: 'Failed to create badge' });
  }
});

// GET /api/admin/badges - List all badge definitions
router.get('/badges', (req, res) => {
  const badges = db.prepare('SELECT * FROM badge_definitions ORDER BY created_at DESC').all();
  res.json(badges);
});

// POST /api/admin/badges/award - Award a badge to a user
router.post('/badges/award', (req, res) => {
  const { userId, badgeId } = req.body;
  if (!userId || !badgeId) {
    return res.status(400).json({ error: 'userId and badgeId are required' });
  }

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const badge = db.prepare('SELECT id FROM badge_definitions WHERE id = ?').get(badgeId);
  if (!badge) return res.status(404).json({ error: 'Badge not found' });

  try {
    db.prepare(`
      INSERT OR IGNORE INTO badge_awards (user_id, badge_id, awarded_by)
      VALUES (?, ?, ?)
    `).run(userId, badgeId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Badge award error:', err);
    res.status(500).json({ error: 'Failed to award badge' });
  }
});

// GET /api/admin/analytics - Get platform analytics
router.get('/analytics', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('user');

  // Completion rates per subsection
  const subsectionCompletion = db.prepare(`
    SELECT subsection_id, section_id, COUNT(*) as completed_count,
           AVG(quiz_score) as avg_score
    FROM progress
    GROUP BY subsection_id
    ORDER BY section_id, subsection_id
  `).all();

  // Total users by section completion
  const sectionCompletion = db.prepare(`
    SELECT section_id,
           COUNT(DISTINCT user_id) as users_started,
           COUNT(DISTINCT CASE WHEN sub_count >= 6 THEN user_id END) as users_completed
    FROM (
      SELECT user_id, section_id, COUNT(*) as sub_count
      FROM progress
      GROUP BY user_id, section_id
    )
    GROUP BY section_id
  `).all();

  // Signups over last 30 days
  const signupsOverTime = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM users
    WHERE created_at >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all();

  // Average overall completion
  const totalSubsections = 18;
  const avgCompletion = db.prepare(`
    SELECT AVG(user_count) as avg
    FROM (
      SELECT user_id, COUNT(*) as user_count FROM progress GROUP BY user_id
    )
  `).get();

  // Most completed subsections
  const topSubsections = db.prepare(`
    SELECT subsection_id, section_id, COUNT(*) as count
    FROM progress
    GROUP BY subsection_id
    ORDER BY count DESC
    LIMIT 5
  `).all();

  res.json({
    totalUsers: totalUsers.count,
    avgCompletionPercent: avgCompletion?.avg
      ? Math.round((avgCompletion.avg / totalSubsections) * 100)
      : 0,
    subsectionCompletion,
    sectionCompletion,
    signupsOverTime,
    topSubsections
  });
});

module.exports = router;
