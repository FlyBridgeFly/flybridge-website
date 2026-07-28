import {
  corsHeaders,
  failureFromError,
  generateTemporaryPassword,
  optionalString,
  parseBody,
  provisionPortalAccount,
  requireAdmin,
  requireString,
  successResponse
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const email = requireString(body, "email");
    const fullName = requireString(body, "fullName");
    const password = generateTemporaryPassword();
    const phone = optionalString(body, "phone");
    const studentId = optionalString(body, "studentId");

    const result = await provisionPortalAccount({
      adminClient,
      adminUserId: adminUser.id,
      email,
      fullName,
      role: "parent",
      password,
      phone,
      studentId
    });
    return successResponse(result.message, {
      role: "parent",
      userId: result.userId,
      parentId: result.userId,
      email: result.email,
      emailSent: result.emailSent,
      stage: result.stage,
      warning: result.warning
    });
  } catch (error) {
    return failureFromError(error, "Unable to create parent.");
  }
});
