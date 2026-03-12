#!/usr/bin/env node
/**
 * Create or promote an admin user in the Turso database.
 *
 * Usage:
 *   node scripts/create-admin.js --email admin@company.com --name "Jane Admin"
 *
 * If the user already exists, they are promoted to admin.
 * Login is via magic link — no password required.
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env (or environment).
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { db, initDb } = require('../server/db');

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

async function main() {
  await initDb();

  const normalEmail = email.toLowerCase().trim();
  const existing = await db.execute({
    sql: 'SELECT id, role FROM users WHERE email = ?',
    args: [normalEmail]
  });
  const user = existing.rows[0];

  if (user) {
    if (user.role === 'admin') {
      console.log(`User ${normalEmail} is already an admin.`);
    } else {
      await db.execute({
        sql: 'UPDATE users SET role = ? WHERE id = ?',
        args: ['admin', user.id]
      });
      console.log(`Promoted ${normalEmail} to admin.`);
    }
  } else {
    const result = await db.execute({
      sql: 'INSERT INTO users (email, name, role) VALUES (?, ?, ?)',
      args: [normalEmail, name, 'admin']
    });
    console.log(`\nAdmin user created!`);
    console.log(`  Name:  ${name}`);
    console.log(`  Email: ${normalEmail}`);
    console.log(`  ID:    ${result.lastInsertRowid}`);
    console.log(`\nLog in via magic link at the application URL.\n`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
