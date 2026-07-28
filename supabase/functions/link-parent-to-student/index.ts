import { corsHeaders, ensureLink, failureResponse, parseBody, recordAuditLog, requireAdmin, requireString, successResponse } from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const parentId = requireString(body, "parentId");
    const studentIds = Array.isArray(body.studentIds)
      ? body.studentIds.filter((item): item is string => typeof item === "string" && item.trim()).map((item) => item.trim())
      : [requireString(body, "studentId")];

    for (const studentId of studentIds) {
      await ensureLink(adminClient, "parent_student_links", {
        parent_id: parentId,
        student_id: studentId
      });
      await recordAuditLog(adminClient, {
        actorId: adminUser.id,
        action: "parent_linked_to_student",
        entityType: "parent",
        entityId: parentId,
        metadata: {
          studentId
        }
      });
    }

    return successResponse("Parent link updated successfully.", {
      parentId,
      studentIds
    });
  } catch (error) {
    return failureResponse(400, error instanceof Error ? error.message : "Unable to link parent to student.");
  }
});
