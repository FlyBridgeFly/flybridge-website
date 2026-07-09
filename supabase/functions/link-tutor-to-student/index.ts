import { corsHeaders, ensureLink, jsonResponse, parseBody, requireAdmin, requireString } from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient } = await requireAdmin(request);
    const body = await parseBody(request);
    const tutorId = requireString(body, "tutorId");
    const studentId = requireString(body, "studentId");

    await ensureLink(adminClient, "tutor_student_links", {
      tutor_id: tutorId,
      student_id: studentId
    });

    return jsonResponse(200, {
      message: "Tutor linked to student successfully.",
      tutorId,
      studentId
    });
  } catch (error) {
    return jsonResponse(400, {
      message: error instanceof Error ? error.message : "Unable to link tutor to student."
    });
  }
});
