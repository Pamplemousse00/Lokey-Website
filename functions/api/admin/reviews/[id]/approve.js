import { json, methodNotAllowed, readJson } from "../../../../_lib/http.js";
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

  let data = {};
  try {
    data = await readJson(context.request);
  } catch {
    data = {};
  }

  const verified = data.verified === true ? 1 : 0;
  const verificationStatus = verified ? "verified" : "unverified";
  const now = new Date().toISOString();

  try {
    const review = await context.env.DB.prepare(`
      SELECT id, name, vehicle, rating, title, moderation_status, verified
      FROM reviews
      WHERE id = ?
    `).bind(id).first();

    if (!review) {
      return json({ success: false, error: "Review not found." }, 404);
    }

    const result = await context.env.DB.prepare(`
      UPDATE reviews
      SET approved = 1,
          moderation_status = 'approved',
          verified = ?,
          verification_status = ?,
          approved_at = ?,
          rejected_at = NULL,
          updated_at = ?
      WHERE id = ?
    `)
      .bind(verified, verificationStatus, now, now, id)
      .run();

    if (!result.meta?.changes) {
      return json({ success: false, error: "Review not found." }, 404);
    }

    const auditSaved = await writeAudit(context, {
      action: verified ? "review.approved_verified" : "review.approved",
      entityType: "review",
      entityId: id,
      summary: `${verified ? "Approved as verified" : "Approved"} review “${review.title}” by ${review.name}.`,
      details: {
        review: {
          id: review.id,
          name: review.name,
          vehicle: review.vehicle,
          rating: review.rating,
          title: review.title,
        },
        previousStatus: review.moderation_status,
        verified: Boolean(verified),
      },
    });

    return json({
      success: true,
      message: "Review approved.",
      auditSaved,
    });
  } catch (error) {
    console.error("Approve review error:", error);
    return json({ success: false, error: "Could not approve the review." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
