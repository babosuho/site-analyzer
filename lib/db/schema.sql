-- Site Analyzer D1 Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS otp_tokens (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_tokens(email);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  categories TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  seo_score INTEGER,
  aeo_score INTEGER,
  geo_score INTEGER,
  speed_score INTEGER,
  result_json TEXT NOT NULL,
  ai_input_tokens INTEGER DEFAULT 0,
  ai_output_tokens INTEGER DEFAULT 0,
  ai_cost_usd REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_url ON analyses(user_id, url);

CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  url TEXT NOT NULL,
  categories TEXT NOT NULL,
  schedule TEXT DEFAULT 'weekly',
  last_run_at TEXT,
  last_score INTEGER,
  alert_threshold INTEGER DEFAULT 10,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_monitors_user ON monitors(user_id);
CREATE INDEX IF NOT EXISTS idx_monitors_active ON monitors(is_active);

CREATE TABLE IF NOT EXISTS webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_webhooks_user ON webhooks(user_id);
