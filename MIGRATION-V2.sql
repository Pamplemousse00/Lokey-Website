-- Run this ONCE against a database that was created with backend v1.
-- Cloudflare: Storage & databases > D1 > lokey-production > Console.

ALTER TABLE reviews ADD COLUMN vehicle TEXT;
ALTER TABLE vehicle_requests ADD COLUMN battery_sizes TEXT;

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
