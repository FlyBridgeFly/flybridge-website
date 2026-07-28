import {
  corsHeaders,
  failureResponse,
  generateTemporaryPassword,
  getProfileById,
  parseBody,
  recordAuditLog,
  requireAdmin,
  requireString,
  sendPortalCredentialsEmail,
  sendPortalReminderEmail,
  successResponse,
  updatePortalPassword
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
    const resetPassword = Boolean(body.resetPassword);

    if (profile.role !== "parent" && profile.role !== "tutor") {
      throw new Error("Only parent and tutor portal users can receive portal welcome or reminder emails.");
    }

    if (!profile.email) {
      throw new Error("The selected profile does not have an email address.");
    }

    if (resetPassword) {
      const password = generateTemporaryPassword();
      await updatePortalPassword(adminClient, {
        userId,
        password
      });
      const emailResult = await sendPortalCredentialsEmail({
        email: String(profile.email),
        fullName: typeof profile.full_name === "string" ? profile.full_name : undefined,
        role: profile.role,
        password
      });

      await recordAuditLog(adminClient, {
        actorId: adminUser.id,
        action: "welcome_email_resent",
        entityType: profile.role,
        entityId: userId,
        metadata: {
          email: profile.email
        }
      });

      return successResponse(emailResult.sent ? "Welcome email resent successfully." : emailResult.message, {
        userId,
        role: profile.role,
        email: profile.email
      });
    }

    const reminderResult = await sendPortalReminderEmail({
      email: String(profile.email),
      fullName: typeof profile.full_name === "string" ? profile.full_name : undefined,
      role: profile.role
    });

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action: "welcome_email_resent",
      entityType: profile.role,
      entityId: userId,
      metadata: {
        email: profile.email,
        reminderOnly: true
      }
    });

    return successResponse(reminderResult.sent ? "Login reminder sent successfully." : reminderResult.message, {
      userId,
      role: profile.role,
      email: profile.email
    });
  } catch (error) {
    return failureResponse(400, error instanceof Error ? error.message : "Unable to resend FlyBridge access details.");
  }
});
