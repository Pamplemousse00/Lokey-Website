const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });

export async function onRequestPost(context) {
  let data;

  try {
    data = await context.request.json();
  } catch {
    return jsonResponse(
      { success: false, error: "Invalid JSON request." },
      400
    );
  }

  const year = Number(data.year);
  const make = String(data.make || "").trim();
  const model = String(data.model || "").trim();

  const currentYear = new Date().getUTCFullYear();

  if (!Number.isInteger(year) || year < 1980 || year > currentYear + 1) {
    return jsonResponse(
      { success: false, error: "Please enter a valid vehicle year." },
      400
    );
  }

  if (make.length < 1 || make.length > 80) {
    return jsonResponse(
      { success: false, error: "Please enter a valid vehicle make." },
      400
    );
  }

  if (model.length < 1 || model.length > 120) {
    return jsonResponse(
      { success: false, error: "Please enter a valid vehicle model." },
      400
    );
  }

  const pageUrl =
    typeof data.pageUrl === "string"
      ? data.pageUrl.slice(0, 500)
      : null;

  const userAgent =
    context.request.headers.get("User-Agent")?.slice(0, 500) || null;

  try {
    const result = await context.env.DB
      .prepare(`
        INSERT INTO vehicle_requests
          (year, make, model, status, submitted_at, page_url, user_agent)
        VALUES
          (?, ?, ?, 'new', ?, ?, ?)
      `)
      .bind(
        year,
        make,
        model,
        new Date().toISOString(),
        pageUrl,
        userAgent
      )
      .run();

    return jsonResponse(
      {
        success: true,
        requestId: result.meta.last_row_id,
        message: "Vehicle request received.",
      },
      201
    );
  } catch (error) {
    console.error("Vehicle request database error:", error);

    return jsonResponse(
      {
        success: false,
        error: "The request could not be saved. Please try again.",
      },
      500
    );
  }
}

export function onRequestGet() {
  return jsonResponse(
    { success: false, error: "Method not allowed." },
    405
  );
}