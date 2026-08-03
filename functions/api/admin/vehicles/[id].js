import { json, methodNotAllowed, readJson, textField } from "../../../_lib/http.js";
import { isAdminRequest } from "../../../_lib/security.js";
import { writeAudit } from "../../../_lib/audit.js";
import { statusFromAdminValue } from "../../../_lib/vehicles.js";

const getId = (context) => {
  const id = Number(context.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function onRequestPut(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }
  const id = getId(context);
  if (!id) return json({ success: false, error: "Invalid vehicle ID." }, 400);

  let data;
  try {
    data = await readJson(context.request);
  } catch (error) {
    return json({ success: false, error: error.message || "Invalid JSON request." }, 400);
  }

  const batterySizes = textField(data.batterySizes, 120);
  const status = statusFromAdminValue(data.status, batterySizes);
  if (!status) return json({ success: false, error: "Select Yes, Probably, or No." }, 400);
  if (!batterySizes) return json({ success: false, error: "Enter at least one key-fob battery size." }, 400);

  try {
    const previous = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles WHERE id = ?
    `).bind(id).first();
    if (!previous) return json({ success: false, error: "Vehicle not found." }, 404);

    const now = new Date().toISOString();
    await context.env.DB.prepare(`
      UPDATE vehicles
      SET status = ?, battery_sizes = ?, confidence = 'admin-managed', source = 'admin', updated_at = ?
      WHERE id = ?
    `).bind(status, batterySizes, now, id).run();

    const row = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles WHERE id = ?
    `).bind(id).first();

    const auditSaved = await writeAudit(context, {
      action: "vehicle.updated",
      entityType: "vehicle",
      entityId: id,
      summary: `Updated ${row.year} ${row.make} ${row.model}: ${status}, ${batterySizes}.`,
      details: { before: previous, after: row },
    });

    return json({ success: true, record: row, message: "Vehicle compatibility updated.", auditSaved });
  } catch (error) {
    console.error("Admin update vehicle error:", error);
    return json({ success: false, error: "Could not update the vehicle." }, 500);
  }
}

export async function onRequestDelete(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }
  const id = getId(context);
  if (!id) return json({ success: false, error: "Invalid vehicle ID." }, 400);

  try {
    const record = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles WHERE id = ?
    `).bind(id).first();
    if (!record) return json({ success: false, error: "Vehicle not found." }, 404);

    await context.env.DB.prepare("DELETE FROM vehicles WHERE id = ?").bind(id).run();
    const auditSaved = await writeAudit(context, {
      action: "vehicle.deleted",
      entityType: "vehicle",
      entityId: id,
      summary: `Deleted ${record.year} ${record.make} ${record.model} from the catalogue.`,
      details: record,
    });
    return json({ success: true, message: "Vehicle removed from the catalogue.", auditSaved });
  } catch (error) {
    console.error("Admin delete vehicle error:", error);
    return json({ success: false, error: "Could not delete the vehicle." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["PUT", "DELETE"]);
}

export function onRequestPost() {
  return methodNotAllowed(["PUT", "DELETE"]);
}
