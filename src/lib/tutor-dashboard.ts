import {
  createAssessmentRecord,
  createLessonReport,
  fetchAssignedStudentsForTutor,
  fetchStudentContent,
  fetchStudentLessons,
  fillStudentSelects,
  fillTargetEditor,
  getFriendlyErrorMessage,
  guardPage,
  readFormValues,
  renderLessonList,
  renderReportTimeline,
  renderStudentCards,
  saveTargetRecord,
  setStudentSelection,
  setStatusMessage
} from "./portal-client";

export async function bootstrapTutorDashboard() {
  const { profile } = await guardPage(["tutor"], {
    adminRedirectHome: "/admin",
    adminRedirectMessage: "This account uses the FlyBridge admin workspace.",
    unauthorizedMessage: "Your account is signed in, but tutor-only tools are available from the Tutor Dashboard."
  });

  const studentsContainer = document.querySelector<HTMLElement>("[data-tutor-students]");
  const lessonsContainer = document.querySelector<HTMLElement>("[data-tutor-lessons]");
  const reportsContainer = document.querySelector<HTMLElement>("[data-tutor-reports]");
  const targetEditor = document.querySelector<HTMLElement>("[data-target-editor]");
  const targetForm = document.querySelector<HTMLFormElement>("[data-target-form]");
  const lessonReportForm = document.querySelector<HTMLFormElement>("[data-lesson-report-form]");
  const assessmentForm = document.querySelector<HTMLFormElement>("[data-assessment-form]");
  const studentCount = document.querySelector<HTMLElement>("[data-student-count]");
  const targetCount = document.querySelector<HTMLElement>("[data-target-count]");
  const reportCount = document.querySelector<HTMLElement>("[data-report-count]");

  async function refresh() {
    const students = await fetchAssignedStudentsForTutor(profile.id);
    const studentIds = students.map((student) => student.id);
    const { reports, targets } = await fetchStudentContent(studentIds);
    const upcomingLessons = await fetchStudentLessons(studentIds, { status: "scheduled", limit: 6 });
    const studentsById = new Map(students.map((student) => [student.id, student]));
    fillStudentSelects(students);

    if (studentsContainer) {
      renderStudentCards(studentsContainer, students);
      studentsContainer.querySelectorAll<HTMLElement>("[data-student-fill]").forEach((button) => {
        button.addEventListener("click", () => {
          const studentId = button.dataset.studentId;
          if (!studentId) return;
          setStudentSelection(studentId);
          lessonReportForm?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    if (studentCount) {
      studentCount.textContent = String(students.length);
    }

    if (targetCount) {
      targetCount.textContent = String(targets.filter((target) => String(target.status ?? "").toLowerCase() !== "complete").length);
    }

    if (reportCount) {
      reportCount.textContent = String(reports.length);
    }

    if (lessonsContainer) {
      renderLessonList(lessonsContainer, upcomingLessons, studentsById, {
        emptyTitle: "No upcoming lessons",
        emptyBody: "Scheduled lessons will appear here once they are added for your assigned students.",
        mode: "upcoming",
        limit: 6
      });
    }

    if (reportsContainer) {
      renderReportTimeline(reportsContainer, reports.slice(0, 6), studentsById);
    }

    if (targetEditor) {
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
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save lesson report."));
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
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save assessment."));
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
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save target."));
    }
  });
}
