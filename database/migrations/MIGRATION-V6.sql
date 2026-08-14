-- Lo-Key launch notification signup migration v6.
-- Run this ONCE in Cloudflare D1 after MIGRATION-V5.sql.

CREATE TABLE IF NOT EXISTS launch_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed', 'unsubscribed')),
  subscribed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  unsubscribed_at TEXT,
  page_url TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_launch_notifications_status
ON launch_notifications(status, subscribed_at);

SELECT COUNT(*) AS launch_notification_count FROM launch_notifications;
