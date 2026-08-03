import { json, methodNotAllowed, textField } from "../../_lib/http.js";
import { normalizeVehicleValue } from "../../_lib/vehicles.js";

const publicResult = ({ year, make, model, status, battery, source, listed = true }) => ({
  year,
  make,
  model,
  listed,
  status,
  battery: battery || null,
  source,
  compatibleWithCurrentCR2032Model:
    status === "verified" || status === "compatible"
      ? true
      : status === "incompatible"
        ? false
        : null,
  caution:
    status === "conditional"
      ? "Battery size or key-fob style varies. Confirm the marking inside the specific key fob."
      : status === "unknown" || status === "unlisted"
        ? "Compatibility has not been confirmed. Check the battery marking and compartment clearance."
        : null
});

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const year = Number(url.searchParams.get("year"));
  const make = textField(url.searchParams.get("make"), 80);
  const model = textField(url.searchParams.get("model"), 120);

  if (!Number.isInteger(year) || !make || !model) {
    return json(
      { success: false, error: "Year, make, and model are required." },
      400,
      { "Access-Control-Allow-Origin": "*" }
    );
  }

  try {
    const row = await context.env.DB.prepare(`
      SELECT year, make, model, status, battery_sizes
      FROM vehicles
      WHERE year = ? AND make_normalized = ? AND model_normalized = ?
      LIMIT 1
    `)
      .bind(year, normalizeVehicleValue(make), normalizeVehicleValue(model))
      .first();

    return json(
      {
        success: true,
        result: publicResult(row ? {
          year: row.year,
          make: row.make,
          model: row.model,
          status: row.status,
          battery: row.battery_sizes,
          source: "d1-catalogue"
        } : {
          year,
          make,
          model,
          status: "unlisted",
          battery: null,
          source: "d1-catalogue",
          listed: false
        })
      },
      200,
      {
        "Cache-Control": "public, max-age=30, s-maxage=30",
        "Access-Control-Allow-Origin": "*",
        "Content-Signal": "search=yes, ai-input=yes, ai-train=no"
      }
    );
  } catch (error) {
    console.error("Agent compatibility database lookup error:", error);
    return json(
      { success: false, error: "Compatibility information is temporarily unavailable." },
      503,
      { "Access-Control-Allow-Origin": "*" }
    );
  }
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
