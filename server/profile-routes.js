// profile-routes.js — user profile, saved payment accounts and referrals.
// Mounted at /api in app.js (all routes require a logged-in user).
//
//   GET    /api/profile                    full profile + account stats
//   PUT    /api/profile                    update name / phone / billing address
//   GET    /api/payment-methods            saved payout accounts (masked)
//   POST   /api/payment-methods            { method, account, network?, fullName?, makePrimary? }
//   POST   /api/payment-methods/:id/primary
//   DELETE /api/payment-methods/:id
//   GET    /api/dashboard/referrals        referral code, stats, referred users

const express = require('express');
const db = require('./db');
const { requireAuth } = require('./auth-middleware');
const { REFERRAL_RATE_PERCENT } = require('./referrals');

const router = express.Router();

// Express 4 doesn't catch rejected promises — this keeps a DB hiccup from
// hanging the request.
const wrap = (fn) => (req, res) =>
  fn(req, res).catch((err) => {
    console.error(`[${req.method} ${req.originalUrl}]`, err);
    if (!res.headersSent) res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

const clean = (v, max) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().slice(0, max);
  return s || null;
};

// ───────────────────────── profile ─────────────────────────
router.get('/profile', requireAuth, wrap(async (req, res) => {
  const userId = req.user.id;
  const [u, p, links, refs] = await Promise.all([
    db.query(
      `SELECT id, email, display_name, avatar_url, role, referral_code, created_at,
              (password_hash IS NOT NULL) AS has_password, (google_id IS NOT NULL) AS has_google
       FROM users WHERE id = $1`, [userId]),
    db.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]),
    db.query(`SELECT COUNT(*)::int AS n, COALESCE(SUM(total_views),0)::bigint AS views
              FROM links WHERE user_id = $1`, [userId]),
    db.query('SELECT COUNT(*)::int AS n FROM users WHERE referred_by = $1', [userId]),
  ]);
  const user = u.rows[0];
  const prof = p.rows[0] || {};
  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      referralCode: user.referral_code,
      memberSince: user.created_at,
      hasPassword: user.has_password,
      hasGoogle: user.has_google,
    },
    profile: {
      firstName: prof.first_name || '', lastName: prof.last_name || '', phone: prof.phone || '',
      address1: prof.address1 || '', address2: prof.address2 || '', city: prof.city || '',
      state: prof.state || '', zip: prof.zip || '', country: prof.country || '',
    },
    stats: { totalLinks: links.rows[0].n, totalViews: Number(links.rows[0].views), referrals: refs.rows[0].n },
  });
}));

router.put('/profile', requireAuth, wrap(async (req, res) => {
  const b = req.body || {};
  const f = {
    first_name: clean(b.firstName, 80), last_name: clean(b.lastName, 80),
    phone: clean(b.phone, 24), address1: clean(b.address1, 160), address2: clean(b.address2, 160),
    city: clean(b.city, 80), state: clean(b.state, 80), zip: clean(b.zip, 16), country: clean(b.country, 80),
  };
  if (f.phone && !/^[+\d\s()-]{6,24}$/.test(f.phone)) {
    return res.status(400).json({ error: 'Enter a valid phone number.' });
  }
  if (f.zip && !/^[A-Za-z0-9 -]{3,16}$/.test(f.zip)) {
    return res.status(400).json({ error: 'Enter a valid ZIP / postal code.' });
  }

  await db.query(
    `INSERT INTO user_profiles (user_id, first_name, last_name, phone, address1, address2, city, state, zip, country)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (user_id) DO UPDATE SET
       first_name=EXCLUDED.first_name, last_name=EXCLUDED.last_name, phone=EXCLUDED.phone,
       address1=EXCLUDED.address1, address2=EXCLUDED.address2, city=EXCLUDED.city,
       state=EXCLUDED.state, zip=EXCLUDED.zip, country=EXCLUDED.country, updated_at=now()`,
    [req.user.id, f.first_name, f.last_name, f.phone, f.address1, f.address2, f.city, f.state, f.zip, f.country]
  );

  // Display name: what the user typed, else "First Last".
  const displayName = clean(b.displayName, 120) || [f.first_name, f.last_name].filter(Boolean).join(' ') || null;
  await db.query('UPDATE users SET display_name = $1, updated_at = now() WHERE id = $2', [displayName, req.user.id]);

  res.json({ success: true });
}));

