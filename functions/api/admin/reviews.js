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

  const url = new URL(context.request.url);
  const status = ["pending", "approved", "rejected", "all"].includes(url.searchParams.get("status"))
    ? url.searchParams.get("status")
    : "pending";

  const where = status === "all" ? "" : "WHERE moderation_status = ?";
  const statement = context.env.DB.prepare(`
    SELECT id, name, country, vehicle, rating, title, body, order_number,
           purchase_email, verified, verification_status, approved,
           moderation_status, created_at, approved_at, rejected_at
    FROM reviews
    ${where}
    ORDER BY created_at DESC, id DESC
    LIMIT 300
  `);

  try {
    const result = status === "all"
      ? await statement.all()
      : await statement.bind(status).all();
    return json({ success: true, reviews: result.results || [] });
  } catch (error) {
    console.error("Admin review list error:", error);
    return json({ success: false, error: "Could not load reviews." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
