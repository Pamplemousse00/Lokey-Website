import { json, methodNotAllowed, readJson, textField } from "../_lib/http.js";
import { checkRateLimit } from "../_lib/security.js";

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
    action: "cart_add",
    limit: 120,
    windowSeconds: 60 * 60,
  });
  if (!rateLimit.ok) {
    return json(
      { success: false, error: rateLimit.error },
      rateLimit.status,
      rateLimit.retryAfter ? { "Retry-After": String(rateLimit.retryAfter) } : {}
    );
  }

  const quantity = Number(data.quantity);
  const source = textField(data.source, 40) || "unknown";
  const pageUrl = textField(data.pageUrl, 500) || null;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return json({ success: false, error: "Invalid cart quantity." }, 400);
  }

  try {
    await context.env.DB.prepare(`
      INSERT INTO cart_events (quantity, source, page_url, created_at)
      VALUES (?, ?, ?, ?)
    `)
      .bind(quantity, source, pageUrl, new Date().toISOString())
      .run();

    return json({ success: true }, 202);
  } catch (error) {
    console.error("Cart event insert error:", error);
    return json({ success: false, error: "Cart event could not be recorded." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
