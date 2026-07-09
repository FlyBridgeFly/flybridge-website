import { corsHeaders, jsonResponse, parseBody, requireAdmin, requireString } from "../_shared/admin.ts";

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

    return jsonResponse(200, {
      message: "Parent invite generated successfully.",
      inviteCode,
      parentId,
      studentId
    });
  } catch (error) {
    return jsonResponse(400, {
      message: error instanceof Error ? error.message : "Unable to generate invite."
    });
  }
});
