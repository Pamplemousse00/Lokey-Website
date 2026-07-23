import { json, methodNotAllowed } from "../../../_lib/http.js";
import { isAdminRequest } from "../../../_lib/security.js";

export async function onRequestDelete(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ success: false, error: "Invalid compatibility record ID." }, 400);
  }

  try {
    const result = await context.env.DB.prepare(
      "DELETE FROM compatibility_records WHERE id = ?"
    ).bind(id).run();

    if (!result.meta?.changes) {
      return json({ success: false, error: "Compatibility record not found." }, 404);
    }
    return json({ success: true, message: "Compatibility record deleted." });
  } catch (error) {
    console.error("Delete compatibility record error:", error);
    return json({ success: false, error: "Could not delete the compatibility record." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["DELETE"]);
}
