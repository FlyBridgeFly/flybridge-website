import {
  assignTutorToStudent,
  createAssessmentRecord,
  createLessonReport,
  createStudentRecord,
  fetchAllStudents,
  fetchProfilesByRole,
  fetchRecentReports,
  fetchStudentContent,
  fetchTableRows,
  fillStudentSelects,
  fillTargetEditor,
  fillTutorSelects,
  guardPage,
  readFormValues,
  renderReportTimeline,
  renderStudentCards,
  saveTargetRecord,
  setStatusMessage
} from "./portal-client";

export async function bootstrapAdminDashboard() {
  const { profile } = await guardPage(["admin"]);

  const studentsContainer = document.querySelector<HTMLElement>("[data-admin-students]");
  const reportsContainer = document.querySelector<HTMLElement>("[data-admin-recent-reports]");
  const studentCount = document.querySelector<HTMLElement>("[data-student-count]");
  const tutorCount = document.querySelector<HTMLElement>("[data-tutor-count]");
  const reportCount = document.querySelector<HTMLElement>("[data-report-count]");
  const targetEditor = document.querySelector<HTMLElement>("[data-target-editor]");
  const targetForm = document.querySelector<HTMLFormElement>("[data-target-form]");
  const lessonReportForm = document.querySelector<HTMLFormElement>("[data-lesson-report-form]");
  const assessmentForm = document.querySelector<HTMLFormElement>("[data-assessment-form]");
  const studentForm = document.querySelector<HTMLFormElement>("[data-student-form]");
  const assignForm = document.querySelector<HTMLFormElement>("[data-assign-form]");

  async function refresh() {
    const [students, tutors, tutorLinks, recentReports] = await Promise.all([
      fetchAllStudents(),
      fetchProfilesByRole("tutor"),
      fetchTableRows("tutor_student_links"),
      fetchRecentReports(8)
    ]);

    fillStudentSelects(students);
    fillTutorSelects(tutors);

    if (studentsContainer) {
      renderStudentCards(studentsContainer, students, {
        showAssignments: true,
        tutorLinks
      });
    }

    if (reportsContainer) {
      const studentsById = new Map(students.map((student) => [student.id, student]));
      renderReportTimeline(reportsContainer, recentReports, studentsById);
    }

    if (targetEditor) {
      const { targets } = await fetchStudentContent(students.map((student) => student.id));
      fillTargetEditor(targetEditor, targets);
      targetEditor.querySelectorAll<HTMLElement>("[data-target-edit]").forEach((button) => {
        button.addEventListener("click", () => {
          if (!targetForm) return;
          const data = button.dataset;
          const idField = targetForm.querySelector<HTMLInputElement>('input[name="target-id"]');
          const studentField = targetForm.querySelector<HTMLSelectElement>('select[name="student-id"]');
          const titleField = targetForm.querySelector<HTMLInputElement>('input[name="title"]');
          const statusField = targetForm.querySelector<HTMLSelectElement>('select[name="status"]');
          const dueField = targetForm.querySelector<HTMLInputElement>('input[name="due-date"]');
          const notesField = targetForm.querySelector<HTMLTextAreaElement>('textarea[name="notes"]');

          if (idField) idField.value = data.targetId ?? "";
          if (studentField) studentField.value = data.targetStudent ?? "";
          if (titleField) titleField.value = data.targetTitle ?? "";
          if (statusField) statusField.value = data.targetStatus ?? "open";
          if (dueField) dueField.value = data.targetDue ?? "";
          if (notesField) notesField.value = data.targetNotes ?? "";
        });
      });
    }

    if (studentCount) studentCount.textContent = String(students.length);
    if (tutorCount) tutorCount.textContent = String(tutors.length);
    if (reportCount) reportCount.textContent = String(recentReports.length);
  }

  await refresh();

  studentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(studentForm);
    const status = studentForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      await createStudentRecord({
        fullName: values["full-name"],
        yearGroup: values["year-group"],
        school: values.school,
        notes: values.notes
      });
      studentForm.reset();
      setStatusMessage(status, "success", "Student created successfully.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", error instanceof Error ? error.message : "Unable to create student.");
    }
  });

  assignForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(assignForm);
    const status = assignForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      await assignTutorToStudent(values["tutor-id"], values["student-id"]);
      assignForm.reset();
      setStatusMessage(status, "success", "Tutor assigned to student.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", error instanceof Error ? error.message : "Unable to assign tutor.");
    }
  });

  lessonReportForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(lessonReportForm);
    const status = lessonReportForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      await createLessonReport({
        studentId: values["student-id"],
        tutorId: profile.id,
        lessonDate: values["lesson-date"],
        topic: values.topic,
        summary: values.summary,
        strengths: values.strengths,
        homework: values.homework,
        nextSteps: values["next-steps"]
      });
      lessonReportForm.reset();
      setStatusMessage(status, "success", "Lesson report saved.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", error instanceof Error ? error.message : "Unable to save lesson report.");
    }
  });

  assessmentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(assessmentForm);
    const status = assessmentForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      await createAssessmentRecord({
        studentId: values["student-id"],
        actorId: profile.id,
        title: values.title,
        assessmentDate: values["assessment-date"],
        score: values.score,
        maxScore: values["max-score"],
        notes: values.notes
      });
      assessmentForm.reset();
      setStatusMessage(status, "success", "Assessment saved.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", error instanceof Error ? error.message : "Unable to save assessment.");
    }
  });

  targetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(targetForm);
    const status = targetForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      await saveTargetRecord({
        id: values["target-id"] || undefined,
        studentId: values["student-id"],
        actorId: profile.id,
        title: values.title,
        status: values.status,
        dueDate: values["due-date"],
        notes: values.notes
      });
      targetForm.reset();
      const idField = targetForm.querySelector<HTMLInputElement>('input[name="target-id"]');
      if (idField) idField.value = "";
      setStatusMessage(status, "success", "Target saved.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", error instanceof Error ? error.message : "Unable to save target.");
    }
  });
}
