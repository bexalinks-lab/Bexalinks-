// geo-cpm.js
// Resolves a request's country (via IP geolocation) to a CPM rate in cents.
// In production swap the lookup() stub for MaxMind GeoLite2 / ipapi.

const db = require('./db'); // pg Pool, assumed configured elsewhere

let cpmCache = null;
let cpmCacheLoadedAt = 0;
const CPM_CACHE_TTL_MS = 60_000;

async function loadCpmTable() {
  const now = Date.now();
  if (cpmCache && now - cpmCacheLoadedAt < CPM_CACHE_TTL_MS) return cpmCache;

  const { rows } = await db.query('SELECT country_code, rate_cents FROM cpm_rates');
  cpmCache = Object.fromEntries(rows.map(r => [r.country_code, r.rate_cents]));
  cpmCacheLoadedAt = now;
  return cpmCache;
}

/** @param {string} countryCode ISO 3166-1 alpha-2, e.g. "US" */
async function getCpmRateCents(countryCode) {
  const table = await loadCpmTable();
  return table[countryCode] ?? table['ZZ'] ?? 150; // fallback to rest-of-world default
}

/** Cost of a single valid view, in cents, given a CPM rate. */
function perViewEarningsCents(cpmRateCents) {
  return cpmRateCents / 1000;
}

module.exports = { getCpmRateCents, perViewEarningsCents, loadCpmTable };
