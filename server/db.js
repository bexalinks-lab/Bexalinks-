// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/bexalink',
});

pool.on('error', (err) => console.error('[pg] unexpected error on idle client', err));

module.exports = pool;
