import {
  createAssessmentRecord,
  createLessonReport,
  fetchAllStudents,
  fetchAssignedStudentsForTutor,
  fetchStudentContent,
  fillStudentSelects,
  fillTargetEditor,
  guardPage,
  readFormValues,
  renderStudentCards,
  saveTargetRecord,
  setStatusMessage
} from "./portal-client";

export async function bootstrapTutorDashboard() {
  const { profile } = await guardPage(["admin", "tutor"]);

  const studentsContainer = document.querySelector<HTMLElement>("[data-tutor-students]");
  const targetEditor = document.querySelector<HTMLElement>("[data-target-editor]");
  const targetForm = document.querySelector<HTMLFormElement>("[data-target-form]");
  const lessonReportForm = document.querySelector<HTMLFormElement>("[data-lesson-report-form]");
  const assessmentForm = document.querySelector<HTMLFormElement>("[data-assessment-form]");
  const studentCount = document.querySelector<HTMLElement>("[data-student-count]");

  async function refresh() {
    const students = profile.role === "admin" ? await fetchAllStudents() : await fetchAssignedStudentsForTutor(profile.id);
    fillStudentSelects(students);

    if (studentsContainer) {
      renderStudentCards(studentsContainer, students);
    }

    if (studentCount) {
      studentCount.textContent = String(students.length);
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
  }

  await refresh();

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
