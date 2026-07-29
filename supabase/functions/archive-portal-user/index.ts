import { corsHeaders, failureFromError, optionalString, parseBody, requireAdmin, requireString, revokeParentInvites, setPortalAuthAccess, successResponse } from "../_shared/admin.ts";
import { getProfileById, recordAuditLog, setPortalUserStatus } from "../_shared/admin.ts";

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
    const archiveReason = optionalString(body, "archiveReason");
    const profile = await getProfileById(adminClient, userId);

    console.info("[archive-portal-user] start", {
      userId,
      role: profile.role ?? null
    });

    if (profile.role !== "parent" && profile.role !== "tutor") {
      throw new Error("Only parent and tutor portal users can be archived from this tool.");
    }

    if (String(profile.status ?? "active").toLowerCase() === "archived") {
      return successResponse("Portal user is already archived.", {
        userId,
        role: profile.role,
        status: "archived"
      });
    }

    let inviteResult = null;
    if (profile.role === "parent" && profile.email) {
      inviteResult = await revokeParentInvites(adminClient, {
        userId,
        email: String(profile.email),
        adminUserId: adminUser.id,
        reason: archiveReason
      });
    }

    await setPortalUserStatus(adminClient, {
      userId,
      status: "archived",
      actorId: adminUser.id,
      archiveReason
    });
    await setPortalAuthAccess(adminClient, {
      userId,
      disabled: true
    });

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action: profile.role === "parent" ? "parent.archived" : "account_archived",
      entityType: profile.role,
      entityId: userId,
      metadata: {
        email: profile.email ?? null,
        archiveReason: archiveReason ?? null,
        inviteResult
      }
    });

    return successResponse(profile.role === "parent" ? "Parent account archived successfully." : "Portal user archived successfully.", {
      entityId: userId,
      userId,
      role: profile.role,
      status: "archived"
    });
  } catch (error) {
    console.error("[archive-portal-user] failed", {
      userId: targetUserId,
      stage: error instanceof Error && "stage" in error ? (error as { stage?: string }).stage ?? "validation" : "validation",
      message: error instanceof Error ? error.message : "Unknown archive failure"
    });
    return failureFromError(error, "Unable to archive the portal user.");
  }
});
