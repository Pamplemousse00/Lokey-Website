import { json, methodNotAllowed } from "../../../_lib/http.js";
import { isAdminRequest } from "../../../_lib/security.js";

export async function onRequestDelete(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  const id = Number(context.params.id);
  if (!Number.isInteger(id) || id < 1) {
    return json({ success: false, error: "Invalid vehicle request ID." }, 400);
  }

  try {
    const result = await context.env.DB.prepare(
      "DELETE FROM vehicle_requests WHERE id = ?"
    ).bind(id).run();

    if (!result.meta?.changes) {
      return json({ success: false, error: "Vehicle request not found." }, 404);
    }
    return json({ success: true, message: "Vehicle request deleted." });
  } catch (error) {
    console.error("Delete vehicle request error:", error);
    return json({ success: false, error: "Could not delete the vehicle request." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["DELETE"]);
}
