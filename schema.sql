-- Fresh-install schema for the Lo-Key Cloudflare Pages backend.
-- Run this in Cloudflare: Storage & databases > D1 > lokey-production > Console.
-- Existing v1 databases should run MIGRATION-V2.sql instead.

CREATE TABLE IF NOT EXISTS vehicle_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  battery_sizes TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  submitted_at TEXT NOT NULL,
  page_url TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_vehicle_requests_submitted
ON vehicle_requests(submitted_at);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  vehicle TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  order_number TEXT,
  purchase_email TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verification_status TEXT NOT NULL DEFAULT 'unverified',
  approved INTEGER NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  approved_at TEXT,
  rejected_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_reviews_public
ON reviews(approved, moderation_status, approved_at, created_at);

CREATE INDEX IF NOT EXISTS idx_reviews_moderation
ON reviews(moderation_status, created_at);

CREATE TABLE IF NOT EXISTS submission_rate_limits (
  action TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (action, ip_hash, window_start)
);

CREATE INDEX IF NOT EXISTS idx_submission_rate_limits_window
ON submission_rate_limits(window_start);

CREATE TABLE IF NOT EXISTS compatibility_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  make_normalized TEXT NOT NULL,
  model TEXT NOT NULL,
  model_normalized TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('verified', 'compatible', 'conditional', 'incompatible')),
  battery_sizes TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (year, make_normalized, model_normalized)
);

CREATE INDEX IF NOT EXISTS idx_compatibility_lookup
ON compatibility_records(year, make_normalized, model_normalized);

CREATE TABLE IF NOT EXISTS cart_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20),
  source TEXT NOT NULL,
  page_url TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cart_events_created
ON cart_events(created_at);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  summary TEXT NOT NULL,
  details_json TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created
ON admin_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity
ON admin_audit_log(entity_type, entity_id, created_at);
