// referrals.js — shared referral helpers.
// A user's public referral code lives in users.referral_code (added by
// migrate.js). Old links that carry the raw user UUID (?ref=<uuid>) keep
// working too.
const db = require('./db');

// Share of a referred publisher's earnings paid to the referrer, for life.
// Change with REFERRAL_RATE_PERCENT (e.g. 5 or 10). Shown in the dashboard.
const REFERRAL_RATE_PERCENT = Number(process.env.REFERRAL_RATE_PERCENT) || 10;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns the referrer's user id for a code or UUID, or null. */
async function resolveReferrer(ref) {
  const value = String(ref || '').trim();
  if (!value || value.length > 64) return null;
  try {
    const { rows } = UUID_RE.test(value)
      ? await db.query('SELECT id FROM users WHERE id = $1 AND is_banned = FALSE', [value])
      : await db.query('SELECT id FROM users WHERE referral_code = $1 AND is_banned = FALSE', [value.toUpperCase()]);
    return rows[0]?.id || null;
  } catch {
    return null;
  }
}

module.exports = { REFERRAL_RATE_PERCENT, resolveReferrer };
