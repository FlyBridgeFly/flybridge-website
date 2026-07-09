import { corsHeaders, ensureLink, jsonResponse, parseBody, requireAdmin, requireString } from "../_shared/admin.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { adminClient } = await requireAdmin(request);
    const body = await parseBody(request);
    const parentId = requireString(body, "parentId");
    const studentId = requireString(body, "studentId");

    await ensureLink(adminClient, "parent_student_links", {
      parent_id: parentId,
      student_id: studentId
    });

    return jsonResponse(200, {
      message: "Parent linked to student successfully.",
      parentId,
      studentId
    });
  } catch (error) {
    return jsonResponse(400, {
      message: error instanceof Error ? error.message : "Unable to link parent to student."
    });
  }
});
