import { json, methodNotAllowed } from "../../../_lib/http.js";
import { isAdminRequest } from "../../../_lib/security.js";
import { writeAudit } from "../../../_lib/audit.js";

export async function onRequestDelete(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ success: false, error: "Invalid review ID." }, 400);
  }

  try {
    const review = await context.env.DB.prepare(`
      SELECT id, name, country, vehicle, rating, title, moderation_status,
             verified, created_at, approved_at, rejected_at
      FROM reviews
      WHERE id = ?
    `).bind(id).first();

    if (!review) {
      return json({ success: false, error: "Review not found." }, 404);
    }

    const result = await context.env.DB.prepare(
      "DELETE FROM reviews WHERE id = ?"
    ).bind(id).run();

    if (!result.meta?.changes) {
      return json({ success: false, error: "Review not found." }, 404);
    }

    const auditSaved = await writeAudit(context, {
      action: "review.deleted",
      entityType: "review",
      entityId: id,
      summary: `Permanently deleted ${review.moderation_status} review “${review.title}” by ${review.name}.`,
      details: review,
    });

    return json({ success: true, message: "Review permanently deleted.", auditSaved });
  } catch (error) {
    console.error("Delete review error:", error);
    return json({ success: false, error: "Could not delete the review." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["DELETE"]);
}
