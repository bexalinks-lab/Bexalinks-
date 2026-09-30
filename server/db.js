// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bexalink',
  // Fail with a clear error instead of waiting forever on an unreachable DB.
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => console.error('[pg] unexpected error on idle client', err));

module.exports = pool;
