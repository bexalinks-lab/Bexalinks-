// fraud-detection.js
// Lightweight, fast checks that run on every redirect request. These are
// intentionally cheap (no ML) so they don't add latency to the hot path.
// A slower, async "second opinion" job can re-score clicks in the background.

const BOT_UA_PATTERNS = [
  /bot/i, /crawl/i, /spider/i, /headless/i, /phantomjs/i,
  /curl\//i, /wget/i, /python-requests/i, /axios/i, /go-http-client/i,
];

const DATACENTER_ASN_HINTS = ['amazon', 'google cloud', 'digitalocean', 'ovh', 'hetzner', 'linode', 'azure'];

/**
 * @param {object} ctx
 * @param {string} ctx.userAgent
 * @param {string} ctx.ip
 * @param {object} [ctx.ipIntel] - result from a VPN/proxy lookup provider (IPQualityScore, IPHub, etc.)
 * @returns {{ valid: boolean, reason: string|null }}
 */
function evaluateClick(ctx) {
  const { userAgent = '', ipIntel } = ctx;

  if (!userAgent || BOT_UA_PATTERNS.some((p) => p.test(userAgent))) {
    return { valid: false, reason: 'bot_ua' };
  }

  if (ipIntel) {
    if (ipIntel.is_vpn || ipIntel.is_tor) {
      return { valid: false, reason: 'vpn' };
    }
    if (ipIntel.is_proxy) {
      return { valid: false, reason: 'proxy' };
    }
    if (ipIntel.is_datacenter || DATACENTER_ASN_HINTS.some((h) =>
      (ipIntel.isp || '').toLowerCase().includes(h))) {
      return { valid: false, reason: 'datacenter_ip' };
    }
    if (typeof ipIntel.fraud_score === 'number' && ipIntel.fraud_score >= 85) {
      return { valid: false, reason: 'high_fraud_score' };
    }
  }

  return { valid: true, reason: null };
}

module.exports = { evaluateClick };
