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
    { slug: 'first-steps', name: 'First Steps', description: 'Completed your first subsection: What Are LLMs?', icon: 'Footprints', color: '#6B46C1', type: 'auto' },
    { slug: 'llm-master', name: 'LLM Master', description: 'Completed all LLM Basics subsections', icon: 'Brain', color: '#8B5CF6', type: 'auto' },
    { slug: 'agentic-thinker', name: 'Agentic Thinker', description: 'Completed the What Is Agentic AI? subsection', icon: 'Bot', color: '#38BDF8', type: 'auto' },
    { slug: 'agent-architect', name: 'Agent Architect', description: 'Completed all Agentic AI subsections', icon: 'Network', color: '#0EA5E9', type: 'auto' },
    { slug: 'security-sentinel', name: 'Security Sentinel', description: 'Completed all AI Security subsections', icon: 'Shield', color: '#10B981', type: 'auto' },
    { slug: 'full-stack', name: 'Full Stack', description: 'Completed all three sections of the course', icon: 'Trophy', color: '#F59E0B', type: 'auto' },
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
