import {
  corsHeaders,
  deletePortalUserSecure,
  failureResponse,
  getProfileById,
  optionalString,
  parseBody,
  recordAuditLog,
  requireAdmin,
  requireString,
  successResponse
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const userId = requireString(body, "userId");
    const email = requireString(body, "email");
    const entityType = requireString(body, "entityType");
    const confirmationEmail = requireString(body, "confirmationEmail");
    const profile = await getProfileById(adminClient, userId);

    if (entityType !== "parent" && entityType !== "tutor") {
      return failureResponse(400, "Unsupported entity type for permanent deletion.");
    }

    if (profile.role !== entityType) {
      return failureResponse(400, "The selected account type did not match the stored profile.");
    }

    if (profile.role !== "parent" && profile.role !== "tutor") {
      return failureResponse(400, "Only parent and tutor portal users can be permanently deleted from this tool.");
    }

    const profileEmail = String(profile.email ?? "").trim();
    if (!profileEmail) {
      return failureResponse(400, "The selected account does not have a stored email address.");
    }

    if (email.trim() !== profileEmail) {
      return failureResponse(400, "The supplied email did not match the selected portal account.");
    }

    if (confirmationEmail.trim() !== profileEmail) {
      return failureResponse(400, "The typed email confirmation did not match the selected account.");
    }

    if (userId === adminUser.id) {
      return failureResponse(403, "You cannot delete the currently signed-in admin account.");
    }

    const deletionNote = optionalString(body, "deletionNote");

    await deletePortalUserSecure(adminClient, {
      userId,
      role: profile.role,
      email: profile.email ?? null,
      adminUserId: adminUser.id
    });

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action: "permanent_deletion",
      entityType: profile.role,
      entityId: userId,
      metadata: {
        email: profile.email ?? null,
        deletedRole: profile.role,
        deletionNote: deletionNote ?? null
      }
    });

    return successResponse(`${profile.role === "parent" ? "Parent" : "Tutor"} account deleted successfully.`, {
      deletedUserId: userId,
      role: profile.role
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the portal user.";

    if (message.toLowerCase().includes("missing bearer token") || message.toLowerCase().includes("verify the current user")) {
      return failureResponse(401, "Your session has expired. Sign in again.");
    }

    if (message.toLowerCase().includes("only admin users")) {
      return failureResponse(403, "You do not have permission to delete this account.");
    }

    if (message.toLowerCase().includes("selected portal profile")) {
      return failureResponse(404, "The account could not be found.");
    }

    if (message.toLowerCase().includes("foreign key") || message.toLowerCase().includes("constraint")) {
      return failureResponse(409, `This account still has protected records and cannot be permanently deleted. ${message}`);
    }

    return failureResponse(500, message);
  }
});
