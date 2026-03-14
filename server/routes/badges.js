const express = require('express');
const { db } = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Course 1 subsection IDs (matching course.js exactly)
const LLM_C1 = ['what-are-llms', 'transformers-and-tokens', 'llm-providers', 'prompting-basics', 'llm-capabilities', 'llm-use-cases'];
const AGENT_C1 = ['what-is-agentic-ai', 'agent-components', 'agent-tools', 'agent-memory', 'multi-agent-systems', 'building-agents'];
const SEC_C1 = ['ai-threat-landscape', 'prompt-injection', 'data-privacy', 'ai-red-teaming', 'secure-deployment', 'ai-governance'];

// Course 2 subsection IDs
const LLM_C2 = ['training-fundamentals', 'finetuning-and-rlhf', 'context-and-rag', 'evaluating-llms'];
const AGENT_C2 = ['agent-planning-algorithms', 'agent-failure-recovery', 'human-in-the-loop', 'agent-evaluation'];
const SEC_C2 = ['adversarial-inputs', 'model-extraction', 'ai-supply-chain', 'jailbreaking-deep'];

// Course 3 subsection IDs
const LLM_C3 = ['llm-api-integration', 'structured-outputs', 'multimodal-llms', 'llm-ops'];
const AGENT_C3 = ['production-agent-patterns', 'agentic-observability', 'agentic-by-domain', 'agent-security-in-depth'];
const SEC_C3 = ['secure-ai-architecture', 'ai-incident-response', 'secure-ai-development', 'enterprise-ai-risk'];

// Course 4 subsection IDs
const LLM_C4 = ['scaling-laws', 'interpretability', 'alignment-research', 'future-llms'];
const AGENT_C4 = ['agent-architectures-research', 'corrigibility-and-control', 'multiagent-theory', 'future-of-agency'];
const SEC_C4 = ['ai-regulation-landscape', 'alignment-and-safety', 'catastrophic-risks', 'ai-security-futures'];

const ALL_LLM = [...LLM_C1, ...LLM_C2, ...LLM_C3, ...LLM_C4];
const ALL_AGENT = [...AGENT_C1, ...AGENT_C2, ...AGENT_C3, ...AGENT_C4];
const ALL_SEC = [...SEC_C1, ...SEC_C2, ...SEC_C3, ...SEC_C4];
const ALL_SUBSECTIONS = [...ALL_LLM, ...ALL_AGENT, ...ALL_SEC];

const BADGE_TRIGGERS = {
  // — Course 1 section completion —
  'first-steps':      (c) => c.has('what-are-llms'),
  'llm-master':       (c) => LLM_C1.every(id => c.has(id)),
  'agentic-thinker':  (c) => c.has('what-is-agentic-ai'),
  'agent-architect':  (c) => AGENT_C1.every(id => c.has(id)),
  'security-sentinel':(c) => SEC_C1.every(id => c.has(id)),
  'full-stack':       (c) => [...LLM_C1, ...AGENT_C1, ...SEC_C1].every(id => c.has(id)),

  // — Per-subsection badges (LLM Course 1) —
  'early-adopter-energy':   (c) => c.has('what-are-llms'),
  'provider-picker':        (c) => c.has('llm-providers'),
  'token-whisperer':        (c) => c.has('transformers-and-tokens'),
  'knows-the-limits':       (c) => c.has('llm-capabilities'),
  'technically-unemployed': (c) => c.has('llm-use-cases'),
  'security-fundamentalist':(c) => c.has('prompting-basics'),

  // — Per-subsection badges (Agentic Course 1) —
  'agent-apprentice':    (c) => c.has('agent-components'),
  'blueprint-reader':    (c) => c.has('agent-tools'),
  'chaos-gremlin':       (c) => c.has('agent-memory'),
  'distracted-by-demos': (c) => c.has('multi-agent-systems'),
  'double-trouble':      (c) => c.has('building-agents'),

  // — Per-subsection badges (Security Course 1) —
  'threat-intelligence': (c) => c.has('ai-threat-landscape'),
  'privacy-nerd':        (c) => c.has('data-privacy'),
  'corporate-drone':     (c) => c.has('ai-governance'),
  'problem-solver':      (c) => c.has('secure-deployment'),
  'cold-email-incoming': (c) => c.has('ai-red-teaming'),

  // — Milestone badges (count-based, work across all courses) —
  'warming-up':         (c) => c.size >= 3,
  'halfway-to-halfway': (c) => c.size >= 6,
  'halfway-there':      (c) => c.size >= 9,
  'galaxy-brain':       (c) => c.size >= 12,
  'still-here':         (c) => c.size >= 16,

  // — Course 1 section-completion companion badges —
  'are-you-a-robot': (c) => AGENT_C1.every(id => c.has(id)),
  'send-help':       (c) => SEC_C1.every(id => c.has(id)),
  'overachiever':    (c) => ALL_SUBSECTIONS.every(id => c.has(id)),
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
