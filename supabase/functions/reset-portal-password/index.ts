import {
  corsHeaders,
  failureResponse,
  generateTemporaryPassword,
  parseBody,
  requireAdmin,
  requireString,
  sendPortalCredentialsEmail,
  successResponse,
  updatePortalPassword
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient } = await requireAdmin(request);
    const body = await parseBody(request);
    const userId = requireString(body, "userId");

    const { data: profile, error } = await adminClient.from("profiles").select("*").eq("id", userId).maybeSingle();

    if (error || !profile) {
      throw new Error("Unable to load the selected portal profile.");
    }

    if (profile.role !== "parent" && profile.role !== "tutor") {
      throw new Error("Password resets from this tool are limited to parent and tutor portal accounts.");
    }

    const password = generateTemporaryPassword();
    await updatePortalPassword(adminClient, {
      userId,
      password
    });

    const emailResult = profile.email
      ? await sendPortalCredentialsEmail({
          email: String(profile.email),
          fullName: typeof profile.full_name === "string" ? profile.full_name : undefined,
          role: profile.role,
          password
        })
      : {
          sent: false,
          message: "Password reset completed, but no email address was found on the selected profile."
        };

    return successResponse(
      emailResult.sent
        ? "Temporary password reset successfully and emailed to the portal user."
        : emailResult.message,
      {
        role: profile.role,
        userId,
        email: profile.email ?? null
      }
    );
  } catch (error) {
    return failureResponse(400, error instanceof Error ? error.message : "Unable to reset the portal password.");
  }
});