// ───────────────────────── payment accounts ─────────────────────────
const METHOD_TO_DB = { paypal: 'paypal', payoneer: 'payoneer', bank: 'bank_transfer', usdt: 'crypto', upi: 'upi' };
const METHOD_FROM_DB = { paypal: 'paypal', payoneer: 'payoneer', bank_transfer: 'bank', crypto: 'usdt', upi: 'upi' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Returns an error string, or null when the account details look valid.
function validateAccount(method, account, network) {
  switch (method) {
    case 'paypal':
    case 'payoneer': return EMAIL_RE.test(account) ? null : `Enter a valid ${method === 'paypal' ? 'PayPal' : 'Payoneer'} email.`;
    case 'upi': return /^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(account) ? null : 'Enter a valid UPI ID, e.g. name@bank.';
    case 'bank': return account.length >= 15 ? null : 'Add the account holder, bank, account number and IFSC / SWIFT.';
    case 'usdt':
      if (!['TRC20', 'ERC20', 'BEP20'].includes(network)) return 'Choose a USDT network.';
      if (network === 'TRC20') return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(account) ? null : 'A TRC20 address starts with T and is 34 characters long.';
      return /^0x[a-fA-F0-9]{40}$/.test(account) ? null : `A ${network} address starts with 0x and is 42 characters long.`;
    default: return 'Unknown payout method.';
  }
}

// Never send a full bank/wallet/UPI number back to the browser after saving.
function maskAccount(method, account = '') {
  const a = String(account);
  if (method === 'paypal' || method === 'payoneer') {
    const [local, domain] = a.split('@');
    return domain ? `${local.slice(0, 2)}${'•'.repeat(Math.max(2, local.length - 2))}@${domain}` : a;
  }
  if (method === 'upi') {
    const [local, handle] = a.split('@');
    return handle ? `${local.slice(0, 2)}${'•'.repeat(Math.max(2, local.length - 2))}@${handle}` : a;
  }
  if (method === 'usdt') return a.length > 10 ? `${a.slice(0, 5)}…${a.slice(-5)}` : a;
  // bank: free-text, so only reveal the tail
  const digits = a.replace(/\D/g, '');
  return digits.length >= 4 ? `Account ending ${digits.slice(-4)}` : 'Bank account saved';
}

const shapeMethod = (r) => {
  const method = METHOD_FROM_DB[r.method] || r.method;
  return {
    id: r.id,
    method,
    network: r.details?.network || null,
    fullName: r.details?.fullName || null,
    maskedAccount: maskAccount(method, r.details?.account),
    isPrimary: r.is_default,
    created_at: r.created_at,
  };
};

router.get('/payment-methods', requireAuth, wrap(async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, method, details, is_default, created_at FROM payment_methods
     WHERE user_id = $1 AND archived_at IS NULL
     ORDER BY is_default DESC, created_at DESC`,
    [req.user.id]
  );
  res.json({ methods: rows.map(shapeMethod) });
}));

router.post('/payment-methods', requireAuth, wrap(async (req, res) => {
  const { method, network, fullName } = req.body || {};
  const account = String(req.body?.account || '').trim();
  if (!METHOD_TO_DB[method]) return res.status(400).json({ error: 'Unknown payout method.' });
  const problem = validateAccount(method, account, network);
  if (problem) return res.status(400).json({ error: problem });

  const userId = req.user.id;
  const details = {
    account,
    ...(method === 'usdt' ? { network } : {}),
    ...(clean(fullName, 120) ? { fullName: clean(fullName, 120) } : {}),
  };

  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows: existing } = await client.query(
      `SELECT count(*)::int AS n,
              bool_or(details->>'account' = $3 AND method = $2) AS dup
       FROM payment_methods WHERE user_id = $1 AND archived_at IS NULL`,
      [userId, METHOD_TO_DB[method], account]
    );
    if (existing[0].dup) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You have already saved this account.' });
    }
    if (existing[0].n >= 10) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You can save up to 10 payment accounts. Remove one first.' });
    }
    // First account is primary automatically; otherwise only if asked.
    const makePrimary = existing[0].n === 0 || req.body?.makePrimary === true;
    if (makePrimary) await client.query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [userId]);
    const { rows } = await client.query(
      `INSERT INTO payment_methods (user_id, method, details, is_default)
       VALUES ($1, $2, $3::jsonb, $4)
       RETURNING id, method, details, is_default, created_at`,
      [userId, METHOD_TO_DB[method], JSON.stringify(details), makePrimary]
    );
    await client.query('COMMIT');
    res.status(201).json(shapeMethod(rows[0]));
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

router.post('/payment-methods/:id/primary', requireAuth, wrap(async (req, res) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2 AND archived_at IS NULL',
      [req.params.id, req.user.id]
    ).catch(() => ({ rows: [] })); // malformed uuid -> not found
    if (!rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Payment account not found.' });
    }
    await client.query('UPDATE payment_methods SET is_default = FALSE WHERE user_id = $1', [req.user.id]);
    await client.query('UPDATE payment_methods SET is_default = TRUE WHERE id = $1', [req.params.id]);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}));

router.delete('/payment-methods/:id', requireAuth, wrap(async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  try {
    const del = await db.query('DELETE FROM payment_methods WHERE id = $1 AND user_id = $2', [id, userId]);
    if (!del.rowCount) return res.status(404).json({ error: 'Payment account not found.' });
  } catch (err) {
    if (err.code === '22P02') return res.status(404).json({ error: 'Payment account not found.' });
    if (err.code !== '23503') throw err;
    // Has payouts attached: keep the row for the payout history, hide it.
    await db.query(
      'UPDATE payment_methods SET archived_at = now(), is_default = FALSE WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
  }
  res.json({ success: true });
}));

// ───────────────────────── referrals ─────────────────────────
function maskEmail(email = '') {
  const [local, domain] = String(email).split('@');
  if (!domain) return '—';
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(4, local.length - 2)))}@${domain}`;
}

router.get('/dashboard/referrals', requireAuth, wrap(async (req, res) => {
  const userId = req.user.id;
  const [me, list, total, last30] = await Promise.all([
    db.query('SELECT referral_code FROM users WHERE id = $1', [userId]),
    db.query(
      `SELECT u.id, u.display_name, u.email, u.created_at,
              COALESCE((SELECT SUM(commission_cents) FROM referral_earnings re
                        WHERE re.referrer_id = $1 AND re.referred_user_id = u.id), 0)::bigint AS commission_cents
       FROM users u WHERE u.referred_by = $1
       ORDER BY u.created_at DESC LIMIT 100`, [userId]),
    db.query('SELECT COUNT(*)::int AS n FROM users WHERE referred_by = $1', [userId]),
    db.query(
      `SELECT COALESCE(SUM(commission_cents),0)::bigint AS c FROM referral_earnings
       WHERE referrer_id = $1 AND day >= CURRENT_DATE - 29`, [userId]),
  ]);

  res.json({
    referralCode: me.rows[0]?.referral_code || null,
    ratePercent: REFERRAL_RATE_PERCENT,
    count: total.rows[0].n,
    last30Days: Number(last30.rows[0].c) / 100,
    referrals: list.rows.map((r) => ({
      id: r.id,
      // Referred users' privacy: show their first name only, never full email.
      name: r.display_name ? r.display_name.split(' ')[0] : null,
      email: maskEmail(r.email),
      joined_at: r.created_at,
      earned: Number(r.commission_cents) / 100,
    })),
  });
}));

module.exports = router;
