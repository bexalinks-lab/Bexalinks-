// redirect-engine.js
// The heart of Bexalink: resolves short codes, runs the 3-step interstitial
// funnel, records monetized views, and finally forwards the visitor to the
// real destination WITHOUT leaking a referrer.
//
// Flow:
//   GET /:code                -> step 1 (landing + countdown + banner ads)
//   GET /:code/verify          -> step 2 (Turnstile/reCAPTCHA challenge)
//   POST /:code/verify         -> validates challenge, issues a short-lived signed token
//   GET /:code/continue?t=...  -> step 3 ("Get Link" page), then real redirect

const express = require('express');
const crypto = require('crypto');
const db = require('./db');
const { getCachedLink, cacheLink, markUniqueView, isRateLimited } = require('./redis-client');
const { getCpmRateCents, perViewEarningsCents } = require('./geo-cpm');
const { evaluateClick } = require('./fraud-detection');
const { lookupIpIntel, lookupCountry } = require('./ip-intel'); // 3rd-party geo/VPN provider wrapper
const { verifyTurnstileToken } = require('./captcha');

const router = express.Router();

const TOKEN_SECRET = process.env.LINK_TOKEN_SECRET; // required, long random string
const TOKEN_TTL_SECONDS = 120; // step-2 -> step-3 token expiry

// ---- helpers -------------------------------------------------------------

function hashIp(ip) {
  const dailySalt = new Date().toISOString().slice(0, 10); // rotates daily
  return crypto.createHash('sha256').update(ip + dailySalt).digest('hex');
}

/** Signed, tamper-proof token proving step 2 was completed for this code+ip. */
function issueContinueToken(shortCode, ipHash) {
  const payload = { c: shortCode, ip: ipHash, exp: Date.now() + TOKEN_TTL_SECONDS * 1000 };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyContinueToken(token, shortCode, ipHash) {
  try {
    const [body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.c === shortCode && payload.ip === ipHash && payload.exp > Date.now();
  } catch {
    return false;
  }
}

async function resolveLink(shortCode) {
  let link = await getCachedLink(shortCode);
  if (link) return link;

  const { rows } = await db.query(
    `SELECT id, user_id, short_code, destination_url, status
     FROM links WHERE short_code = $1 OR custom_alias = $1 LIMIT 1`,
    [shortCode]
  );
  link = rows[0] || null;
  if (link) await cacheLink(shortCode, link);
  return link;
}

/** Records a view: fraud check, unique dedup, CPM earnings, async DB write. */
async function recordView({ link, ip, userAgent, referrer }) {
  const ipHash = hashIp(ip);
  const ipIntel = await lookupIpIntel(ip).catch(() => null);
  const country = ipIntel?.country_code || (await lookupCountry(ip).catch(() => null)) || 'ZZ';

  const { valid, reason } = evaluateClick({ userAgent, ip, ipIntel });
  const isUnique = valid ? await markUniqueView(ipHash, link.id) : false;

  let earningsCents = 0;
  if (valid && isUnique) {
    const cpm = await getCpmRateCents(country);
    earningsCents = perViewEarningsCents(cpm);
  }

  // Fire-and-forget write so it never blocks the redirect itself.
  db.query(
    `INSERT INTO clicks (link_id, ip_hash, country_code, is_unique, is_valid, fraud_reason,
                          user_agent, referrer, earnings_cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [link.id, ipHash, country, isUnique, valid, reason, userAgent, referrer, Math.round(earningsCents * 100)]
  ).catch((err) => console.error('[clicks insert] failed', err));

  if (!valid) {
    db.query(
      `INSERT INTO fraud_logs (link_id, user_id, ip_hash, reason, detail)
       VALUES ($1,$2,$3,$4,$5)`,
      [link.id, link.user_id, ipHash, reason, JSON.stringify({ userAgent })]
    ).catch(() => {});
  }

  return { ipHash, valid, isUnique, earningsCents };
}

// ---- STEP 1: landing page with countdown + banner ads --------------------

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const ip = req.ip;

  if (await isRateLimited(hashIp(ip))) {
    return res.status(429).send('Too many requests. Please slow down.');
  }

  const link = await resolveLink(code);
  if (!link || link.status !== 'active') {
    return res.status(404).render('link-not-found');
  }

  // Record the raw view/impression now (step 1 load = the monetized view).
  await recordView({ link, ip, userAgent: req.get('user-agent'), referrer: req.get('referer') });

  res.render('interstitial-step1', {
    shortCode: link.short_code,
    countdownSeconds: 10,
    adSlots: await getActiveAdSlots('step1_landing', req.geoCountry),
  });
});

// ---- STEP 2: verification (Turnstile / reCAPTCHA v3) ----------------------

router.get('/:code/verify', async (req, res) => {
  const { code } = req.params;
  const link = await resolveLink(code);
  if (!link) return res.status(404).render('link-not-found');

  res.render('interstitial-step2', {
    shortCode: link.short_code,
    turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
    adSlots: await getActiveAdSlots('step2_verify', req.geoCountry),
  });
});

router.post('/:code/verify', express.urlencoded({ extended: false }), async (req, res) => {
  const { code } = req.params;
  const { 'cf-turnstile-response': turnstileToken } = req.body;
  const ip = req.ip;

  const human = await verifyTurnstileToken(turnstileToken, ip);
  if (!human) {
    return res.status(400).render('interstitial-step2', {
      shortCode: code,
      error: 'Verification failed. Please try again.',
      turnstileSiteKey: process.env.TURNSTILE_SITE_KEY,
    });
  }

  const token = issueContinueToken(code, hashIp(ip));
  res.redirect(`/${code}/continue?t=${token}`);
});

// ---- STEP 3: "Get Link" reveal, then the real, referrer-safe redirect -----

router.get('/:code/continue', async (req, res) => {
  const { code } = req.params;
  const { t } = req.query;
  const ip = req.ip;

  if (!t || !verifyContinueToken(t, code, hashIp(ip))) {
    return res.status(403).render('link-expired', { retryUrl: `/${code}` });
  }

  const link = await resolveLink(code);
  if (!link) return res.status(404).render('link-not-found');

  // Render a page with a "Get Link" button. The button posts to /go so the
  // browser's Referer header on the FINAL hop is our own domain's blank page,
  // never the destination site seeing where the click funnel came from.
  res.render('interstitial-step3', {
    shortCode: link.short_code,
    goUrl: `/${code}/go?t=${t}`,
    adSlots: await getActiveAdSlots('step3_getlink', req.geoCountry),
  });
});

router.get('/:code/go', async (req, res) => {
  const { code } = req.params;
  const { t } = req.query;
  const ip = req.ip;

  if (!t || !verifyContinueToken(t, code, hashIp(ip))) {
    return res.status(403).render('link-expired', { retryUrl: `/${code}` });
  }

  const link = await resolveLink(code);
  if (!link) return res.status(404).render('link-not-found');

  // Strip referrer using a meta-refresh intermediary + Referrer-Policy header,
  // rather than a raw 302, so destination analytics never see Bexalink's URL.
  res.set('Referrer-Policy', 'no-referrer');
  res.render('referrer-strip-bounce', { destination: link.destination_url });
});

async function getActiveAdSlots(step, countryCode) {
  const { rows } = await db.query(
    `SELECT network, placement, script_code FROM ad_slots
     WHERE step = $1 AND is_active = TRUE
       AND (country_filter IS NULL OR $2 = ANY(country_filter))`,
    [step, countryCode || null]
  );
  return rows;
}

module.exports = router;
