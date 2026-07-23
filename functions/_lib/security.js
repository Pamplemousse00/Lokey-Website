const encoder = new TextEncoder();

function clientIp(request) {
  return (
    request.headers.get("CF-Connecting-IP") ||
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function checkRateLimit({ env, request, action, limit, windowSeconds }) {
  if (!env.DB) {
    return { ok: false, status: 503, error: "Database binding is unavailable." };
  }

  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const salt = String(env.RATE_LIMIT_SALT || "lo-key-rate-limit-v1");
  const ipHash = await sha256Hex(`${salt}:${action}:${clientIp(request)}`);

  try {
    const row = await env.DB.prepare(`
      INSERT INTO submission_rate_limits
        (action, ip_hash, window_start, count)
      VALUES (?, ?, ?, 1)
      ON CONFLICT(action, ip_hash, window_start)
      DO UPDATE SET count = count + 1
      RETURNING count
    `)
      .bind(action, ipHash, windowStart)
      .first();

    if (Math.random() < 0.03) {
      env.DB.prepare(
        "DELETE FROM submission_rate_limits WHERE window_start < ?"
      )
        .bind(now - 7 * 24 * 60 * 60)
        .run()
        .catch(() => {});
    }

    const count = Number(row?.count || 1);
    if (count > limit) {
      return {
        ok: false,
        status: 429,
        error: "Too many submissions. Please try again later.",
        retryAfter: Math.max(1, windowStart + windowSeconds - now),
      };
    }

    return { ok: true, remaining: Math.max(0, limit - count) };
  } catch (error) {
    console.error("Rate-limit database error:", error);
    return { ok: false, status: 503, error: "Submission protection is temporarily unavailable." };
  }
}

export async function verifyTurnstile({ request, env, token, expectedAction }) {
  const secret = String(env.TURNSTILE_SECRET_KEY || "").trim();
  const responseToken = String(token || "").trim();

  if (!secret) {
    return { ok: false, status: 503, error: "Turnstile is not configured on the server." };
  }

  if (!responseToken || responseToken.length > 2048) {
    return { ok: false, status: 400, error: "Please complete the security check." };
  }

  const body = new FormData();
  body.set("secret", secret);
  body.set("response", responseToken);
  body.set("remoteip", clientIp(request));
  body.set("idempotency_key", crypto.randomUUID());

  let result;
  try {
    const verification = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body }
    );
    result = await verification.json();
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return { ok: false, status: 503, error: "The security check could not be verified. Please try again." };
  }

  if (!result?.success) {
    console.warn("Turnstile rejected a token:", result?.["error-codes"] || []);
    return { ok: false, status: 400, error: "The security check expired or failed. Please try again." };
  }

  if (expectedAction && result.action && result.action !== expectedAction) {
    return { ok: false, status: 400, error: "The security check was issued for a different action." };
  }

  const allowedHosts = String(env.TURNSTILE_ALLOWED_HOSTNAMES || "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);

  if (
    allowedHosts.length &&
    result.hostname &&
    !allowedHosts.includes(String(result.hostname).toLowerCase())
  ) {
    return { ok: false, status: 400, error: "The security check was issued for a different website." };
  }

  return { ok: true };
}

function constantTimeEqual(left, right) {
  const a = encoder.encode(String(left));
  const b = encoder.encode(String(right));
  if (a.length !== b.length) return false;

  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a[index] ^ b[index];
  }
  return difference === 0;
}

export function isAdminRequest(request, env) {
  const configuredKey = String(env.ADMIN_API_KEY || "");
  if (!configuredKey) return false;

  const authorization = request.headers.get("Authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return Boolean(match && constantTimeEqual(match[1].trim(), configuredKey));
}
