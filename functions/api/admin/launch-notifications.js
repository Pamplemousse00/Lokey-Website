import { json, methodNotAllowed } from "../../_lib/http.js";
import { isAdminRequest } from "../../_lib/security.js";

export async function onRequestGet(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  try {
    const [rows, stats] = await Promise.all([
      context.env.DB.prepare(`
        SELECT id, email, status, subscribed_at, updated_at, unsubscribed_at, page_url
        FROM launch_notifications
        ORDER BY subscribed_at DESC, id DESC
        LIMIT 1000
      `).all(),
      context.env.DB.prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'subscribed' THEN 1 ELSE 0 END) AS subscribed,
          SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed,
          SUM(CASE WHEN status = 'subscribed' AND datetime(subscribed_at) >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS subscribed_7d
        FROM launch_notifications
      `).first(),
    ]);

    let alerts = new Map();
    let alertDiagnosticsAvailable = true;
    try {
      const result = await context.env.DB.prepare(`SELECT a.* FROM launch_alert_results a
        JOIN launch_notifications n ON n.id = a.notification_id
        ORDER BY n.subscribed_at DESC, n.id DESC LIMIT 1000`).all();
      alerts = new Map((result.results || []).map(row => [row.notification_id, row]));
    } catch (error) {
      alertDiagnosticsAvailable = false;
      console.error("Launch alert diagnostics unavailable:", error);
    }
    return json({
      success: true,
      alertDiagnosticsAvailable,
      notifications: (rows.results || []).map(row => ({ ...row, alert: alerts.get(row.id) || null })),
      stats: {
        total: Number(stats?.total || 0),
        subscribed: Number(stats?.subscribed || 0),
        unsubscribed: Number(stats?.unsubscribed || 0),
        subscribed7d: Number(stats?.subscribed_7d || 0),
      },
    }, 200, { "Cache-Control": "no-store" });
  } catch (error) {
    console.error("Admin launch-notifications error:", error);
    return json({ success: false, error: "Could not load launch notifications." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
