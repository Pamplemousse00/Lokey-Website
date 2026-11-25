import { json, methodNotAllowed, readJson, textField } from "../_lib/http.js";
import { checkRateLimit, verifyTurnstile } from "../_lib/security.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const adminAlertConfig = (env) => ({
  apiKey: String(env.RESEND_API_KEY || "").trim(),
  from: String(env.LAUNCH_NOTIFY_FROM_EMAIL || env.CONTACT_FROM_EMAIL || "").trim(),
  to: String(env.LAUNCH_NOTIFY_TO_EMAIL || env.CONTACT_TO_EMAIL || "neerajsbb@gmail.com").trim(),
});

async function sendAdminSignupAlert({ env, notificationId, email, subscribedAt, pageUrl, subscriberCount }) {
  const { apiKey, from, to } = adminAlertConfig(env);
  if (!apiKey || !from || !to) {
    console.error("Launch signup email configuration error:", {
      hasApiKey: Boolean(apiKey),
      hasFromAddress: Boolean(from),
      hasToAddress: Boolean(to),
      notificationId,
    });
    return { status: "not_configured" };
  }

  const source = pageUrl || "Not provided";
  const countText = Number.isFinite(Number(subscriberCount))
    ? Number(subscriberCount).toLocaleString("en-CA")
    : "Unknown";
  const textBody = [
    "New Lo-Key Notify Me signup",
    "",
    `Email: ${email}`,
    `Signed up: ${subscribedAt}`,
    `Source: ${source}`,
    `Current subscribed list: ${countText}`,
  ].join("\n");
  const htmlBody = `
    <h2>New Lo-Key Notify Me signup</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><th align="left">Email</th><td>${escapeHtml(email)}</td></tr>
      <tr><th align="left">Signed up</th><td>${escapeHtml(subscribedAt)}</td></tr>
      <tr><th align="left">Source</th><td>${escapeHtml(source)}</td></tr>
      <tr><th align="left">Current subscribed list</th><td>${escapeHtml(countText)}</td></tr>
    </table>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Lo-Key-Website/1.0",
        "Idempotency-Key": `lokey-launch-${notificationId}-${Date.parse(subscribedAt)}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `[Lo-Key] New Notify Me signup — ${email}`,
        text: textBody,
        html: htmlBody,
      }),
    });

    const responseBody = await response.text();
    let result = {};
    try {
      result = responseBody ? JSON.parse(responseBody) : {};
    } catch {
      result = { message: responseBody };
    }

    if (!response.ok) {
      const providerMessage = result?.message || result?.error || responseBody || `Email provider returned ${response.status}.`;
      throw new Error(`Resend ${response.status}: ${providerMessage}`);
    }

    return { status: "sent", providerId: String(result.id || "") };
  } catch (error) {
    console.error("Launch signup admin email delivery error:", error);
    return { status: "failed", error: String(error?.message || error).slice(0, 500) };
  }
}

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
  if (!emailPattern.test(email)) {
    return json({ success: false, error: "Please enter a valid email address." }, 400);
  }

  const now = new Date().toISOString();
  const pageUrl = textField(data.pageUrl, 500) || null;
  const userAgent = textField(context.request.headers.get("User-Agent"), 500) || null;

  let notificationId;
  let isNewSignup = false;
  let isResubscribe = false;

  try {
    const existing = await context.env.DB.prepare(
      "SELECT id, status FROM launch_notifications WHERE email = ? COLLATE NOCASE"
    ).bind(email).first();

    if (existing) {
      isResubscribe = existing.status !== "subscribed";
      notificationId = existing.id;
      await context.env.DB.prepare(`
        UPDATE launch_notifications
        SET status = 'subscribed', updated_at = ?, unsubscribed_at = NULL,
            page_url = ?, user_agent = ?
        WHERE id = ?
      `).bind(now, pageUrl, userAgent, existing.id).run();
    } else {
      const result = await context.env.DB.prepare(`
        INSERT INTO launch_notifications
          (email, status, subscribed_at, updated_at, page_url, user_agent)
        VALUES (?, 'subscribed', ?, ?, ?, ?)
      `).bind(email, now, now, pageUrl, userAgent).run();
      notificationId = result.meta?.last_row_id;
      isNewSignup = true;
    }
  } catch (error) {
    console.error("Launch notification database error:", error);
    return json({ success: false, error: "Your email could not be saved. Please try again." }, 500);
  }

  let adminAlert = { status: "not_needed" };
  if (isNewSignup || isResubscribe) {
    let subscriberCount = null;
    try {
      const countRow = await context.env.DB.prepare(
        "SELECT COUNT(*) AS count FROM launch_notifications WHERE status = 'subscribed'"
      ).first();
      subscriberCount = Number(countRow?.count ?? 0);
    } catch (error) {
      console.error("Launch notification count error:", error);
    }

    const alertPromise = sendAdminSignupAlert({
      env: context.env,
      notificationId,
      email,
      subscribedAt: now,
      pageUrl,
      subscriberCount,
    });
    if (typeof context.waitUntil === "function") {
      context.waitUntil(alertPromise);
      adminAlert = { status: "queued" };
    } else {
      adminAlert = await alertPromise;
    }
  }

  return json({
    success: true,
    notificationId,
    adminAlert: adminAlert.status,
    message: isNewSignup || isResubscribe
      ? "You’re on the list. We’ll email you when Lo-Key is available."
      : "You’re already on the list. We’ll email you when Lo-Key is available.",
  }, isNewSignup ? 201 : 200);
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
