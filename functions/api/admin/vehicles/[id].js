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
      SELECT id, year, make, make_normalized, model, model_normalized,
             status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles WHERE id = ?
    `).bind(id).first();
    if (!previous) return json({ success: false, error: "Vehicle not found." }, 404);

    const maxYear = new Date().getUTCFullYear() + 2;
    const yearFrom = data.yearFrom == null || data.yearFrom === "" ? Number(previous.year) : Number(data.yearFrom);
    const yearTo = data.yearTo == null || data.yearTo === "" ? Number(previous.year) : Number(data.yearTo);
    const validYear = (year) => Number.isInteger(year) && year >= 1980 && year <= maxYear;
    if (!validYear(yearFrom) || !validYear(yearTo) || yearTo < yearFrom) {
      return json({ success: false, error: "Enter a valid from/to model-year range." }, 400);
    }
    if (Number(previous.year) < yearFrom || Number(previous.year) > yearTo) {
      return json({ success: false, error: `The selected anchor year (${previous.year}) must be inside the range.` }, 400);
    }
    if (yearTo - yearFrom + 1 > 50) {
      return json({ success: false, error: "A single edit can cover at most 50 model years." }, 400);
    }

    const existing = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles
      WHERE year BETWEEN ? AND ?
        AND make_normalized = ?
        AND model_normalized = ?
      ORDER BY year
    `).bind(yearFrom, yearTo, previous.make_normalized, previous.model_normalized).all();
    const beforeRows = existing.results || [];
    const existingYears = new Set(beforeRows.map((row) => Number(row.year)));

    const now = new Date().toISOString();
    const statements = [];
    for (let year = yearFrom; year <= yearTo; year += 1) {
      statements.push(context.env.DB.prepare(`
        INSERT INTO vehicles
          (year, make, make_normalized, model, model_normalized, status, battery_sizes,
           confidence, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'admin-managed', 'admin', ?, ?)
        ON CONFLICT(year, make_normalized, model_normalized) DO UPDATE SET
          make = excluded.make,
          model = excluded.model,
          status = excluded.status,
          battery_sizes = excluded.battery_sizes,
          confidence = 'admin-managed',
          source = 'admin',
          updated_at = excluded.updated_at
      `).bind(
        year,
        previous.make,
        previous.make_normalized,
        previous.model,
        previous.model_normalized,
        status,
        batterySizes,
        now,
        now
      ));
    }
    await context.env.DB.batch(statements);

    const updated = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles
      WHERE year BETWEEN ? AND ?
        AND make_normalized = ?
        AND model_normalized = ?
      ORDER BY year
    `).bind(yearFrom, yearTo, previous.make_normalized, previous.model_normalized).all();
    const rows = updated.results || [];
    const selectedRecord = rows.find((row) => Number(row.year) === Number(previous.year)) || rows[0] || null;
    const rowsUpdated = existingYears.size;
    const rowsCreated = statements.length - rowsUpdated;
    const rangeText = yearFrom === yearTo ? String(yearFrom) : `${yearFrom}-${yearTo}`;
    const changeText = rowsCreated
      ? `${rowsUpdated} updated, ${rowsCreated} added`
      : `${rowsUpdated} updated`;

    const auditSaved = await writeAudit(context, {
      action: "vehicle.updated",
      entityType: "vehicle",
      entityId: id,
      summary: `Updated ${rangeText} ${previous.make} ${previous.model}: ${status}, ${batterySizes} (${changeText}).`,
      details: {
        yearFrom,
        yearTo,
        make: previous.make,
        model: previous.model,
        status,
        batterySizes,
        rowsUpdated,
        rowsCreated,
        before: beforeRows,
        after: rows,
      },
    });

    return json({
      success: true,
      record: selectedRecord,
      records: rows,
      yearFrom,
      yearTo,
      rowsUpdated,
      rowsCreated,
      message: `${rangeText} ${previous.make} ${previous.model} updated (${changeText}).`,
      auditSaved,
    });
  } catch (error) {
    console.error("Admin update vehicle error:", error);
    return json({ success: false, error: "Could not update the vehicle range." }, 500);
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
