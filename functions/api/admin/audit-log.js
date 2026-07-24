import { json, methodNotAllowed } from "../../_lib/http.js";
import { isAdminRequest } from "../../_lib/security.js";

export async function onRequestGet(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  try {
    const result = await context.env.DB.prepare(`
      SELECT id, actor, action, entity_type, entity_id, summary, details_json, created_at
      FROM admin_audit_log
      ORDER BY created_at DESC, id DESC
      LIMIT 500
    `).all();

    return json({ success: true, entries: result.results || [] });
  } catch (error) {
    console.error("Admin audit list error:", error);
    return json({ success: false, error: "Could not load the admin audit trail." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
