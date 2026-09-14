// auth-middleware.js
// TEST-MODE auth. This trusts an `x-user-id` header / cookie so you can
// exercise the API locally without wiring real login yet. Replace the body
// of requireAuth/requireAdmin with your real session/JWT check before going
// anywhere near production.

const crypto = require('crypto');
const db = require('./db');

async function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'] || req.cookies?.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated. Send an x-user-id header for local testing.' });
  const { rows } = await db.query('SELECT id, role, is_banned FROM users WHERE id = $1', [userId]);
  if (!rows[0] || rows[0].is_banned) return res.status(401).json({ error: 'Invalid or banned user.' });
  req.user = rows[0];
  next();
}

async function requireAdmin(req, res, next) {
  await requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
    next();
  });
}

async function requireApiToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Bearer token.' });

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const { rows } = await db.query(
    `SELECT u.id, u.is_banned FROM api_tokens t
     JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = $1 AND t.revoked_at IS NULL`,
    [tokenHash]
  );
  if (!rows[0] || rows[0].is_banned) return res.status(401).json({ error: 'Invalid API token.' });
  req.apiUser = rows[0];
  db.query('UPDATE api_tokens SET last_used_at = now() WHERE token_hash = $1', [tokenHash]).catch(() => {});
  next();
}

module.exports = { requireAuth, requireAdmin, requireApiToken };
