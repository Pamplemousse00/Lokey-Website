-- Optional but recommended for V14 email diagnostics. Safe to run again.
CREATE TABLE IF NOT EXISTS launch_alert_results (
  notification_id INTEGER PRIMARY KEY REFERENCES launch_notifications(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  provider_id TEXT,
  error TEXT,
  attempted_at TEXT NOT NULL
);
