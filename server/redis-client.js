// redis-client.js
// Centralized Redis connection + cache helpers for the redirection hot path.
// Every redirect must avoid a Postgres round-trip on the common case, so
// link lookups and per-IP dedup windows live here.

const { createClient } = require('redis');

const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redis.on('error', (err) => console.error('[redis] connection error', err));
redis.connect();

const LINK_CACHE_TTL_SECONDS = 300;       // link metadata cache
const UNIQUE_VIEW_WINDOW_SECONDS = 86400; // 24h dedup window per IP+link
const RATE_LIMIT_WINDOW_SECONDS = 60;     // abuse throttle window

/** Cache a resolved link so redirects skip Postgres. */
async function cacheLink(shortCode, linkRow) {
  await redis.set(`link:${shortCode}`, JSON.stringify(linkRow), { EX: LINK_CACHE_TTL_SECONDS });
}

async function getCachedLink(shortCode) {
  const raw = await redis.get(`link:${shortCode}`);
  return raw ? JSON.parse(raw) : null;
}

async function invalidateLinkCache(shortCode) {
  await redis.del(`link:${shortCode}`);
}

/**
 * Returns true if this ip+link pair has NOT been seen in the last 24h,
 * and marks it as seen atomically (SET NX). Used to decide is_unique.
 */
async function markUniqueView(ipHash, linkId) {
  const key = `uniq:${linkId}:${ipHash}`;
  const result = await redis.set(key, '1', { NX: true, EX: UNIQUE_VIEW_WINDOW_SECONDS });
  return result === 'OK'; // OK = key was new = this IS a unique view
}

/**
 * Basic per-IP request throttle to blunt scripted abuse.
 * Returns true if the request should be blocked.
 */
async function isRateLimited(ipHash, maxRequests = 30) {
  const key = `rl:${ipHash}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, RATE_LIMIT_WINDOW_SECONDS);
  return count > maxRequests;
}

module.exports = {
  redis,
  cacheLink,
  getCachedLink,
  invalidateLinkCache,
  markUniqueView,
  isRateLimited,
};
