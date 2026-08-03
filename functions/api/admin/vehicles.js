import { json, methodNotAllowed, readJson, textField } from "../../_lib/http.js";
import { isAdminRequest } from "../../_lib/security.js";
import { writeAudit } from "../../_lib/audit.js";
import { normalizeVehicleValue, statusFromAdminValue } from "../../_lib/vehicles.js";

const adminOnly = (context) => isAdminRequest(context.request, context.env)
  ? null
  : json({ success: false, error: "Unauthorized." }, 401);

const validYear = (year) => Number.isInteger(year) && year >= 1980 && year <= new Date().getUTCFullYear() + 2;

export async function onRequestGet(context) {
  const denied = adminOnly(context);
  if (denied) return denied;

  try {
    const result = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles
      WHERE source <> 'catalogue'
      ORDER BY updated_at DESC, id DESC
      LIMIT 500
    `).all();
    return json({ success: true, records: result.results || [] });
  } catch (error) {
    console.error("Admin vehicle list error:", error);
    return json({ success: false, error: "Could not load vehicle records." }, 500);
  }
}

export async function onRequestPost(context) {
  const denied = adminOnly(context);
  if (denied) return denied;

  let data;
  try {
    data = await readJson(context.request);
  } catch (error) {
    return json({ success: false, error: error.message || "Invalid JSON request." }, 400);
  }

  const yearFrom = Number(data.yearFrom);
  const yearTo = Number(data.yearTo);
  const make = textField(data.make, 80);
  const model = textField(data.model, 120);
  const batterySizes = textField(data.batterySizes, 120);
  const status = statusFromAdminValue(data.status, batterySizes);

  if (!validYear(yearFrom) || !validYear(yearTo) || yearTo < yearFrom) {
    return json({ success: false, error: "Enter a valid from/to model-year range." }, 400);
  }
  if (!make || !model) {
    return json({ success: false, error: "Make and model are required." }, 400);
  }
  if (!status) {
    return json({ success: false, error: "Select Yes, Probably, or No." }, 400);
  }
  if (!batterySizes) {
    return json({ success: false, error: "Enter at least one key-fob battery size." }, 400);
  }

  const makeNormalized = normalizeVehicleValue(make);
  const modelNormalized = normalizeVehicleValue(model);

  try {
    const conflicts = await context.env.DB.prepare(`
      SELECT year
      FROM vehicles
      WHERE year BETWEEN ? AND ?
        AND make_normalized = ?
        AND model_normalized = ?
      ORDER BY year
    `).bind(yearFrom, yearTo, makeNormalized, modelNormalized).all();

    if (conflicts.results?.length) {
      const years = conflicts.results.map((row) => row.year).join(", ");
      return json({
        success: false,
        error: `This model already exists for: ${years}. Use Edit existing vehicle for those years.`,
      }, 409);
    }

    const now = new Date().toISOString();
    const statements = [];
    for (let year = yearFrom; year <= yearTo; year += 1) {
      statements.push(context.env.DB.prepare(`
        INSERT INTO vehicles
          (year, make, make_normalized, model, model_normalized, status, battery_sizes,
           confidence, source, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'admin-added', 'admin', ?, ?)
      `).bind(
        year, make, makeNormalized, model, modelNormalized, status, batterySizes, now, now
      ));
    }
    await context.env.DB.batch(statements);

    const first = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles
      WHERE year = ? AND make_normalized = ? AND model_normalized = ?
    `).bind(yearFrom, makeNormalized, modelNormalized).first();

    const rangeText = yearFrom === yearTo ? String(yearFrom) : `${yearFrom}-${yearTo}`;
    const auditSaved = await writeAudit(context, {
      action: "vehicle.created",
      entityType: "vehicle",
      entityId: first?.id || null,
      summary: `Added ${rangeText} ${make} ${model}: ${status}, ${batterySizes}.`,
      details: { yearFrom, yearTo, make, model, status, batterySizes, rowsCreated: statements.length },
    });

    return json({
      success: true,
      message: `${rangeText} ${make} ${model} added to the catalogue.`,
      rowsCreated: statements.length,
      record: first,
      auditSaved,
    }, 201);
  } catch (error) {
    console.error("Admin add vehicle error:", error);
    return json({ success: false, error: "Could not add the vehicle." }, 500);
  }
}

export function onRequestDelete() {
  return methodNotAllowed(["GET", "POST"]);
}
