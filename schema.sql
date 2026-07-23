-- Run this in Cloudflare: Storage & databases > D1 > lokey-production > Console.
-- It is safe to run more than once.

CREATE TABLE IF NOT EXISTS vehicle_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
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
