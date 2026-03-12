const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Badge trigger rules: slug -> function(completedSubsections) => boolean
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

// POST /api/badges/auto-check - Check and award auto badges
router.post('/auto-check', authMiddleware, (req, res) => {
  const userId = req.user.id;

  // Get all completed subsections for user
  const completedRows = db.prepare('SELECT subsection_id FROM progress WHERE user_id = ?').all(userId);
  const completed = new Set(completedRows.map(r => r.subsection_id));

  // Get already awarded badges
  const awardedRows = db.prepare(`
    SELECT bd.slug FROM badge_awards ba
    JOIN badge_definitions bd ON bd.id = ba.badge_id
    WHERE ba.user_id = ?
  `).all(userId);
  const alreadyAwarded = new Set(awardedRows.map(r => r.slug));

  const newBadges = [];

  for (const [slug, triggerFn] of Object.entries(BADGE_TRIGGERS)) {
    if (alreadyAwarded.has(slug)) continue;
    if (triggerFn(completed)) {
      const badge = db.prepare('SELECT * FROM badge_definitions WHERE slug = ?').get(slug);
      if (badge) {
        try {
          db.prepare(`
            INSERT OR IGNORE INTO badge_awards (user_id, badge_id, awarded_by)
            VALUES (?, ?, NULL)
          `).run(userId, badge.id);
          newBadges.push(badge);
        } catch (err) {
          console.error('Badge award error:', err);
        }
      }
    }
  }

  res.json({ newBadges });
});

module.exports = router;
