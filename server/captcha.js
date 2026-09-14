// captcha.js
// STUB for local testing: always passes so you can click through the funnel
// without a real Cloudflare Turnstile site key. Swap in the real siteverify
// call before production.

async function verifyTurnstileToken(token, ip) {
  if (process.env.TURNSTILE_SECRET_KEY) {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
    });
    const data = await res.json();
    return data.success === true;
  }
  console.warn('[captcha] TURNSTILE_SECRET_KEY not set — auto-passing for local testing.');
  return true;
}

module.exports = { verifyTurnstileToken };
