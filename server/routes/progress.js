const express = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendMilestoneEmail } = require('../email');

const router = express.Router();

const SECTION_NAMES = {
  'llm-basics': 'LLM Fundamentals',
  'agentic-ai': 'Agentic AI',
  'ai-security': 'AI Security',
};
const TOTAL_SUBSECTIONS = 18; // 6 per section × 3 sections

// GET /api/progress/me
router.get('/me', authMiddleware, async (req, res) => {
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
    // Check if this is a NEW completion (not a retake)
    const existing = await db.execute({
      sql: 'SELECT id FROM progress WHERE user_id = ? AND subsection_id = ?',
      args: [req.user.id, subsectionId]
    });
    const isNew = !existing.rows[0];

    await db.execute({
      sql: `INSERT INTO progress (user_id, section_id, subsection_id, quiz_score)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, subsection_id)
            DO UPDATE SET completed_at = CURRENT_TIMESTAMP, quiz_score = excluded.quiz_score`,
      args: [req.user.id, sectionId, subsectionId, quizScore ?? null]
    });

    // Fire milestone emails only on genuinely new completions (not retakes)
    if (isNew) {
      // Run milestone check asynchronously — don't block the response
      checkMilestones(req.user.id, sectionId).catch(err =>
        console.error('[milestone] check error:', err)
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

async function checkMilestones(userId, sectionId) {
  const userResult = await db.execute({
    sql: 'SELECT email, name FROM users WHERE id = ?',
    args: [userId]
  });
  const user = userResult.rows[0];
  if (!user) return;

  const progressResult = await db.execute({
    sql: 'SELECT section_id, subsection_id FROM progress WHERE user_id = ?',
    args: [userId]
  });
  const total = progressResult.rows.length;

  // Section completion milestone
  const sectionRows = progressResult.rows.filter(r => r.section_id === sectionId);
  if (sectionRows.length === 6) {
    const sectionName = SECTION_NAMES[sectionId] || sectionId;
    await sendMilestoneEmail({
      to: user.email,
      name: user.name,
      milestoneTitle: `${sectionName} Complete! 🎉`,
      milestoneBody: `You've finished all lessons in ${sectionName}. That's a huge milestone — well done!`,
    });
  }

  // Overall course completion
  if (total === TOTAL_SUBSECTIONS) {
    await sendMilestoneEmail({
      to: user.email,
      name: user.name,
      milestoneTitle: `Course Complete — You're an AI Expert! 🏆`,
      milestoneBody: `You've completed every single lesson across all three sections. Incredible work, ${user.name}!`,
    });
  }
}

module.exports = router;
