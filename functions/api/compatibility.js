import { json, methodNotAllowed, textField } from "../_lib/http.js";
import { buildVehicleCatalogue, normalizeVehicleValue, publicVehicle } from "../_lib/vehicles.js";

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const hasYear = url.searchParams.has("year");
  const hasMake = url.searchParams.has("make");
  const hasModel = url.searchParams.has("model");

  try {
    if (!hasYear && !hasMake && !hasModel) {
      const result = await context.env.DB.prepare(`
        SELECT year, make, model
        FROM vehicles
        ORDER BY year DESC, make COLLATE NOCASE, model COLLATE NOCASE
      `).all();
      return json(
        { success: true, ...buildVehicleCatalogue(result.results || []) },
        200,
        { "Cache-Control": "public, max-age=30, s-maxage=30" }
      );
    }

    const year = Number(url.searchParams.get("year"));
    const make = textField(url.searchParams.get("make"), 80);
    const model = textField(url.searchParams.get("model"), 120);
    if (!Number.isInteger(year) || !make || !model) {
      return json({ success: false, error: "Year, make, and model are required." }, 400);
    }

    const row = await context.env.DB.prepare(`
      SELECT id, year, make, model, status, battery_sizes, confidence, source, created_at, updated_at
      FROM vehicles
      WHERE year = ? AND make_normalized = ? AND model_normalized = ?
      LIMIT 1
    `)
      .bind(year, normalizeVehicleValue(make), normalizeVehicleValue(model))
      .first();

    return json(
      { success: true, result: publicVehicle(row) },
      200,
      { "Cache-Control": "public, max-age=15, s-maxage=15" }
    );
  } catch (error) {
    console.error("Compatibility API error:", error);
    return json({ success: false, error: "Compatibility information is temporarily unavailable." }, 500);
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
