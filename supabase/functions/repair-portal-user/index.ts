import {
  corsHeaders,
  ensureProfileMissing,
  failureFromError,
  generateTemporaryPassword,
  getAuthUserById,
  optionalString,
  parseBody,
  provisionPortalAccount,
  requireAdmin,
  requirePortalRole,
  requireString,
  successResponse,
  updateAuthUser
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const authUserId = requireString(body, "authUserId");
    const fullName = requireString(body, "fullName");
    const role = requirePortalRole(body);
    const studentId = optionalString(body, "studentId");
    const requestedEmail = optionalString(body, "email");

    const authUser = await getAuthUserById(adminClient, authUserId);
    await ensureProfileMissing(adminClient, authUserId);

    const email = requestedEmail ?? authUser.email ?? "";
    if (!email) {
      throw new Error("The selected authentication user does not have an email address.");
    }

    const password = generateTemporaryPassword();
    await updateAuthUser(adminClient, authUserId, {
      email,
      email_confirm: true,
      password,
      user_metadata: {
        full_name: fullName,
        role
      }
    });

    const result = await provisionPortalAccount({
      adminClient,
      adminUserId: adminUser.id,
      email,
      fullName,
      role,
      password,
      studentId,
      skipAuthCreate: true,
      existingAuthUserId: authUserId,
      auditAction: "account_repaired"
    });

    return successResponse(result.message, {
      role,
      userId: result.userId,
      email: result.email,
      emailSent: result.emailSent,
      stage: result.stage,
      warning: result.warning
    });
  } catch (error) {
    return failureFromError(error, "Unable to repair the portal user.");
  }
});
