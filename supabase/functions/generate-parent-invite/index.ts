import { corsHeaders, failureResponse, parseBody, recordAuditLog, requireAdmin, requireString, successResponse } from "../_shared/admin.ts";

function createInviteCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const parentId = requireString(body, "parentId");
    const studentId = requireString(body, "studentId");
    const inviteCode = createInviteCode();

    const payloads = [
      {
        parent_id: parentId,
        student_id: studentId,
        invite_code: inviteCode,
        status: "generated",
        created_by: adminUser.id
      },
      {
        parent_id: parentId,
        student_id: studentId,
        code: inviteCode,
        status: "generated",
        generated_by: adminUser.id
      }
    ];

    let inserted = false;
    let lastError: Error | null = null;
    for (const payload of payloads) {
      const { error } = await adminClient.from("parent_invites").insert(payload);
      if (!error) {
        inserted = true;
        break;
      }
      lastError = error;
    }

    if (!inserted) {
      throw lastError ?? new Error("Unable to create the parent invite.");
    }

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action: "parent_invite_generated",
      entityType: "parent",
      entityId: parentId,
      metadata: {
        studentId,
        inviteCode
      }
    });

    return successResponse("Parent invite generated successfully.", {
      inviteCode,
      parentId,
      studentId
    });
  } catch (error) {
    return failureResponse(400, error instanceof Error ? error.message : "Unable to generate invite.");
  }
});
