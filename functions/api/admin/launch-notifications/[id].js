import { json } from "../../../_lib/http.js";
import { isAdminRequest } from "../../../_lib/security.js";
import { writeAudit } from "../../../_lib/audit.js";

export async function onRequestDelete(context) {
  if (!isAdminRequest(context.request, context.env)) return json({success:false,error:"Unauthorized."},401);
  const id = Number(context.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return json({success:false,error:"Invalid signup ID."},400);
  try {
    const result = await context.env.DB.prepare("DELETE FROM launch_notifications WHERE id = ?").bind(id).run();
    if (!result.meta?.changes) return json({success:false,error:"Signup not found."},404);
    const auditSaved = await writeAudit(context, {action:"launch_notification.deleted",entityType:"launch_notification",entityId:id,summary:`Deleted Notify Me signup #${id}.`});
    return json({success:true,auditSaved});
  } catch (error) {
    console.error("Delete signup error:",error);
    return json({success:false,error:"Could not delete signup."},500);
  }
}
