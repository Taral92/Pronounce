CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id                        TEXT PRIMARY KEY,
  email                     TEXT,
  tier                      TEXT NOT NULL DEFAULT 'free'
                              CHECK (tier IN ('blocked','free','trial','pro','admin')),
  stripe_customer_id        TEXT UNIQUE,
  tier_expires_at           TIMESTAMPTZ DEFAULT NULL,
  welcome_bonus_remaining   INT NOT NULL DEFAULT 3,
  is_globally_free_exempt   BOOLEAN DEFAULT FALSE,
  plan_overrides            JSONB DEFAULT '{}',
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month           TEXT NOT NULL,
  analysis_count  INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_month ON usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_users_stripe     ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_tier       ON users(tier);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_users" ON users FOR ALL USING (true);
CREATE POLICY "service_all_usage" ON usage FOR ALL USING (true);
