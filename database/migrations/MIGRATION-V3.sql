-- Run this ONCE against the existing Lo-Key D1 database after MIGRATION-V2.sql.
-- Cloudflare: Storage & databases > D1 > lokey-production > Console.

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
