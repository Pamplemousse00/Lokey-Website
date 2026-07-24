import { json, methodNotAllowed } from "../../../../_lib/http.js";
import { isAdminRequest } from "../../../../_lib/security.js";
import { writeAudit } from "../../../../_lib/audit.js";

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
    const review = await context.env.DB.prepare(`
      SELECT id, name, vehicle, rating, title, moderation_status
      FROM reviews
      WHERE id = ?
    `).bind(id).first();

    if (!review) {
      return json({ success: false, error: "Review not found." }, 404);
    }

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

    const auditSaved = await writeAudit(context, {
      action: "review.rejected",
      entityType: "review",
      entityId: id,
      summary: `Rejected review “${review.title}” by ${review.name}.`,
      details: {
        review: {
          id: review.id,
          name: review.name,
          vehicle: review.vehicle,
          rating: review.rating,
          title: review.title,
        },
        previousStatus: review.moderation_status,
      },
    });

    return json({ success: true, message: "Review rejected.", auditSaved });
  } catch (error) {
    console.error("Reject review error:", error);
    return json({ success: false, error: "Could not reject the review." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
