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

    return json({
      success: true,
      notifications: rows.results || [],
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
