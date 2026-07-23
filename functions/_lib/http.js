export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function readJson(request) {
  const contentType = request.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("Expected an application/json request body.");
  }
  return request.json();
}

export function textField(value, maxLength) {
  return String(value ?? "").trim().slice(0, maxLength);
}

export function methodNotAllowed(allowed) {
  return json(
    { success: false, error: "Method not allowed." },
    405,
    { Allow: allowed.join(", ") }
  );
}
