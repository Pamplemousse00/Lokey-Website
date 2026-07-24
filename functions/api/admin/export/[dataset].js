import { json, methodNotAllowed } from "../../../_lib/http.js";
import { isAdminRequest } from "../../../_lib/security.js";

const csvCell = (value) => {
  if (value == null) return "";
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

const toCsv = (headers, rows) => {
  const lines = [headers.map(csvCell).join(",")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header])).join(","));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
};

const exportDefinitions = {
  reviews: {
    filename: "lokey-reviews.csv",
    headers: [
      "id", "name", "country", "vehicle", "rating", "title", "body",
      "order_number", "purchase_email", "verified", "verification_status",
      "approved", "moderation_status", "created_at", "updated_at",
      "approved_at", "rejected_at",
    ],
    sql: `
      SELECT id, name, country, vehicle, rating, title, body, order_number,
             purchase_email, verified, verification_status, approved,
             moderation_status, created_at, updated_at, approved_at, rejected_at
      FROM reviews
      ORDER BY created_at DESC, id DESC
      LIMIT 10000
    `,
  },
  "vehicle-requests": {
    filename: "lokey-vehicle-requests.csv",
    headers: ["id", "year", "make", "model", "battery_sizes", "status", "submitted_at", "page_url", "user_agent"],
    sql: `
      SELECT id, year, make, model, battery_sizes, status, submitted_at, page_url, user_agent
      FROM vehicle_requests
      ORDER BY submitted_at DESC, id DESC
      LIMIT 10000
    `,
  },
  compatibility: {
    filename: "lokey-compatibility.csv",
    headers: ["id", "year", "make", "model", "status", "battery_sizes", "created_at", "updated_at"],
    sql: `
      SELECT id, year, make, model, status, battery_sizes, created_at, updated_at
      FROM compatibility_records
      ORDER BY updated_at DESC, id DESC
      LIMIT 10000
    `,
  },
  "cart-events": {
    filename: "lokey-cart-events.csv",
    headers: ["id", "quantity", "source", "page_url", "created_at"],
    sql: `
      SELECT id, quantity, source, page_url, created_at
      FROM cart_events
      ORDER BY created_at DESC, id DESC
      LIMIT 10000
    `,
  },
  "audit-log": {
    filename: "lokey-admin-audit-log.csv",
    headers: ["id", "actor", "action", "entity_type", "entity_id", "summary", "details_json", "created_at"],
    sql: `
      SELECT id, actor, action, entity_type, entity_id, summary, details_json, created_at
      FROM admin_audit_log
      ORDER BY created_at DESC, id DESC
      LIMIT 10000
    `,
  },
};

export async function onRequestGet(context) {
  if (!isAdminRequest(context.request, context.env)) {
    return json({ success: false, error: "Unauthorized." }, 401);
  }

  const dataset = String(context.params.dataset || "").toLowerCase();
  const definition = exportDefinitions[dataset];
  if (!definition) {
    return json({ success: false, error: "Unknown export dataset." }, 404);
  }

  try {
    const result = await context.env.DB.prepare(definition.sql).all();
    return new Response(toCsv(definition.headers, result.results || []), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${definition.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error(`CSV export error (${dataset}):`, error);
    return json({ success: false, error: "Could not create the CSV export." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
