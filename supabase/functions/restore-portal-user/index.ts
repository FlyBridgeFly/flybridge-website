import {
  corsHeaders,
  failureFromError,
  getProfileById,
  parseBody,
  recordAuditLog,
  requireAdmin,
  requireString,
  setPortalUserStatus,
  successResponse
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const userId = requireString(body, "userId");
    const profile = await getProfileById(adminClient, userId);

    if (profile.role !== "parent" && profile.role !== "tutor") {
      throw new Error("Only parent and tutor portal users can be restored from this tool.");
    }

    await setPortalUserStatus(adminClient, {
      userId,
      status: "active",
      actorId: adminUser.id
    });

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action: "account_restored",
      entityType: profile.role,
      entityId: userId,
      metadata: {
        email: profile.email ?? null,
        previousStatus: profile.previous_status ?? profile.status ?? "active"
      }
    });

    return successResponse("Portal user restored successfully.", {
      success: true,
      entityId: userId,
      role: profile.role,
      status: "active"
    });
  } catch (error) {
    return failureFromError(error, "Unable to restore the portal user.");
  }
});
