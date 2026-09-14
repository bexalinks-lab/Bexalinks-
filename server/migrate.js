// migrate.js
// Runs database/schema.sql automatically on server startup if the `users`
// table doesn't exist yet. This means you never need psql, a terminal, or a
// SQL editor to set up the database — just deploy, and the app creates its
// own tables on first boot.

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
      return;
    }

    console.log('[migrate] No tables found — applying schema.sql...');
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await db.query(schemaSql);
    console.log('[migrate] Schema applied successfully.');
  } catch (err) {
    console.error('[migrate] Failed to apply schema:', err.message);
  }
}

module.exports = { runMigrations };
