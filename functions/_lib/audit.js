const ACTOR_LIMIT = 160;
const SUMMARY_LIMIT = 500;
const DETAILS_LIMIT = 12000;

const clean = (value, limit) => String(value || "")
  .replace(/[\u0000-\u001F\u007F]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, limit);

export function adminActor(request) {
  const accessEmail = request.headers.get("CF-Access-Authenticated-User-Email");
  const suppliedActor = request.headers.get("X-Admin-Actor");
  return clean(accessEmail || suppliedActor || "Admin key user", ACTOR_LIMIT) || "Admin key user";
}

export async function writeAudit(context, {
  action,
  entityType,
  entityId = null,
  summary,
  details = null,
}) {
  try {
    const actor = adminActor(context.request);
    const detailText = details == null
      ? null
      : JSON.stringify(details).slice(0, DETAILS_LIMIT);

    await context.env.DB.prepare(`
      INSERT INTO admin_audit_log
        (actor, action, entity_type, entity_id, summary, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
      .bind(
        actor,
        clean(action, 100),
        clean(entityType, 80),
        entityId == null ? null : String(entityId).slice(0, 100),
        clean(summary, SUMMARY_LIMIT),
        detailText,
        new Date().toISOString()
      )
      .run();

    return true;
  } catch (error) {
    console.error("Admin audit log error:", error);
    return false;
  }
}
