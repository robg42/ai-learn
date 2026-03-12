#!/usr/bin/env node
/**
 * Create or promote an admin user directly in the SQLite database.
 *
 * Usage:
 *   node scripts/create-admin.js --email admin@company.com --name "Jane Admin"
 *
 * If the user already exists, they are promoted to admin.
 * Login is via magic link — no password required.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const get = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const email = get('--email');
const name = get('--name');

if (!email || !name) {
  console.error('Usage: node create-admin.js --email <email> --name "<name>"');
  process.exit(1);
}

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'ai-learn.db');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Init schema
require('../server/db');

const db = new Database(dbPath);

const existing = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email.toLowerCase());

if (existing) {
  if (existing.role === 'admin') {
    console.log(`User ${email} is already an admin.`);
  } else {
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', existing.id);
    console.log(`Promoted ${email} to admin.`);
  }
} else {
  const result = db.prepare(
    'INSERT INTO users (email, name, role) VALUES (?, ?, ?)'
  ).run(email.toLowerCase(), name, 'admin');

  console.log(`\nAdmin user created!`);
  console.log(`  Name:  ${name}`);
  console.log(`  Email: ${email}`);
  console.log(`  ID:    ${result.lastInsertRowid}`);
  console.log(`\nLog in via magic link at the application URL.\n`);
}
