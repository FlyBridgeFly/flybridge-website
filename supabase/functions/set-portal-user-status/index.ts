import {
  corsHeaders,
  failureResponse,
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

const allowedStatuses = new Set(["active", "inactive", "suspended", "archived"]);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const userId = requireString(body, "userId");
    const status = requireString(body, "status");

    if (!allowedStatuses.has(status)) {
      throw new Error("Unsupported status value.");
    }

    const profile = await getProfileById(adminClient, userId);
    if (profile.role !== "parent" && profile.role !== "tutor") {
      throw new Error("Only parent and tutor portal users can be managed from this tool.");
    }

    await setPortalUserStatus(adminClient, {
      userId,
      status: status as "active" | "inactive" | "suspended" | "archived",
      actorId: adminUser.id
    });
    if (status === "archived") {
      await setPortalAuthAccess(adminClient, {
        userId,
        disabled: true
      });
    }
    if (status === "active") {
      await setPortalAuthAccess(adminClient, {
        userId,
        disabled: false
      });
    }

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action:
        status === "archived"
          ? "account_archived"
          : status === "active"
            ? "account_reactivated"
            : status === "suspended"
              ? "account_suspended"
              : "account_status_changed",
      entityType: profile.role,
      entityId: userId,
      metadata: {
        status
      }
    });

    return successResponse("Account status updated successfully.", {
      userId,
      role: profile.role,
      status
    });
  } catch (error) {
    return failureFromError(error, "Unable to update account status.");
  }
});
