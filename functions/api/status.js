import { json, methodNotAllowed } from "../_lib/http.js";

export async function onRequestGet(context) {
  let database = "unavailable";

  try {
    if (context.env.DB) {
      const result = await context.env.DB.prepare("SELECT 1 AS ok").first();
      database = Number(result?.ok) === 1 ? "ok" : "degraded";
    }
  } catch (error) {
    console.error("Public API status database check failed:", error);
    database = "degraded";
  }

  const healthy = database === "ok";
  return json(
    {
      status: healthy ? "ok" : "degraded",
      service: "Lo-Key public API",
      version: "1.0.0",
      database,
      time: new Date().toISOString()
    },
    healthy ? 200 : 503,
    {
      "Access-Control-Allow-Origin": "*",
      "Content-Signal": "search=yes, ai-input=yes, ai-train=no"
    }
  );
}

export function onRequestPost() {
  return methodNotAllowed(["GET"]);
}
