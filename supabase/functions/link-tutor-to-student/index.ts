import { corsHeaders, ensureLink, failureResponse, parseBody, recordAuditLog, requireAdmin, requireString, successResponse } from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const tutorId = requireString(body, "tutorId");
    const studentIds = Array.isArray(body.studentIds)
      ? body.studentIds.filter((item): item is string => typeof item === "string" && item.trim()).map((item) => item.trim())
      : [requireString(body, "studentId")];

    for (const studentId of studentIds) {
      await ensureLink(adminClient, "tutor_student_links", {
        tutor_id: tutorId,
        student_id: studentId
      });
      await recordAuditLog(adminClient, {
        actorId: adminUser.id,
        action: "tutor_assigned",
        entityType: "tutor",
        entityId: tutorId,
        metadata: {
          studentId
        }
      });
    }

    return successResponse("Tutor assignment updated successfully.", {
      tutorId,
      studentIds
    });
  } catch (error) {
    return failureResponse(400, error instanceof Error ? error.message : "Unable to link tutor to student.");
  }
});
