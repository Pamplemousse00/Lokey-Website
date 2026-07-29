-- Run this ONCE against the existing Lo-Key D1 database after MIGRATION-V3.sql.
-- Cloudflare: Storage & databases > D1 > lokey-production > Console.
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  order_number TEXT,
  vehicle TEXT,
  message TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'pending',
  email_provider_id TEXT,
  delivery_error TEXT,
  submitted_at TEXT NOT NULL,
  delivered_at TEXT,
  page_url TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_submitted
ON contact_messages(submitted_at);

CREATE INDEX IF NOT EXISTS idx_contact_messages_delivery
ON contact_messages(delivery_status, submitted_at);
