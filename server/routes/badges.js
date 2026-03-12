const express = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

const BADGE_TRIGGERS = {
  'first-steps': (completed) => completed.has('what-are-llms'),
  'llm-master': (completed) => {
    const llmSubsections = [
      'what-are-llms', 'major-llm-providers', 'how-llms-work',
      'capabilities-limitations', 'business-applications', 'security-fundamentals'
    ];
    return llmSubsections.every(id => completed.has(id));
  },
  'agentic-thinker': (completed) => completed.has('what-is-agentic-ai'),
  'agent-architect': (completed) => {
    const agentSubsections = [
      'what-is-agentic-ai', 'how-agents-work', 'agentic-architectures',
      'agent-failures-risks', 'real-world-agent-systems', 'security-risks-agentic'
    ];
    return agentSubsections.every(id => completed.has(id));
  },
  'security-sentinel': (completed) => {
    const secSubsections = [
      'llm-security-threats', 'agentic-security-risks', 'data-privacy-compliance',
      'enterprise-risk-assessment', 'mitigation-strategies', 'ai-security-vendors'
    ];
    return secSubsections.every(id => completed.has(id));
  },
  'full-stack': (completed) => {
    const allSubsections = [
      'what-are-llms', 'major-llm-providers', 'how-llms-work',
      'capabilities-limitations', 'business-applications', 'security-fundamentals',
      'what-is-agentic-ai', 'how-agents-work', 'agentic-architectures',
      'agent-failures-risks', 'real-world-agent-systems', 'security-risks-agentic',
      'llm-security-threats', 'agentic-security-risks', 'data-privacy-compliance',
      'enterprise-risk-assessment', 'mitigation-strategies', 'ai-security-vendors'
    ];
    return allSubsections.every(id => completed.has(id));
  }
};

// POST /api/badges/auto-check
router.post('/auto-check', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const completedResult = await db.execute({
      sql: 'SELECT subsection_id FROM progress WHERE user_id = ?',
      args: [userId]
    });
    const completed = new Set(completedResult.rows.map(r => r.subsection_id));

    const awardedResult = await db.execute({
      sql: `SELECT bd.slug FROM badge_awards ba
            JOIN badge_definitions bd ON bd.id = ba.badge_id
            WHERE ba.user_id = ?`,
      args: [userId]
    });
    const alreadyAwarded = new Set(awardedResult.rows.map(r => r.slug));

    const newBadges = [];

    for (const [slug, triggerFn] of Object.entries(BADGE_TRIGGERS)) {
      if (alreadyAwarded.has(slug)) continue;
      if (triggerFn(completed)) {
        const badgeResult = await db.execute({
          sql: 'SELECT * FROM badge_definitions WHERE slug = ?',
          args: [slug]
        });
        const badge = badgeResult.rows[0];
        if (badge) {
          try {
            await db.execute({
              sql: `INSERT OR IGNORE INTO badge_awards (user_id, badge_id, awarded_by)
                    VALUES (?, ?, NULL)`,
              args: [userId, badge.id]
            });
            newBadges.push({ ...badge });
          } catch (err) {
            console.error('Badge award error:', err);
          }
        }
      }
    }

    res.json({ newBadges });
  } catch (err) {
    console.error('auto-check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
