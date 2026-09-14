# Bexalink

A URL shortener + CPM monetization platform (GPLinks-style): publishers shorten
links, visitors pass through a 3-step ad-supported interstitial, and publishers
earn per 1,000 valid views.

## Structure

```
bexalink/
├── database/
│   └── schema.sql          # Full Postgres schema (users, links, clicks, payouts, referrals, ads, fraud logs)
├── server/
│   ├── redirect-engine.js  # Core 3-step interstitial + referrer-safe final redirect
│   ├── redis-client.js     # Link cache, 24h unique-view dedup, rate limiting
│   ├── geo-cpm.js          # Country -> CPM rate resolution (cached)
│   ├── fraud-detection.js  # Bot UA / VPN / proxy / datacenter checks
│   ├── api-routes.js       # Shortening, dashboard stats, payouts, admin endpoints
│   └── views/              # EJS templates for the 3 interstitial steps
└── frontend/
    └── Dashboard.jsx        # Next.js + Tailwind publisher dashboard
```

## Redirection flow

```
/:code            Step 1 — landing + banner ad slots + 10s countdown
                    └─ records the monetized view (unique/valid check, CPM credit)
/:code/verify     Step 2 — Cloudflare Turnstile / reCAPTCHA v3
                    └─ on success, issues a short-lived signed token (HMAC, 2 min TTL)
/:code/continue   Step 3 — "Get Link" reveal page
/:code/go         Final hop — Referrer-Policy: no-referrer + client-side bounce,
                    so the destination site never sees Bexalink as the referrer
```

Each hop re-validates the signed token against the code + hashed IP, so the
funnel can't be skipped by requesting `/go` directly.

## Anti-fraud approach

- **Unique views**: `markUniqueView()` in Redis — one credited view per
  IP+link per 24h (`SET NX EX 86400`).
- **Bot/VPN/proxy filtering**: `fraud-detection.js` checks user-agent
  signatures plus a pluggable IP-intelligence provider (`ip-intel.js`,
  wire up IPQualityScore/IPHub/MaxMind here) for VPN, Tor, proxy, and
  datacenter ASN flags.
- **Rate limiting**: per-IP request throttle in Redis blunts scripted abuse
  before it reaches Postgres.
- Every rejected click is written to `fraud_logs` for admin review, and every
  click (valid or not) lands in the partitioned `clicks` table for auditing.

## Earnings pipeline

Raw events go into `clicks` in real time; a scheduled job (cron / worker)
rolls them up into `daily_earnings` per user/link/day, which is what the
dashboard reads for fast aggregate stats. `referral_earnings` records the 10%
lifetime commission whenever a referred user's daily rollup is written.

## Run it locally and test the funnel

**Prerequisites:** Node.js 18+, PostgreSQL, Redis (install locally, or via
Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres` and
`docker run -p 6379:6379 redis`).

1. **Install deps**
   ```
   npm install
   ```
2. **Set up the database**
   ```
   createdb bexalink
   psql bexalink < database/schema.sql
   ```
3. **Configure environment**
   ```
   cp .env.example .env
   ```
   (defaults work out of the box for local Postgres/Redis; leave the
   Turnstile keys blank — the captcha and IP-intel stubs auto-pass locally.)
4. **Create a test user** (no signup UI yet, so insert one directly):
   ```
   psql bexalink -c "INSERT INTO users (email, role) VALUES ('you@test.com','publisher') RETURNING id;"
   ```
   Copy the returned `id` — you'll use it as the `x-user-id` header below.
5. **Start the server**
   ```
   npm run dev
   ```
   You should see `Bexalink running at http://localhost:3000`.
6. **Create a short link** (replace `<USER_ID>`):
   ```
   curl -X POST http://localhost:3000/api/links \
     -H "Content-Type: application/json" \
     -H "x-user-id: <USER_ID>" \
     -d '{"destinationUrl":"https://example.com"}'
   ```
   This returns `{ "shortUrl": "http://localhost:3000/aB3xQ1", ... }`.
7. **Test the funnel in your browser**: open that `shortUrl`. You should see
   Step 1 (countdown) → auto-advance to Step 2 (verify, auto-passes since no
   Turnstile key is set) → Step 3 ("Get Link") → final redirect to
   `example.com`.
8. **Check it recorded a view**:
   ```
   psql bexalink -c "SELECT * FROM clicks ORDER BY created_at DESC LIMIT 5;"
   ```
9. **Check dashboard stats** (earnings won't show until the daily rollup job
   runs — for a quick manual test, insert a row into `daily_earnings`
   yourself, or write the small cron job mentioned below):
   ```
   curl http://localhost:3000/api/dashboard/summary -H "x-user-id: <USER_ID>"
   curl http://localhost:3000/api/dashboard/links -H "x-user-id: <USER_ID>"
   ```

**Note on the dashboard UI (`frontend/Dashboard.jsx`)**: this is a Next.js
component, not a standalone server — it needs to be dropped into a Next.js
app (`npx create-next-app` with Tailwind + `recharts` + `lucide-react`
installed) that proxies `/api/*` to this Express server, or you point its
`fetch()` calls at `http://localhost:3000/api/...` directly.

## What's stubbed vs. real code

This delivers real, wireable logic for schema, redirection, fraud checks, and
the dashboard UI. Three integration points are left as thin wrapper modules
you fill in with your chosen vendor:

- `server/ip-intel.js` — call your VPN/proxy detection + geo-IP provider
- `server/captcha.js` — call Cloudflare Turnstile's siteverify endpoint
- `server/db.js` — a standard `pg` Pool, and `server/auth-middleware.js` — your
  session/JWT + API-token auth guards

## Next steps to go to production

1. Wire the three stub modules above to real providers.
2. Add a worker (BullMQ, etc.) for the `clicks` -> `daily_earnings` rollup and
   for payout batch processing.
3. Put the redirect engine behind a CDN/edge cache for the link-resolution
   hot path, and run Postgres reads on a replica for the dashboard.
4. Add rate-limited Google OAuth + email/password auth (Passport.js or
   Lucia) feeding `users.google_id` / `users.password_hash`.
