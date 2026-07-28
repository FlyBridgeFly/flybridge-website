import {
  corsHeaders,
  failureFromError,
  getStudentById,
  parseBody,
  recordAuditLog,
  requireAdmin,
  requireString,
  setStudentStatus,
  successResponse
} from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient, adminUser } = await requireAdmin(request);
    const body = await parseBody(request);
    const studentId = requireString(body, "studentId");
    const student = await getStudentById(adminClient, studentId);

    await setStudentStatus(adminClient, {
      studentId,
      status: "active",
      actorId: adminUser.id
    });

    await recordAuditLog(adminClient, {
      actorId: adminUser.id,
      action: "student_restored",
      entityType: "student",
      entityId: studentId,
      metadata: {
        fullName: student.full_name ?? null,
        previousStatus: student.previous_status ?? student.status ?? "active"
      }
    });

    return successResponse("Student restored successfully.", {
      success: true,
      entityId: studentId,
      status: "active"
    });
  } catch (error) {
    return failureFromError(error, "Unable to restore the student.");
  }
});
