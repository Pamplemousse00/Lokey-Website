import { json, methodNotAllowed, readJson, textField } from "../_lib/http.js";
import { checkRateLimit, verifyTurnstile } from "../_lib/security.js";

function publicReview(row) {
  return {
    id: String(row.id),
    name: row.name,
    country: row.country,
    rating: Number(row.rating),
    title: row.title,
    body: row.body,
    date: String(row.created_at || "").slice(0, 10),
    verified: Boolean(row.verified),
    verificationStatus: row.verification_status || "unverified",
  };
}

export async function onRequestGet(context) {
  try {
    const result = await context.env.DB.prepare(`
      SELECT id, name, country, rating, title, body, created_at,
             verified, verification_status
      FROM reviews
      WHERE approved = 1 AND moderation_status = 'approved'
      ORDER BY COALESCE(approved_at, created_at) DESC, id DESC
      LIMIT 250
    `).all();

    const reviews = (result.results || []).map(publicReview);
    return json(
      { success: true, reviews },
      200,
      { "Cache-Control": "public, max-age=60, s-maxage=60" }
    );
  } catch (error) {
    console.error("Review read error:", error);
    return json({ success: false, error: "Reviews are temporarily unavailable." }, 500);
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
    action: "review_submit",
    limit: 3,
    windowSeconds: 24 * 60 * 60,
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
    expectedAction: "review_submit",
  });
  if (!turnstile.ok) {
    return json({ success: false, error: turnstile.error }, turnstile.status);
  }

  const rating = Number(data.rating);
  const name = textField(data.name, 60);
  const country = textField(data.country, 60);
  const title = textField(data.title, 90);
  const body = textField(data.body, 1200);
  const orderNumber = textField(data.orderNumber, 40) || null;
  const email = textField(data.email, 120).toLowerCase() || null;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return json({ success: false, error: "Please choose a rating from 1 to 5 stars." }, 400);
  }
  if (name.length < 2) return json({ success: false, error: "Please enter a display name." }, 400);
  if (!country) return json({ success: false, error: "Please enter a country." }, 400);
  if (title.length < 3) return json({ success: false, error: "Please enter a review title." }, 400);
  if (body.length < 20) return json({ success: false, error: "Please enter at least 20 characters in the review." }, 400);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: "Please enter a valid purchase email." }, 400);
  }

  const verificationStatus = orderNumber && email ? "pending" : "unverified";
  const now = new Date().toISOString();

  try {
    const result = await context.env.DB.prepare(`
      INSERT INTO reviews
        (name, country, rating, title, body, order_number, purchase_email,
         verified, verification_status, approved, moderation_status,
         created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, 'pending', ?, ?)
    `)
      .bind(
        name,
        country,
        rating,
        title,
        body,
        orderNumber,
        email,
        verificationStatus,
        now,
        now
      )
      .run();

    return json(
      {
        success: true,
        reviewId: result.meta?.last_row_id,
        message: "Thank you. Your review was submitted for approval.",
      },
      202
    );
  } catch (error) {
    console.error("Review insert error:", error);
    return json({ success: false, error: "The review could not be saved. Please try again." }, 500);
  }
}

export function onRequestDelete() {
  return methodNotAllowed(["GET", "POST"]);
}
