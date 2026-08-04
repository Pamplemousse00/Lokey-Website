import { json, methodNotAllowed, readJson, textField } from "../_lib/http.js";
import { checkRateLimit, verifyTurnstile } from "../_lib/security.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedTopics = new Set([
  "Compatibility",
  "Product question",
  "Preorder or order",
  "Shipping",
  "Return or warranty",
  "Privacy request",
  "Other",
]);

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

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
    action: "contact_submit",
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
    expectedAction: "contact_submit",
  });
  if (!turnstile.ok) {
    return json({ success: false, error: turnstile.error }, turnstile.status);
  }

  const name = textField(data.name, 80);
  const email = textField(data.email, 160).toLowerCase();
  const topic = textField(data.topic, 60);
  const orderNumber = textField(data.orderNumber, 50) || null;
  const vehicle = textField(data.vehicle, 140) || null;
  const message = textField(data.message, 2500);
  const pageUrl = textField(data.pageUrl, 500) || null;
  const userAgent = textField(context.request.headers.get("User-Agent"), 500) || null;

  if (name.length < 2) return json({ success: false, error: "Please enter your name." }, 400);
  if (!emailPattern.test(email)) return json({ success: false, error: "Please enter a valid email address." }, 400);
  if (!allowedTopics.has(topic)) return json({ success: false, error: "Please choose a valid topic." }, 400);
  if (message.length < 10) return json({ success: false, error: "Please enter at least 10 characters in your message." }, 400);

  const submittedAt = new Date().toISOString();
  let messageId;

  try {
    const inserted = await context.env.DB.prepare(`
      INSERT INTO contact_messages
        (name, email, topic, order_number, vehicle, message, delivery_status,
         submitted_at, page_url, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
    `).bind(
      name,
      email,
      topic,
      orderNumber,
      vehicle,
      message,
      submittedAt,
      pageUrl,
      userAgent
    ).run();
    messageId = inserted.meta?.last_row_id;
  } catch (error) {
    console.error("Contact-message database error:", error);
    return json({ success: false, error: "The message could not be saved. Please try again." }, 500);
  }

  const apiKey = String(context.env.RESEND_API_KEY || "").trim();
  const from = String(context.env.CONTACT_FROM_EMAIL || "").trim();
  const to = String(context.env.CONTACT_TO_EMAIL || "neerajsbb@gmail.com").trim();

  if (!apiKey || !from || !to) {
    const deliveryError = "Email delivery is not configured.";
    await context.env.DB.prepare(`
      UPDATE contact_messages
      SET delivery_status = 'configuration_error', delivery_error = ?
      WHERE id = ?
    `).bind(deliveryError, messageId).run().catch(() => {});
    console.error("Contact email configuration error:", {
      hasApiKey: Boolean(apiKey),
      hasFromAddress: Boolean(from),
      hasToAddress: Boolean(to),
      messageId,
    });
    return json({
      success: true,
      queued: true,
      messageId,
      message: "Thanks. Your message has been received. Email delivery is temporarily delayed, but your submission was saved.",
    }, 202);
  }

  const subject = `[Lo-Key website] ${topic} — ${name}`;
  const textBody = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Topic: ${topic}`,
    `Order number: ${orderNumber || "Not provided"}`,
    `Vehicle: ${vehicle || "Not provided"}`,
    `Submitted: ${submittedAt}`,
    `Page: ${pageUrl || "Not provided"}`,
    "",
    message,
  ].join("\n");

  const htmlBody = `
    <h2>New Lo-Key website message</h2>
    <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
      <tr><th align="left">Name</th><td>${escapeHtml(name)}</td></tr>
      <tr><th align="left">Email</th><td>${escapeHtml(email)}</td></tr>
      <tr><th align="left">Topic</th><td>${escapeHtml(topic)}</td></tr>
      <tr><th align="left">Order number</th><td>${escapeHtml(orderNumber || "Not provided")}</td></tr>
      <tr><th align="left">Vehicle</th><td>${escapeHtml(vehicle || "Not provided")}</td></tr>
      <tr><th align="left">Submitted</th><td>${escapeHtml(submittedAt)}</td></tr>
    </table>
    <h3>Message</h3>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>`;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "Lo-Key-Website/1.0",
        "Idempotency-Key": `lokey-contact-${messageId}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
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

    await context.env.DB.prepare(`
      UPDATE contact_messages
      SET delivery_status = 'sent', email_provider_id = ?, delivered_at = ?, delivery_error = NULL
      WHERE id = ?
    `).bind(String(result.id || ""), new Date().toISOString(), messageId).run();

    return json({ success: true, messageId, message: "Thanks. Your message has been sent." }, 201);
  } catch (error) {
    console.error("Contact email delivery error:", error);
    await context.env.DB.prepare(`
      UPDATE contact_messages
      SET delivery_status = 'failed', delivery_error = ?
      WHERE id = ?
    `).bind(String(error?.message || error).slice(0, 500), messageId).run().catch(() => {});
    return json({
      success: true,
      queued: true,
      messageId,
      message: "Thanks. Your message has been received. Email delivery is temporarily delayed, but your submission was saved.",
    }, 202);
  }
}

export function onRequestGet() {
  return methodNotAllowed(["POST"]);
}
