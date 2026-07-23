import { json, methodNotAllowed } from "../../_lib/http.js";
import { isAdminRequest } from "../../_lib/security.js";

export async function onRequestGet(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json(
      { success: false, error: "Unauthorized." },
      401,
      { "WWW-Authenticate": 'Bearer realm="Lo-Key Admin"' }
    );
  }

  try {
    const result = await context.env.DB.prepare(`
      SELECT id, year, make, model, battery_sizes, status, submitted_at, page_url
      FROM vehicle_requests
      ORDER BY submitted_at DESC, id DESC
      LIMIT 500
    `).all();
    return json({ success: true, requests: result.results || [] });
  } catch (error) {
    console.error("Admin vehicle request list error:", error);
    return json({ success: false, error: "Could not load vehicle requests." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
