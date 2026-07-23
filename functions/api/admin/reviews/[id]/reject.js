import { json, methodNotAllowed } from "../../../../_lib/http.js";
import { isAdminRequest } from "../../../../_lib/security.js";

export async function onRequestPost(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ success: false, error: "Invalid review ID." }, 400);
  }

  const now = new Date().toISOString();
  try {
    const result = await context.env.DB.prepare(`
      UPDATE reviews
      SET approved = 0,
          moderation_status = 'rejected',
          rejected_at = ?,
          approved_at = NULL,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(now, now, id)
      .run();

    if (!result.meta?.changes) {
      return json({ success: false, error: "Review not found." }, 404);
    }
    return json({ success: true, message: "Review rejected." });
  } catch (error) {
    console.error("Reject review error:", error);
    return json({ success: false, error: "Could not reject the review." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
