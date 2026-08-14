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
    action: "launch_notify",
    limit: 6,
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
    expectedAction: "launch_notify",
  });
  if (!turnstile.ok) {
    return json({ success: false, error: turnstile.error }, turnstile.status);
  }

  const email = textField(data.email, 160).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: "Please enter a valid email address." }, 400);
  }

  const now = new Date().toISOString();
  const pageUrl = textField(data.pageUrl, 500) || null;
  const userAgent = textField(context.request.headers.get("User-Agent"), 500) || null;

  try {
    const existing = await context.env.DB.prepare(
      "SELECT id, status FROM launch_notifications WHERE email = ? COLLATE NOCASE"
    ).bind(email).first();

    if (existing) {
      await context.env.DB.prepare(`
        UPDATE launch_notifications
        SET status = 'subscribed', updated_at = ?, unsubscribed_at = NULL,
            page_url = ?, user_agent = ?
        WHERE id = ?
      `).bind(now, pageUrl, userAgent, existing.id).run();

      return json({
        success: true,
        notificationId: existing.id,
        message: "You’re already on the list. We’ll email you when Lo-Key is available.",
      }, 200);
    }

    const result = await context.env.DB.prepare(`
      INSERT INTO launch_notifications
        (email, status, subscribed_at, updated_at, page_url, user_agent)
      VALUES (?, 'subscribed', ?, ?, ?, ?)
    `).bind(email, now, now, pageUrl, userAgent).run();

    return json({
      success: true,
      notificationId: result.meta?.last_row_id,
      message: "You’re on the list. We’ll email you when Lo-Key is available.",
    }, 201);
  } catch (error) {
    console.error("Launch notification insert error:", error);
    return json({ success: false, error: "Your email could not be saved. Please try again." }, 500);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
