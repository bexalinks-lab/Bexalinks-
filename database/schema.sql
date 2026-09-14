-- =========================================================
-- BEXALINK — Database Schema (PostgreSQL 15+)
-- URL Shortener + CPM Monetization Platform
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------
-- USERS & AUTH
-- ---------------------------------------------------------
CREATE TYPE user_role AS ENUM ('admin', 'publisher');
CREATE TYPE payout_method AS ENUM ('upi', 'bank_transfer', 'paypal', 'crypto');
CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
CREATE TYPE link_status AS ENUM ('active', 'blocked', 'archived');

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255),              -- NULL if OAuth-only
    google_id           VARCHAR(255) UNIQUE,
    display_name        VARCHAR(120),
    avatar_url          TEXT,
    role                user_role NOT NULL DEFAULT 'publisher',
    referred_by         UUID REFERENCES users(id) ON DELETE SET NULL,
    is_banned           BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason          TEXT,
    email_verified_at   TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_referred_by ON users(referred_by);

-- Per-user payout destination config
CREATE TABLE payment_methods (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method          payout_method NOT NULL,
    details         JSONB NOT NULL,   -- e.g. {"upi_id": "name@bank"} / {"wallet": "0xabc", "chain": "TRC20"}
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX one_default_method_per_user
    ON payment_methods(user_id) WHERE is_default;

-- API tokens for automated shortening (Telegram bots, scripts)
CREATE TABLE api_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(128) UNIQUE NOT NULL,   -- store SHA-256, never raw token
    label           VARCHAR(120),
    last_used_at    TIMESTAMPTZ,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_api_tokens_user ON api_tokens(user_id);

-- ---------------------------------------------------------
-- LINKS
-- ---------------------------------------------------------
CREATE TABLE links (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    short_code      VARCHAR(32) UNIQUE NOT NULL,     -- e.g. "aB3xQ1"
    custom_alias    VARCHAR(64) UNIQUE,
    destination_url TEXT NOT NULL,
    title           VARCHAR(255),
    status          link_status NOT NULL DEFAULT 'active',
    is_nsfw         BOOLEAN NOT NULL DEFAULT FALSE,
    total_views     BIGINT NOT NULL DEFAULT 0,
    total_earnings_cents BIGINT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_links_user ON links(user_id);
CREATE INDEX idx_links_short_code ON links(short_code);

-- ---------------------------------------------------------
-- CPM RATES (admin-configurable, per country)
-- ---------------------------------------------------------
CREATE TABLE cpm_rates (
    id              SERIAL PRIMARY KEY,
    country_code    CHAR(2) NOT NULL UNIQUE,   -- ISO 3166-1 alpha-2, "ZZ" = default/rest-of-world
    tier_label      VARCHAR(20) NOT NULL,      -- 'Tier 1', 'Tier 2', 'Tier 3'
    rate_cents      INTEGER NOT NULL,          -- CPM in USD cents (e.g. 1200 = $12.00 per 1000 views)
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- CLICKS / VIEWS (raw event log, partitioned by month for scale)
-- ---------------------------------------------------------
CREATE TABLE clicks (
    id              BIGSERIAL,
    link_id         UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
    ip_hash         VARCHAR(64) NOT NULL,       -- SHA-256(ip + daily salt), never store raw IP
    country_code    CHAR(2),
    is_unique       BOOLEAN NOT NULL DEFAULT TRUE,   -- unique per IP per 24h
    is_valid        BOOLEAN NOT NULL DEFAULT TRUE,   -- false if flagged as fraud/bot/vpn
    fraud_reason    VARCHAR(64),                -- 'vpn', 'proxy', 'bot_ua', 'rate_limited', etc.
    user_agent      TEXT,
    referrer        TEXT,
    earnings_cents  INTEGER NOT NULL DEFAULT 0, -- computed CPM share for this view
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (created_at);

CREATE TABLE clicks_default PARTITION OF clicks DEFAULT;
CREATE INDEX idx_clicks_link_created ON clicks(link_id, created_at);
CREATE INDEX idx_clicks_ip_hash ON clicks(ip_hash);

-- ---------------------------------------------------------
-- FRAUD LOGS (admin visibility)
-- ---------------------------------------------------------
CREATE TABLE fraud_logs (
    id              BIGSERIAL PRIMARY KEY,
    link_id         UUID REFERENCES links(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_hash         VARCHAR(64),
    reason          VARCHAR(64) NOT NULL,
    detail          JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fraud_logs_user ON fraud_logs(user_id);

-- ---------------------------------------------------------
-- EARNINGS ROLLUP (materialized daily aggregate for fast dashboards)
-- ---------------------------------------------------------
CREATE TABLE daily_earnings (
    id              BIGSERIAL PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_id         UUID REFERENCES links(id) ON DELETE SET NULL,
    day             DATE NOT NULL,
    views           INTEGER NOT NULL DEFAULT 0,
    valid_views     INTEGER NOT NULL DEFAULT 0,
    earnings_cents  INTEGER NOT NULL DEFAULT 0,
    avg_cpm_cents   INTEGER NOT NULL DEFAULT 0,
    UNIQUE (user_id, link_id, day)
);
CREATE INDEX idx_daily_earnings_user_day ON daily_earnings(user_id, day);

-- ---------------------------------------------------------
-- REFERRALS (multi-tier, 10% lifetime commission)
-- ---------------------------------------------------------
CREATE TABLE referral_earnings (
    id                  BIGSERIAL PRIMARY KEY,
    referrer_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_earning_cents INTEGER NOT NULL,       -- the referred user's earning that this commission is based on
    commission_cents    INTEGER NOT NULL,        -- 10% of source_earning_cents
    day                 DATE NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_referral_earnings_referrer ON referral_earnings(referrer_id);

-- ---------------------------------------------------------
-- PAYOUTS
-- ---------------------------------------------------------
CREATE TABLE payouts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_method_id   UUID REFERENCES payment_methods(id),
    amount_cents        INTEGER NOT NULL CHECK (amount_cents >= 500), -- $5.00 minimum
    status              payout_status NOT NULL DEFAULT 'pending',
    admin_note          TEXT,
    processed_by        UUID REFERENCES users(id),
    requested_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at        TIMESTAMPTZ
);
CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- ---------------------------------------------------------
-- ADS (admin-injected ad network scripts, per interstitial step)
-- ---------------------------------------------------------
CREATE TYPE ad_step AS ENUM ('step1_landing', 'step2_verify', 'step3_getlink');

CREATE TABLE ad_slots (
    id              SERIAL PRIMARY KEY,
    network         VARCHAR(50) NOT NULL,   -- 'adsterra', 'propellerads', 'popads'
    step            ad_step NOT NULL,
    placement       VARCHAR(50) NOT NULL,   -- 'banner_top', 'banner_bottom', 'native', 'popunder'
    script_code     TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    country_filter  CHAR(2)[],              -- NULL = all countries
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- AUDIT LOG (admin actions)
-- ---------------------------------------------------------
CREATE TABLE admin_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    admin_id        UUID NOT NULL REFERENCES users(id),
    action          VARCHAR(100) NOT NULL,   -- 'ban_user', 'update_cpm', 'approve_payout', etc.
    target_type     VARCHAR(50),
    target_id       UUID,
    detail          JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------
-- SEED DEFAULTS
-- ---------------------------------------------------------
INSERT INTO cpm_rates (country_code, tier_label, rate_cents) VALUES
    ('US', 'Tier 1', 1300), ('GB', 'Tier 1', 1200), ('CA', 'Tier 1', 1200),
    ('AU', 'Tier 1', 1200), ('DE', 'Tier 1', 1100), ('FR', 'Tier 1', 1000),
    ('IN', 'Tier 2', 550),  ('BR', 'Tier 2', 500),  ('ID', 'Tier 2', 450),
    ('PK', 'Tier 3', 200),  ('BD', 'Tier 3', 200),  ('ZZ', 'Tier 3', 150);
