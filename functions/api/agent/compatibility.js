import { json, methodNotAllowed, textField } from "../../_lib/http.js";

const normalize = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

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
      FROM compatibility_records
      WHERE year = ? AND make_normalized = ? AND model_normalized = ?
      LIMIT 1
    `)
      .bind(year, normalize(make), normalize(model))
      .first();

    if (row) {
      return json(
        {
          success: true,
          result: publicResult({
            year: row.year,
            make: row.make,
            model: row.model,
            status: row.status,
            battery: row.battery_sizes,
            source: "live-database"
          })
        },
        200,
        {
          "Cache-Control": "public, max-age=30, s-maxage=30",
          "Access-Control-Allow-Origin": "*",
          "Content-Signal": "search=yes, ai-input=yes, ai-train=no"
        }
      );
    }
  } catch (error) {
    console.error("Agent compatibility database lookup error:", error);
  }

  try {
    const catalogUrl = new URL("/compatibility-data.json", context.request.url);
    const catalogResponse = await fetch(catalogUrl.toString(), {
      headers: { Accept: "application/json" }
    });
    if (!catalogResponse.ok) throw new Error(`Catalogue returned ${catalogResponse.status}.`);

    const catalog = await catalogResponse.json();
    const selectedMake = normalize(make);
    const selectedModel = normalize(model);
    const rules = Array.isArray(catalog.batteryRules) ? catalog.batteryRules : [];
    const rule = rules.find((entry) =>
      normalize(entry.make) === selectedMake &&
      normalize(entry.model) === selectedModel &&
      year >= Number(entry.from) &&
      year <= Number(entry.to)
    );

    if (rule) {
      return json(
        {
          success: true,
          result: publicResult({
            year,
            make,
            model,
            status: String(rule.status || "unknown").toLowerCase(),
            battery: rule.battery || null,
            source: "static-catalogue"
          })
        },
        200,
        {
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "Access-Control-Allow-Origin": "*",
          "Content-Signal": "search=yes, ai-input=yes, ai-train=no"
        }
      );
    }

    const makeEntry = Array.isArray(catalog.makes)
      ? catalog.makes.find((entry) => normalize(entry.name) === selectedMake)
      : null;
    const modelEntry = makeEntry?.models?.find((entry) =>
      normalize(entry.name) === selectedModel &&
      year >= Number(entry.from) &&
      year <= Number(entry.to)
    );

    return json(
      {
        success: true,
        result: publicResult({
          year,
          make,
          model,
          status: modelEntry ? "unknown" : "unlisted",
          battery: null,
          source: "static-catalogue",
          listed: Boolean(modelEntry)
        })
      },
      200,
      {
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "Access-Control-Allow-Origin": "*",
        "Content-Signal": "search=yes, ai-input=yes, ai-train=no"
      }
    );
  } catch (error) {
    console.error("Agent compatibility catalogue lookup error:", error);
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
