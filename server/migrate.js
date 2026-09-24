// migrate.js
const fs = require('fs');
const path = require('path');
const db = require('./db');

async function runMigrations() {
  try {
    const check = await db.query(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables WHERE table_name = 'users'
       ) AS exists`
    );

    if (check.rows[0].exists) {
      console.log('[migrate] Schema already applied, skipping.');
    } else {
      console.log('[migrate] No tables found — applying schema.sql...');
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await db.query(schemaSql);
      console.log('[migrate] Schema applied successfully.');
    }
  } catch (err) {
    console.error('[migrate] Failed to apply schema:', err.message);
  }

  try {
    const { rows } = await db.query('SELECT id, email FROM users LIMIT 1');
    if (rows.length === 0) {
      const inserted = await db.query(
        `INSERT INTO users (email, role) VALUES ('you@test.com', 'publisher') RETURNING id, email`
      );
      console.log('=================================================');
      console.log('[migrate] Created default test user:');
      console.log(`  email:   ${inserted.rows[0].email}`);
      console.log(`  user id: ${inserted.rows[0].id}   <-- use this as x-user-id`);
      console.log('=================================================');
    } else {
      console.log(`[migrate] Users already exist (e.g. ${rows[0].email}), skipping test user creation.`);
    }
  } catch (err) {
    console.error('[migrate] Could not check/create default test user:', err.message);
  }

  // The dashboard's Payouts tab offers PayPal / Payoneer / Bank / USDT / UPI,
  // but the original payout_method enum only had 4 values with no
  // 'payoneer'. Add it if it's missing (safe to run every deploy).
  try {
    await db.query(`ALTER TYPE payout_method ADD VALUE IF NOT EXISTS 'payoneer'`);
  } catch (err) {
    console.error('[migrate] Could not add "payoneer" to payout_method enum:', err.message);
  }

  // Help Center: support tickets (safe to run every deploy).
  try {
    await db.query(`CREATE TABLE IF NOT EXISTS support_tickets (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      admin_reply TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
  } catch (err) {
    console.error('[migrate] Could not create support_tickets:', err.message);
  }
}

module.exports = { runMigrations };
