import { json, methodNotAllowed } from "../../_lib/http.js";
import { isAdminRequest } from "../../_lib/security.js";

export async function onRequestGet(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  try {
    const summary = await context.env.DB.prepare(`
      SELECT
        COUNT(*) AS add_events,
        COALESCE(SUM(quantity), 0) AS units_added,
        MAX(created_at) AS last_added_at,
        SUM(CASE WHEN created_at >= datetime('now', '-1 day') THEN 1 ELSE 0 END) AS events_24h,
        SUM(CASE WHEN created_at >= datetime('now', '-7 day') THEN 1 ELSE 0 END) AS events_7d
      FROM cart_events
    `).first();

    return json({
      success: true,
      metrics: {
        addEvents: Number(summary?.add_events || 0),
        unitsAdded: Number(summary?.units_added || 0),
        events24h: Number(summary?.events_24h || 0),
        events7d: Number(summary?.events_7d || 0),
        lastAddedAt: summary?.last_added_at || null,
      },
    });
  } catch (error) {
    console.error("Admin cart metrics error:", error);
    return json({ success: false, error: "Could not load cart metrics." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
