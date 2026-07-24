import { json, methodNotAllowed, readJson, textField } from "../../_lib/http.js";
import { isAdminRequest } from "../../_lib/security.js";
import { writeAudit } from "../../_lib/audit.js";

const normalize = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const statusMap = {
  yes: "verified",
  verified: "verified",
  compatible: "compatible",
  conditional: "conditional",
  no: "incompatible",
  incompatible: "incompatible",
};

const adminOnly = (context) => {
  if (isAdminRequest(context.request, context.env)) return null;
  return json({ success: false, error: "Unauthorized." }, 401);
};

export async function onRequestGet(context) {
  const denied = adminOnly(context);
  if (denied) return denied;

  try {
    const result = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, created_at, updated_at
      FROM compatibility_records
      ORDER BY updated_at DESC, id DESC
      LIMIT 500
    `).all();
    return json({ success: true, records: result.results || [] });
  } catch (error) {
    console.error("Admin compatibility list error:", error);
    return json({ success: false, error: "Could not load compatibility records." }, 500);
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

  const year = Number(data.year);
  const make = textField(data.make, 80);
  const model = textField(data.model, 120);
  const batterySizes = textField(data.batterySizes, 120);
  const requestedStatus = String(data.status || "").toLowerCase();
  const listedBatteries = [...new Set(
    (batterySizes.toUpperCase().match(/\b(?:CR|BR|DL|ECR|LIR)\s*-?\s*\d{4}\b/g) || [])
      .map((value) => value.replace(/[\s-]+/g, ""))
  )];
  const status = requestedStatus === "probably"
    ? (listedBatteries.length > 1 ? "conditional" : "compatible")
    : statusMap[requestedStatus];
  const currentYear = new Date().getUTCFullYear();

  if (!Number.isInteger(year) || year < 1980 || year > currentYear + 2) {
    return json({ success: false, error: "Please select a valid vehicle year." }, 400);
  }
  if (!make || !model) {
    return json({ success: false, error: "Please select a make and model." }, 400);
  }
  if (!status) {
    return json({ success: false, error: "Please select Yes, Probably, or No." }, 400);
  }
  if (!batterySizes) {
    return json({ success: false, error: "Please select at least one key-fob battery size." }, 400);
  }

  const makeNormalized = normalize(make);
  const modelNormalized = normalize(model);
  const now = new Date().toISOString();

  try {
    const previous = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, created_at, updated_at
      FROM compatibility_records
      WHERE year = ? AND make_normalized = ? AND model_normalized = ?
    `).bind(year, makeNormalized, modelNormalized).first();

    const row = await context.env.DB.prepare(`
      INSERT INTO compatibility_records
        (year, make, make_normalized, model, model_normalized, status,
         battery_sizes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(year, make_normalized, model_normalized)
      DO UPDATE SET
        make = excluded.make,
        model = excluded.model,
        status = excluded.status,
        battery_sizes = excluded.battery_sizes,
        updated_at = excluded.updated_at
      RETURNING id, year, make, model, status, battery_sizes, created_at, updated_at
    `)
      .bind(
        year,
        make,
        makeNormalized,
        model,
        modelNormalized,
        status,
        batterySizes,
        now,
        now
      )
      .first();

    const auditSaved = await writeAudit(context, {
      action: previous ? "compatibility.updated" : "compatibility.created",
      entityType: "compatibility",
      entityId: row.id,
      summary: `${previous ? "Updated" : "Created"} ${year} ${make} ${model}: ${status}, ${batterySizes}.`,
      details: {
        before: previous || null,
        after: row,
      },
    });

    return json({
      success: true,
      record: row,
      message: `Compatibility decision ${previous ? "updated" : "saved"}.`,
      auditSaved,
    });
  } catch (error) {
    console.error("Admin compatibility save error:", error);
    return json({ success: false, error: "Could not save the compatibility decision." }, 500);
  }
}

export function onRequestDelete() {
  return methodNotAllowed(["GET", "POST"]);
}
