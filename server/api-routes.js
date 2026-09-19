// api-routes.js
// JSON API consumed by the Next.js dashboard and by third-party tools
// (Telegram bots, browser scripts) via API tokens.

const express = require('express');
const crypto = require('crypto');
const { nanoid } = require('nanoid');
const db = require('./db');
const { requireAuth, requireAdmin, requireApiToken } = require('./auth-middleware');
const { invalidateLinkCache } = require('./redis-client');

const router = express.Router();

// ---- LINK SHORTENING -------------------------------------------------------

async function createShortLink({ userId, destinationUrl, customAlias, title }) {
  const shortCode = customAlias || nanoid(7);

  const { rows } = await db.query(
    `INSERT INTO links (user_id, short_code, custom_alias, destination_url, title)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, short_code, custom_alias, destination_url, title, created_at`,
    [userId, customAlias ? null : shortCode, customAlias || null, destinationUrl, title || null]
  );
  return rows[0];
}

// Dashboard / logged-in user shortening
router.post('/links', requireAuth, async (req, res) => {
  const { destinationUrl, customAlias, title } = req.body;
  if (!destinationUrl || !/^https?:\/\//i.test(destinationUrl)) {
    return res.status(400).json({ error: 'A valid destination_url is required.' });
  }
  try {
    const link = await createShortLink({ userId: req.user.id, destinationUrl, customAlias, title });
    res.status(201).json({ shortUrl: `${process.env.PUBLIC_BASE_URL}/${link.short_code || link.custom_alias}`, link });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'That alias is already taken.' });
    console.error(err);
    res.status(500).json({ error: 'Could not create link.' });
  }
});

// API-token shortening for bots/scripts: Authorization: Bearer <token>
router.post('/v1/shorten', requireApiToken, async (req, res) => {
  const { url, alias } = req.body;
  if (!url) return res.status(400).json({ error: 'url is required' });
  const link = await createShortLink({ userId: req.apiUser.id, destinationUrl: url, customAlias: alias });
  res.status(201).json({ short_url: `${process.env.PUBLIC_BASE_URL}/${link.short_code || link.custom_alias}` });
});

router.patch('/links/:id', requireAuth, async (req, res) => {
  const { destinationUrl, title, status } = req.body;
  const { rows } = await db.query(
    `UPDATE links SET
        destination_url = COALESCE($1, destination_url),
        title           = COALESCE($2, title),
        status          = COALESCE($3, status),
        updated_at      = now()
     WHERE id = $4 AND user_id = $5
     RETURNING short_code, custom_alias`,
    [destinationUrl, title, status, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Link not found.' });
  await invalidateLinkCache(rows[0].short_code || rows[0].custom_alias);
  res.json({ success: true });
});

// ---- DASHBOARD STATS --------------------------------------------------------

router.get('/dashboard/summary', requireAuth, async (req, res) => {
  const userId = req.user.id;

  const [todayRow, allTimeRow, referralRow, pendingPayout] = await Promise.all([
    db.query(
      `SELECT COALESCE(SUM(views),0) AS views, COALESCE(SUM(earnings_cents),0) AS earnings_cents
       FROM daily_earnings WHERE user_id = $1 AND day = CURRENT_DATE`, [userId]
    ),
    db.query(
      `SELECT COALESCE(SUM(views),0) AS views, COALESCE(SUM(earnings_cents),0) AS earnings_cents,
              COALESCE(AVG(NULLIF(avg_cpm_cents,0)),0) AS avg_cpm_cents
       FROM daily_earnings WHERE user_id = $1`, [userId]
    ),
    db.query(
      `SELECT COALESCE(SUM(commission_cents),0) AS commission_cents
       FROM referral_earnings WHERE referrer_id = $1`, [userId]
    ),
    db.query(
      `SELECT COALESCE(SUM(earnings_cents),0) AS unpaid_cents
       FROM daily_earnings de
       WHERE de.user_id = $1
         AND NOT EXISTS (SELECT 1 FROM payouts p WHERE p.user_id = $1 AND p.status = 'paid')`,
      [userId]
    ),
  ]);

  res.json({
    today: { views: Number(todayRow.rows[0].views), earnings: todayRow.rows[0].earnings_cents / 100 },
    allTime: {
      views: Number(allTimeRow.rows[0].views),
      earnings: allTimeRow.rows[0].earnings_cents / 100,
      avgCpm: allTimeRow.rows[0].avg_cpm_cents / 100,
    },
    referralEarnings: referralRow.rows[0].commission_cents / 100,
    availableBalance: pendingPayout.rows[0].unpaid_cents / 100,
  });
});

router.get('/dashboard/links', requireAuth, async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, short_code, custom_alias, destination_url, title, status,
            total_views, total_earnings_cents, created_at
     FROM links WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
    [req.user.id]
  );
  res.json(rows.map(r => ({ ...r, total_earnings: r.total_earnings_cents / 100 })));
});

