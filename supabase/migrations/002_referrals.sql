-- ============================================================
-- Migration 002: Tutor referral system
-- ============================================================

CREATE TABLE IF NOT EXISTS tutors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id   TEXT UNIQUE,                         -- set when tutor claims account
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  ref_code        TEXT UNIQUE NOT NULL,
  commission_pct  NUMERIC(5,2) NOT NULL DEFAULT 20.0,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused','blocked')),
  notes           TEXT DEFAULT '',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commissions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tutor_id          UUID NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
  user_id           TEXT NOT NULL REFERENCES users(id),
  stripe_event_id   TEXT UNIQUE NOT NULL,
  plan_type         TEXT,                              -- 'monthly' | 'annual'
  amount_usd        NUMERIC(10,2) NOT NULL,
  commission_usd    NUMERIC(10,2) NOT NULL,
  month             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','paid','void')),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- FK from users.ref_code → tutors.ref_code
ALTER TABLE users
  ADD CONSTRAINT fk_users_ref_code
  FOREIGN KEY (ref_code) REFERENCES tutors(ref_code)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_commissions_tutor   ON commissions(tutor_id, month);
CREATE INDEX IF NOT EXISTS idx_commissions_status  ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_users_ref_code      ON users(ref_code);

ALTER TABLE tutors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_all_tutors"      ON tutors      FOR ALL USING (true);
CREATE POLICY "service_all_commissions" ON commissions FOR ALL USING (true);
