-- ================================================================
-- Site Analyzer - Full Database Schema
--
-- 적용 방법:
--   wrangler d1 execute site-analyzer-db --file=migrations/schema.sql
--   wrangler d1 execute site-analyzer-db --file=migrations/schema.sql --remote
-- ================================================================

-- ── users ──────────────────────────────────────────────────────
-- 로그인한 사용자 계정 (이메일 OTP 인증)
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

-- ── otp_tokens ─────────────────────────────────────────────────
-- 이메일 로그인용 일회용 토큰 (10분 유효)
CREATE TABLE IF NOT EXISTS otp_tokens (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT    NOT NULL,
  token      TEXT    NOT NULL,
  expires_at TEXT    NOT NULL,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens (email);

-- ── analyses ───────────────────────────────────────────────────
-- URL 분석 결과 저장
CREATE TABLE IF NOT EXISTS analyses (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url              TEXT    NOT NULL,
  categories       TEXT    NOT NULL,          -- JSON array: ["seo","aeo","geo","speed"]
  overall_score    INTEGER NOT NULL,
  seo_score        INTEGER,
  aeo_score        INTEGER,
  geo_score        INTEGER,
  speed_score      INTEGER,
  result_json      TEXT    NOT NULL,          -- 전체 AnalysisResult JSON
  ai_input_tokens  INTEGER NOT NULL DEFAULT 0,
  ai_output_tokens INTEGER NOT NULL DEFAULT 0,
  ai_cost_usd      REAL    NOT NULL DEFAULT 0,
  created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_analyses_user    ON analyses (user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_url     ON analyses (user_id, url);
CREATE INDEX IF NOT EXISTS idx_analyses_created ON analyses (user_id, created_at DESC);

-- ── monitors ───────────────────────────────────────────────────
-- 주기적 모니터링 설정
CREATE TABLE IF NOT EXISTS monitors (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url             TEXT    NOT NULL,
  categories      TEXT    NOT NULL,           -- JSON array
  schedule        TEXT    NOT NULL DEFAULT 'weekly' CHECK (schedule IN ('daily', 'weekly')),
  last_run_at     TEXT,
  last_score      INTEGER,
  alert_threshold INTEGER NOT NULL DEFAULT 10,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_monitors_user   ON monitors (user_id);
CREATE INDEX IF NOT EXISTS idx_monitors_active ON monitors (is_active);

-- ── webhooks ───────────────────────────────────────────────────
-- Slack / Discord 알림 웹훅
CREATE TABLE IF NOT EXISTS webhooks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL CHECK (type IN ('slack', 'discord')),
  url        TEXT    NOT NULL,
  events     TEXT    NOT NULL,               -- JSON array: ["analysis_complete","score_drop"]
  is_active  INTEGER NOT NULL DEFAULT 1,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks (user_id);
