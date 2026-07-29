import {
  corsHeaders,
  failureFromError,
  getProfileById,
  parseBody,
  recordAuditLog,
  requireAdmin,
  requireString,
  setPortalAuthAccess,
  setPortalUserStatus,
  successResponse
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let targetUserId: string | null = null;
  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const userId = requireString(body, "userId");
    targetUserId = userId;
    const profile = await getProfileById(adminClient, userId);

    console.info("[restore-portal-user] start", {
      userId,
      role: profile.role ?? null
    });

    if (profile.role !== "parent" && profile.role !== "tutor") {
      throw new Error("Only parent and tutor portal users can be restored from this tool.");
    }

    await setPortalUserStatus(adminClient, {
      userId,
      status: "active",
      actorId: adminUser.id
    });
    await setPortalAuthAccess(adminClient, {
      userId,
      disabled: false
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
    console.error("[restore-portal-user] failed", {
      userId: targetUserId,
      stage: error instanceof Error && "stage" in error ? (error as { stage?: string }).stage ?? "validation" : "validation",
      message: error instanceof Error ? error.message : "Unknown restore failure"
    });
    return failureFromError(error, "Unable to restore the portal user.");
  }
});
