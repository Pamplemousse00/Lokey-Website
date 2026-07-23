import { json, methodNotAllowed, textField } from "../_lib/http.js";

const normalize = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const year = Number(url.searchParams.get("year"));
  const make = textField(url.searchParams.get("make"), 80);
  const model = textField(url.searchParams.get("model"), 120);

  if (!Number.isInteger(year) || !make || !model) {
    return json({ success: false, error: "Year, make, and model are required." }, 400);
  }

  try {
    const row = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, updated_at
      FROM compatibility_records
      WHERE year = ? AND make_normalized = ? AND model_normalized = ?
      LIMIT 1
    `)
      .bind(year, normalize(make), normalize(model))
      .first();

    return json(
      {
        success: true,
        result: row
          ? {
              id: row.id,
              year: row.year,
              make: row.make,
              model: row.model,
              status: row.status,
              battery: row.battery_sizes,
              keyFobBattery: row.battery_sizes,
              updatedAt: row.updated_at,
            }
          : null,
      },
      200,
      { "Cache-Control": "public, max-age=30, s-maxage=30" }
    );
  } catch (error) {
    console.error("Compatibility lookup error:", error);
    return json({ success: false, error: "Compatibility information is temporarily unavailable." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
