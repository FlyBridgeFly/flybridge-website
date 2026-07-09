import {
  corsHeaders,
  createAuthUser,
  generateTemporaryPassword,
  jsonResponse,
  optionalString,
  parseBody,
  requireAdmin,
  requireString,
  sendPortalCredentialsEmail
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient } = await requireAdmin(request);
    const body = await parseBody(request);
    const email = requireString(body, "email");
    const fullName = requireString(body, "fullName");
    const password = optionalString(body, "password") ?? generateTemporaryPassword();

    const user = await createAuthUser(adminClient, {
      email,
      password,
      fullName,
      role: "tutor"
    });
    const emailResult = await sendPortalCredentialsEmail({
      email,
      fullName,
      role: "tutor",
      password
    });

    return jsonResponse(200, {
      message: emailResult.sent
        ? "Tutor account created successfully and login details were emailed."
        : emailResult.message,
      tutorId: user.id,
      email
    });
  } catch (error) {
    return jsonResponse(400, {
      message: error instanceof Error ? error.message : "Unable to create tutor."
    });
  }
});
