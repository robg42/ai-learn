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
const TOTAL_SUBSECTIONS = 54; // 18 per section × 3 sections
const SUBSECTIONS_PER_SECTION = 18;

// Allowlist of valid (sectionId → subsectionId[]) mappings
const VALID_SUBSECTIONS = {
  'llm-basics': [
    'what-are-llms', 'transformers-and-tokens', 'lab-tokenizer', 'llm-providers', 'prompting-basics',
    'lab-temperature', 'llm-capabilities', 'llm-use-cases',
    'training-fundamentals', 'finetuning-and-rlhf', 'context-and-rag', 'lab-rag-quality',
    'evaluating-llms', 'lab-hallucination-hunter',
    'llm-api-integration', 'lab-prompt-playground', 'structured-outputs', 'multimodal-llms', 'llm-ops',
    'lab-context-window',
    'scaling-laws', 'interpretability', 'alignment-research', 'future-llms',
  ],
  'agentic-ai': [
    'what-is-agentic-ai', 'agent-components', 'agent-tools', 'lab-agent-loop', 'agent-memory',
    'multi-agent-systems', 'lab-multi-agent-debate', 'building-agents',
    'agent-planning-algorithms', 'agent-failure-recovery', 'lab-broken-agent',
    'human-in-the-loop', 'lab-hitl-design', 'agent-evaluation',
    'production-agent-patterns', 'agentic-observability', 'agentic-by-domain', 'agent-security-in-depth',
    'agent-architectures-research', 'corrigibility-and-control', 'multiagent-theory', 'future-of-agency',
  ],
  'ai-security': [
    'ai-threat-landscape', 'prompt-injection', 'lab-injection-sandbox', 'data-privacy',
    'ai-red-teaming', 'lab-red-team', 'secure-deployment', 'ai-governance',
    'adversarial-inputs', 'model-extraction', 'lab-data-leakage', 'ai-supply-chain', 'jailbreaking-deep',
    'secure-ai-architecture', 'lab-defensive-prompt', 'ai-incident-response', 'secure-ai-development', 'enterprise-ai-risk',
    'ai-regulation-landscape', 'alignment-and-safety', 'catastrophic-risks', 'ai-security-futures',
  ],
};

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
  // Validate against allowlist
  const validSubs = VALID_SUBSECTIONS[sectionId];
  if (!validSubs || !validSubs.includes(subsectionId)) {
    return res.status(400).json({ error: 'Invalid sectionId or subsectionId' });
  }
  // Clamp quizScore to valid range
  const safeScore = quizScore != null ? Math.max(0, Math.min(100, parseInt(quizScore, 10) || 0)) : null;

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
      args: [req.user.id, sectionId, subsectionId, safeScore]
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
  if (sectionRows.length === SUBSECTIONS_PER_SECTION) {
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
