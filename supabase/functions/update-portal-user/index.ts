import {
  corsHeaders,
  failureResponse,
  getProfileById,
  optionalString,
  optionalStringArray,
  parseBody,
  recordAuditLog,
  requireAdmin,
  requireString,
  successResponse,
  updatePortalUserProfile
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
      throw new Error("Only parent and tutor portal users can be updated from this tool.");
    }

    const fullName = optionalString(body, "fullName");
    const email = optionalString(body, "email");
    const phone = optionalString(body, "phone");
    const status = optionalString(body, "status");
    const subjects = optionalStringArray(body, "subjects");
    const keyStages = optionalStringArray(body, "keyStages");

    await updatePortalUserProfile(adminClient, {
      userId,
      fullName,
      email,
      phone,
      status,
      subjects,
      keyStages
    });

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action: "account_edited",
      entityType: profile.role,
      entityId: userId,
      metadata: {
        email: email ?? profile.email ?? null,
        status: status ?? profile.status ?? null
      }
    });

    return successResponse("Portal user updated successfully.", {
      userId,
      role: profile.role
    });
  } catch (error) {
    return failureResponse(400, error instanceof Error ? error.message : "Unable to update the portal user.");
  }
});