// ---- PAYOUTS -----------------------------------------------------------------

router.post('/payouts', requireAuth, async (req, res) => {
  const { amountCents, paymentMethodId } = req.body;
  const MIN_PAYOUT_CENTS = 500;
  if (amountCents < MIN_PAYOUT_CENTS) {
    return res.status(400).json({ error: 'Minimum payout is $5.00.' });
  }
  const { rows } = await db.query(
    `INSERT INTO payouts (user_id, payment_method_id, amount_cents)
     VALUES ($1, $2, $3) RETURNING id, status, requested_at`,
    [req.user.id, paymentMethodId, amountCents]
  );
  res.status(201).json(rows[0]);
});

// ---- ADMIN -------------------------------------------------------------------

router.put('/admin/cpm/:countryCode', requireAdmin, async (req, res) => {
  const { rateCents } = req.body;
  await db.query(
    `UPDATE cpm_rates SET rate_cents = $1, updated_by = $2, updated_at = now() WHERE country_code = $3`,
    [rateCents, req.user.id, req.params.countryCode.toUpperCase()]
  );
  res.json({ success: true });
});

router.post('/admin/users/:id/ban', requireAdmin, async (req, res) => {
  await db.query(`UPDATE users SET is_banned = TRUE, ban_reason = $1 WHERE id = $2`,
    [req.body.reason || null, req.params.id]);
  await db.query(
    `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, detail)
     VALUES ($1, 'ban_user', 'user', $2, $3)`,
    [req.user.id, req.params.id, JSON.stringify({ reason: req.body.reason })]
  );
  res.json({ success: true });
});

router.post('/admin/payouts/:id/approve', requireAdmin, async (req, res) => {
  const { rows } = await db.query(
    `UPDATE payouts SET status = 'approved', processed_by = $1, processed_at = now()
     WHERE id = $2 RETURNING *`, [req.user.id, req.params.id]
  );
  res.json(rows[0]);
});

// ---- AD SLOTS ------------------------------------------------------------
// Manage the ad units shown on the interstitial ("please wait" / "verify" /
// "get link") pages (see server/redirect-engine.js -> getActiveAdSlots and
// server/views/interstitial-step*.ejs). `step` must be one of
// 'step1_landing', 'step2_verify', 'step3_getlink'; `placement` is whatever
// the template looks for (e.g. 'banner_top', 'banner_bottom').

const VALID_STEPS = ['step1_landing', 'step2_verify', 'step3_getlink'];

router.get('/admin/ad-slots', requireAdmin, async (req, res) => {
  const { rows } = await db.query('SELECT * FROM ad_slots ORDER BY step, placement, id');
  res.json({ adSlots: rows });
});

router.post('/admin/ad-slots', requireAdmin, async (req, res) => {
  const { network, step, placement, scriptCode, countryFilter } = req.body || {};
  if (!network || !placement || !scriptCode) {
    return res.status(400).json({ error: 'network, placement and scriptCode are required.' });
  }
  if (!VALID_STEPS.includes(step)) {
    return res.status(400).json({ error: `step must be one of: ${VALID_STEPS.join(', ')}` });
  }
  const { rows } = await db.query(
    `INSERT INTO ad_slots (network, step, placement, script_code, country_filter)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [network, step, placement, scriptCode, countryFilter && countryFilter.length ? countryFilter : null]
  );
  res.status(201).json(rows[0]);
});

router.put('/admin/ad-slots/:id', requireAdmin, async (req, res) => {
  const { network, step, placement, scriptCode, isActive, countryFilter } = req.body || {};
  if (step && !VALID_STEPS.includes(step)) {
    return res.status(400).json({ error: `step must be one of: ${VALID_STEPS.join(', ')}` });
  }
  const { rows } = await db.query(
    `UPDATE ad_slots SET
       network = COALESCE($1, network),
       step = COALESCE($2, step),
       placement = COALESCE($3, placement),
       script_code = COALESCE($4, script_code),
       is_active = COALESCE($5, is_active),
       country_filter = COALESCE($6, country_filter)
     WHERE id = $7 RETURNING *`,
    [network, step, placement, scriptCode, isActive, countryFilter, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Ad slot not found.' });
  res.json(rows[0]);
});

router.delete('/admin/ad-slots/:id', requireAdmin, async (req, res) => {
  await db.query('DELETE FROM ad_slots WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
