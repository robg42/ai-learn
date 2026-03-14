const { createClient } = require('@libsql/client');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:../data/ai-learn.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initDb() {
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS magic_link_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        section_id TEXT NOT NULL,
        subsection_id TEXT NOT NULL,
        completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        quiz_score INTEGER,
        UNIQUE(user_id, subsection_id)
      )`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS badge_definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        color TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'auto',
        created_by INTEGER REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS badge_awards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        badge_id INTEGER REFERENCES badge_definitions(id),
        awarded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        awarded_by INTEGER REFERENCES users(id),
        UNIQUE(user_id, badge_id)
      )`,
      args: []
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER REFERENCES users(id),
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      args: []
    },
  ], 'write');

  const seedBadges = [
    // — Original six —
    { slug: 'first-steps', name: 'First Steps', description: 'Completed your first subsection: What Are LLMs?', icon: 'Footprints', color: '#6B46C1', type: 'auto' },
    { slug: 'llm-master', name: 'LLM Master', description: 'Completed all LLM Basics subsections', icon: 'Brain', color: '#8B5CF6', type: 'auto' },
    { slug: 'agentic-thinker', name: 'Agentic Thinker', description: 'Completed the What Is Agentic AI? subsection', icon: 'Bot', color: '#38BDF8', type: 'auto' },
    { slug: 'agent-architect', name: 'Agent Architect', description: 'Completed all Agentic AI subsections', icon: 'Network', color: '#0EA5E9', type: 'auto' },
    { slug: 'security-sentinel', name: 'Security Sentinel', description: 'Completed all AI Security subsections', icon: 'Shield', color: '#10B981', type: 'auto' },
    { slug: 'full-stack', name: 'Full Stack', description: 'Completed all three sections of the course', icon: 'Trophy', color: '#F59E0B', type: 'auto' },

    // — Per-subsection badges (earnest + funny) —
    { slug: 'early-adopter-energy', name: 'Early Adopter Energy', description: "You were probably already using ChatGPT anyway.", icon: 'Rocket', color: '#F59E0B', type: 'auto' },
    { slug: 'provider-picker', name: 'Provider Picker', description: 'Explored the landscape of major LLM providers.', icon: 'Globe', color: '#38BDF8', type: 'auto' },
    { slug: 'token-whisperer', name: 'Token Whisperer', description: 'Understands the mechanics behind how LLMs actually work.', icon: 'Cpu', color: '#8B5CF6', type: 'auto' },
    { slug: 'knows-the-limits', name: 'Knows the Limits', description: 'Understands what AI can — and crucially cannot — do.', icon: 'Target', color: '#10B981', type: 'auto' },
    { slug: 'technically-unemployed', name: 'Technically Unemployed', description: "Completed Business Applications. We're sure your job is safe.", icon: 'Flame', color: '#EF4444', type: 'auto' },
    { slug: 'security-fundamentalist', name: 'Security Fundamentalist', description: 'Grasps the foundational security risks of working with LLMs.', icon: 'Shield', color: '#10B981', type: 'auto' },
    { slug: 'agent-apprentice', name: 'Agent Apprentice', description: 'Understands how autonomous AI agents actually operate.', icon: 'Bot', color: '#38BDF8', type: 'auto' },
    { slug: 'blueprint-reader', name: 'Blueprint Reader', description: 'Digs into the architectures that power multi-agent systems.', icon: 'Database', color: '#6B46C1', type: 'auto' },
    { slug: 'chaos-gremlin', name: 'Chaos Gremlin', description: "Knows exactly how agents go wrong. Suspiciously specific knowledge.", icon: 'Zap', color: '#EC4899', type: 'auto' },
    { slug: 'distracted-by-demos', name: 'Distracted by Demos', description: "Completed Real-World Agent Systems. Probably paused to go try one.", icon: 'Sparkles', color: '#F59E0B', type: 'auto' },
    { slug: 'double-trouble', name: 'Double Trouble', description: "Security risks from both the LLM AND agentic sides. Lucky you.", icon: 'Flame', color: '#EF4444', type: 'auto' },
    { slug: 'threat-intelligence', name: 'Threat Intelligence', description: 'Can identify and understand LLM-specific security threats.', icon: 'Shield', color: '#EF4444', type: 'auto' },
    { slug: 'privacy-nerd', name: 'Privacy Nerd', description: 'Champion of data privacy and regulatory compliance. GDPR has a fan.', icon: 'Lock', color: '#38BDF8', type: 'auto' },
    { slug: 'corporate-drone', name: 'Corporate Drone', description: "Survived Enterprise Risk Assessment. You are now a business stakeholder.", icon: 'Database', color: '#94A3B8', type: 'auto' },
    { slug: 'problem-solver', name: 'Problem Solver', description: 'Has a full toolkit of strategies to mitigate AI security risks.', icon: 'Lightbulb', color: '#10B981', type: 'auto' },
    { slug: 'cold-email-incoming', name: 'Cold Email Incoming', description: "Completed the vendor landscape section. Your LinkedIn is about to get busy.", icon: 'Wifi', color: '#8B5CF6', type: 'auto' },

    // — Milestone badges —
    { slug: 'warming-up', name: 'Warming Up', description: '3 subsections down. You are getting into it.', icon: 'Flame', color: '#F59E0B', type: 'auto' },
    { slug: 'halfway-to-halfway', name: 'Halfway to Halfway', description: "6 subsections complete. That's a third. We're calling it halfway to halfway.", icon: 'Star', color: '#38BDF8', type: 'auto' },
    { slug: 'halfway-there', name: 'Halfway There', description: "9 subsections done. You're past the midpoint. The best is yet to come.", icon: 'Rocket', color: '#6B46C1', type: 'auto' },
    { slug: 'galaxy-brain', name: 'Galaxy Brain', description: "12 subsections deep. Your thoughts are simply too advanced for most meetings.", icon: 'Sparkles', color: '#8B5CF6', type: 'auto' },
    { slug: 'still-here', name: 'Still Here?', description: "16 of 18 subsections done. We see you. Please get some water.", icon: 'Heart', color: '#EC4899', type: 'auto' },

    // — Section-completion companion badges (funny counterparts) —
    { slug: 'are-you-a-robot', name: 'Are You a Robot?', description: "Completed all Agentic AI content. We're starting to wonder.", icon: 'Cpu', color: '#38BDF8', type: 'auto' },
    { slug: 'send-help', name: 'Send Help', description: "Completed all AI Security content. You now see threats everywhere. That's correct.", icon: 'Zap', color: '#EF4444', type: 'auto' },
    { slug: 'overachiever', name: 'The Overachiever', description: "Completed every single subsection. Absolute legend. No notes.", icon: 'Crown', color: '#F59E0B', type: 'auto' },
  ];

  for (const badge of seedBadges) {
    await db.execute({
      sql: `INSERT OR IGNORE INTO badge_definitions (slug, name, description, icon, color, type)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [badge.slug, badge.name, badge.description, badge.icon, badge.color, badge.type]
    });
  }
}

module.exports = { db, initDb };
