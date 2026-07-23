import { json, methodNotAllowed, readJson, textField } from "../_lib/http.js";
import { checkRateLimit, verifyTurnstile } from "../_lib/security.js";

export async function onRequestPost(context) {
  let data;
  try {
    data = await readJson(context.request);
  } catch (error) {
    return json({ success: false, error: error.message || "Invalid JSON request." }, 400);
  }

  const rateLimit = await checkRateLimit({
    env: context.env,
    request: context.request,
    action: "vehicle_request",
    limit: 5,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.ok) {
    return json(
      { success: false, error: rateLimit.error },
      rateLimit.status,
      rateLimit.retryAfter ? { "Retry-After": String(rateLimit.retryAfter) } : {}
    );
  }

  const turnstile = await verifyTurnstile({
    request: context.request,
    env: context.env,
    token: data.turnstileToken,
    expectedAction: "vehicle_request",
  });
  if (!turnstile.ok) {
    return json({ success: false, error: turnstile.error }, turnstile.status);
  }

  const year = Number(data.year);
  const make = textField(data.make, 80);
  const model = textField(data.model, 120);
  const batterySizes = textField(data.batterySizes, 120);
  const currentYear = new Date().getUTCFullYear();

  if (!Number.isInteger(year) || year < 1980 || year > currentYear + 2) {
    return json({ success: false, error: "Please enter a valid vehicle year." }, 400);
  }
  if (!make) return json({ success: false, error: "Please enter the vehicle make." }, 400);
  if (!model) return json({ success: false, error: "Please enter the vehicle model." }, 400);
  if (!batterySizes) return json({ success: false, error: "Please enter the key-fob battery size, or enter Unknown." }, 400);

  const submittedAt = new Date().toISOString();
  const pageUrl = textField(data.pageUrl, 500) || null;
  const userAgent = textField(context.request.headers.get("User-Agent"), 500) || null;

  try {
    const result = await context.env.DB.prepare(`
      INSERT INTO vehicle_requests
        (year, make, model, battery_sizes, status, submitted_at, page_url, user_agent)
      VALUES (?, ?, ?, ?, 'new', ?, ?, ?)
    `)
      .bind(year, make, model, batterySizes, submittedAt, pageUrl, userAgent)
      .run();

    return json(
      {
        success: true,
        requestId: result.meta?.last_row_id,
        message: "Vehicle request received.",
      },
      201
    );
  } catch (error) {
    console.error("Vehicle request database error:", error);
    return json(
      { success: false, error: "The request could not be saved. Please try again." },
      500
    );
  }
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
