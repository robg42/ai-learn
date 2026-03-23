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
// Computed from VALID_SUBSECTIONS after it's defined (see below)
let TOTAL_SUBSECTIONS;
let SUBSECTIONS_PER_SECTION_MAP;

// Optional labs — don't block sequential progress
const OPTIONAL_SUBSECTIONS = new Set([
  'lab-temperature', 'lab-rag-quality', 'lab-hallucination-hunter', 'lab-context-window',
  'lab-multi-agent-debate', 'lab-broken-agent', 'lab-hitl-design',
  'lab-red-team', 'lab-defensive-prompt',
]);

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
    'adversarial-inputs', 'model-extraction', 'ai-supply-chain', 'jailbreaking-deep',
    'secure-ai-architecture', 'lab-defensive-prompt', 'ai-incident-response', 'secure-ai-development', 'enterprise-ai-risk',
    'ai-regulation-landscape', 'alignment-and-safety', 'catastrophic-risks', 'ai-security-futures',
  ],
};

// Compute subsection counts from the canonical VALID_SUBSECTIONS
SUBSECTIONS_PER_SECTION_MAP = {};
TOTAL_SUBSECTIONS = 0;
for (const [sectionId, subs] of Object.entries(VALID_SUBSECTIONS)) {
  SUBSECTIONS_PER_SECTION_MAP[sectionId] = subs.length;
  TOTAL_SUBSECTIONS += subs.length;
}

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

    // --- Server-side prerequisite check (skip for retakes) ---
    if (isNew) {
      const allProgress = await db.execute({
        sql: 'SELECT subsection_id FROM progress WHERE user_id = ?',
        args: [req.user.id]
      });
      const completedSet = new Set(allProgress.rows.map(r => r.subsection_id));

      // Cross-section unlock: agentic needs 'what-are-llms', security needs 'what-is-agentic-ai'
      const sectionPrereqs = {
        'agentic-ai': 'what-are-llms',
        'ai-security': 'what-is-agentic-ai',
      };
      const sectionPrereq = sectionPrereqs[sectionId];
      if (sectionPrereq && !completedSet.has(sectionPrereq)) {
        return res.status(403).json({ error: 'Prerequisite section not unlocked' });
      }

      // Within-section sequential unlock: previous required subsection must be done
      // Optional labs can be skipped — they don't block and aren't required as prereqs
      const sectionOrder = validSubs;
      const idx = sectionOrder.indexOf(subsectionId);
      if (idx > 0) {
        if (OPTIONAL_SUBSECTIONS.has(subsectionId)) {
          // Optional lab: find the most recent required lesson before it
          for (let k = idx - 1; k >= 0; k--) {
            if (!OPTIONAL_SUBSECTIONS.has(sectionOrder[k])) {
              if (!completedSet.has(sectionOrder[k])) {
                return res.status(403).json({ error: 'Complete the previous lesson first' });
              }
              break;
            }
          }
        } else {
          // Required lesson: find the previous required lesson (skip optional ones)
          for (let k = idx - 1; k >= 0; k--) {
            if (!OPTIONAL_SUBSECTIONS.has(sectionOrder[k])) {
              if (!completedSet.has(sectionOrder[k])) {
                return res.status(403).json({ error: 'Complete the previous lesson first' });
              }
              break;
            }
          }
        }
      }
    }

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
  if (sectionRows.length === SUBSECTIONS_PER_SECTION_MAP[sectionId]) {
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
module.exports.VALID_SUBSECTIONS = VALID_SUBSECTIONS;
