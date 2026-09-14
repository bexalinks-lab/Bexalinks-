// ip-intel.js
// STUB for local testing. Swap the body of lookupIpIntel() for a real call to
// IPQualityScore / IPHub / MaxMind GeoIP2 before going to production — right
// now it always reports "clean" traffic from the US so you can test the
// funnel end-to-end without a paid API key.

async function lookupIpIntel(ip) {
  if (ip === '::1' || ip === '127.0.0.1') {
    return { country_code: 'US', is_vpn: false, is_proxy: false, is_tor: false, is_datacenter: false, fraud_score: 0, isp: 'localhost' };
  }
  // TODO: replace with e.g.
  // const res = await fetch(`https://ipqualityscore.com/api/json/ip/${API_KEY}/${ip}`);
  // return await res.json();
  return { country_code: 'US', is_vpn: false, is_proxy: false, is_tor: false, is_datacenter: false, fraud_score: 0, isp: 'unknown' };
}

async function lookupCountry(ip) {
  const intel = await lookupIpIntel(ip);
  return intel.country_code;
}

module.exports = { lookupIpIntel, lookupCountry };
