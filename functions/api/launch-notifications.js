import { emailDate } from "../_lib/email-date.js";
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
  to: [...new Set(String(env.LAUNCH_NOTIFY_TO_EMAIL || env.CONTACT_TO_EMAIL || "neerajsbb@gmail.com")
    .split(/[,;\n]+/).map(address => address.trim().toLowerCase()).filter(Boolean))],
});

async function sendAdminSignupAlert({ env, notificationId, email, subscribedAt, pageUrl, subscriberCount, recentSubscribers }) {
  const { apiKey, from, to } = adminAlertConfig(env);
  if (!apiKey || !from || !to.length || to.some(address => !emailPattern.test(address))) {
    console.error("Launch signup email configuration error:", {
      hasApiKey: Boolean(apiKey),
      hasFromAddress: Boolean(from),
      hasToAddress: Boolean(to.length),
      notificationId,
    });
    return { status: "not_configured", error: "Missing API key, sender or valid recipient configuration." };
  }

  const source = pageUrl || "Not provided";
  const countText = subscriberCount !== null && Number.isFinite(Number(subscriberCount))
    ? Number(subscriberCount).toLocaleString("en-CA")
    : "Unknown";
  const signedUp = emailDate(subscribedAt);
  const recentText = recentSubscribers === null ? ["Subscriber list temporarily unavailable."] : recentSubscribers.length ? recentSubscribers.map((row, index) => `${index + 1}. ${row.email} — ${emailDate(row.subscribed_at)}`) : ["No active subscribers."];
  const recentHtml = recentSubscribers === null ? "<p>Subscriber list temporarily unavailable.</p>" : recentSubscribers.length ? `<table cellpadding="6" cellspacing="0" style="border-collapse:collapse"><thead><tr><th align="left">Email</th><th align="left">Signed up (Eastern)</th></tr></thead><tbody>${recentSubscribers.map(row => `<tr><td>${escapeHtml(row.email)}</td><td>${escapeHtml(emailDate(row.subscribed_at))}</td></tr>`).join("")}</tbody></table>` : "<p>No active subscribers.</p>";
  const textBody = [
    "New Lo-Key Notify Me signup",
    "",
    `Email: ${email}`,
    `Signed up: ${signedUp}`,
    `Source: ${source}`,
    `Current subscribed list: ${countText}`,
    "",
    "Latest 20 active subscribers (newest first)",
    ...recentText,
  ].join("\n");
  const htmlBody = `
    <h2>New Lo-Key Notify Me signup</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><th align="left">Email</th><td>${escapeHtml(email)}</td></tr>
      <tr><th align="left">Signed up</th><td>${escapeHtml(signedUp)}</td></tr>
      <tr><th align="left">Source</th><td>${escapeHtml(source)}</td></tr>
      <tr><th align="left">Current subscribed list</th><td>${escapeHtml(countText)}</td></tr>
    </table>
    <h3>Latest 20 active subscribers (newest first)</h3>
    ${recentHtml}`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Lo-Key-Website/1.0",
        "Idempotency-Key": `lokey-launch-${notificationId}-${Date.parse(subscribedAt)}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject: `[Lo-Key website] New Notify Me signup — ${email}`,
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
        SET subscribed_at = CASE WHEN status <> 'subscribed' THEN ? ELSE subscribed_at END,
            status = 'subscribed', updated_at = ?, unsubscribed_at = NULL,
            page_url = ?, user_agent = ?
        WHERE id = ?
      `).bind(now, now, pageUrl, userAgent, existing.id).run();
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
    let recentSubscribers = null;
    try {
      const countRow = await context.env.DB.prepare(
        "SELECT COUNT(*) AS count FROM launch_notifications WHERE status = 'subscribed'"
      ).first();
      subscriberCount = Number(countRow?.count ?? 0);
    } catch (error) {
      console.error("Launch notification count error:", error);
    }

    try {
      const recent = await context.env.DB.prepare(`
        SELECT email, subscribed_at FROM launch_notifications
        WHERE status = 'subscribed'
        ORDER BY subscribed_at DESC, id DESC LIMIT 20
      `).all();
      recentSubscribers = recent.results || [];
    } catch (error) {
      console.error("Launch notification recent subscribers error:", error);
    }

    adminAlert = await sendAdminSignupAlert({
      env: context.env,
      notificationId,
      email,
      subscribedAt: now,
      pageUrl,
      subscriberCount,
      recentSubscribers,
    }).catch(error => {
      console.error("Launch alert preparation failed:", error);
      return { status: "failed", error: String(error?.message || error).slice(0, 500) };
    });
    try {
      await context.env.DB.prepare(`INSERT INTO launch_alert_results
        (notification_id, status, provider_id, error, attempted_at)
        VALUES (?, ?, ?, ?, ?) ON CONFLICT(notification_id) DO UPDATE SET
        status=excluded.status, provider_id=excluded.provider_id,
        error=excluded.error, attempted_at=excluded.attempted_at`)
        .bind(notificationId, adminAlert.status, adminAlert.providerId || null,
          adminAlert.error || null, new Date().toISOString()).run();
    } catch (error) {
      console.error("Could not persist launch email result:", error);
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
