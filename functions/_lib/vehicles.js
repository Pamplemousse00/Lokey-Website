export const normalizeVehicleValue = (value) => String(value || "")
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

export const statusFromAdminValue = (value, batterySizes = "") => {
  const requested = String(value || "").trim().toLowerCase();
  if (requested === "yes" || requested === "verified") return "verified";
  if (requested === "no" || requested === "incompatible") return "incompatible";
  if (requested === "conditional") return "conditional";
  if (requested === "compatible") return "compatible";
  if (requested !== "probably") return null;

  const batteryText = String(batterySizes || "").trim();
  const listed = [...new Set(
    (batteryText.toUpperCase().match(/\b(?:CR|BR|DL|ECR|LIR)\s*-?\s*\d{4}\b/g) || [])
      .map((item) => item.replace(/[\s-]+/g, ""))
  )];
  return listed.length > 1 || /\bvar(?:y|ies)\b|\bor\b|\+|\/|&/i.test(batteryText)
    ? "conditional"
    : "compatible";
};

export const publicVehicle = (row) => row ? {
  id: row.id,
  year: row.year,
  make: row.make,
  model: row.model,
  status: row.status,
  battery: row.battery_sizes,
  keyFobBattery: row.battery_sizes,
  confidence: row.confidence || null,
  source: row.source || "database",
  createdAt: row.created_at,
  updatedAt: row.updated_at,
} : null;

export const buildVehicleCatalogue = (rows) => {
  const years = [...new Set(rows.map((row) => Number(row.year)).filter(Number.isInteger))]
    .sort((a, b) => b - a);
  const makeMap = new Map();

  for (const row of rows) {
    const make = String(row.make || "").trim();
    const model = String(row.model || "").trim();
    const year = Number(row.year);
    if (!make || !model || !Number.isInteger(year)) continue;
    if (!makeMap.has(make)) makeMap.set(make, new Map());
    const modelMap = makeMap.get(make);
    if (!modelMap.has(model)) modelMap.set(model, new Set());
    modelMap.get(model).add(year);
  }

  const makes = [...makeMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, modelMap]) => ({
      name,
      models: [...modelMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .flatMap(([modelName, yearSet]) => {
          const sorted = [...yearSet].sort((a, b) => a - b);
          const ranges = [];
          let start = null;
          let previous = null;
          for (const year of sorted) {
            if (start == null) {
              start = previous = year;
            } else if (year === previous + 1) {
              previous = year;
            } else {
              ranges.push({ name: modelName, from: start, to: previous });
              start = previous = year;
            }
          }
          if (start != null) ranges.push({ name: modelName, from: start, to: previous });
          return ranges;
        }),
    }));

  return {
    schemaVersion: 10,
    source: "d1",
    generatedAt: new Date().toISOString(),
    years,
    makes,
    vehicleYearCount: rows.length,
  };
};
