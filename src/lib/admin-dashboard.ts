import {
  activateTabs,
  createAssessmentRecord,
  createLessonReport,
  createParentAccount,
  createStudentRecord,
  createTutorAccount,
  fetchAllStudents,
  fetchProfilesByRole,
  fetchRecentReports,
  fetchStudentContent,
  fetchStudentLessons,
  fetchTableRows,
  fillParentSelects,
  fillStudentSelects,
  fillTargetEditor,
  fillTutorSelects,
  generateParentInvite,
  getFriendlyErrorMessage,
  guardPage,
  linkParentToStudent,
  linkTutorToStudent,
  readFormValues,
  renderAssessmentList,
  renderLessonList,
  renderProfileCards,
  renderReportTimeline,
  renderStudentCards,
  resetPortalPassword,
  saveTargetRecord,
  setStatusMessage,
  setStudentSelection,
  updateStudentRecord
} from "./portal-client";

type QuickAddTarget = "student" | "tutor" | "parent" | "lesson" | "report" | "assessment" | "target";

export async function bootstrapAdminDashboard() {
  const { profile } = await guardPage(["admin"]);

  const studentsContainer = document.querySelector<HTMLElement>("[data-admin-students]");
  const assessmentsContainer = document.querySelector<HTMLElement>("[data-admin-assessments]");
  const reportsContainer = document.querySelector<HTMLElement>("[data-admin-recent-reports]");
  const lessonsContainer = document.querySelector<HTMLElement>("[data-admin-lessons]");
  const parentProfilesContainer = document.querySelector<HTMLElement>("[data-parent-profiles]");
  const tutorProfilesContainer = document.querySelector<HTMLElement>("[data-tutor-profiles]");
  const targetEditor = document.querySelector<HTMLElement>("[data-target-editor]");
  const targetForm = document.querySelector<HTMLFormElement>("[data-target-form]");
  const lessonReportForm = document.querySelector<HTMLFormElement>("[data-lesson-report-form]");
  const assessmentForm = document.querySelector<HTMLFormElement>("[data-assessment-form]");
  const studentForm = document.querySelector<HTMLFormElement>("[data-student-form]");
  const parentAccountForm = document.querySelector<HTMLFormElement>("[data-parent-account-form]");
  const tutorAccountForm = document.querySelector<HTMLFormElement>("[data-tutor-account-form]");
  const parentLinkForm = document.querySelector<HTMLFormElement>("[data-parent-link-form]");
  const tutorLinkForm = document.querySelector<HTMLFormElement>("[data-tutor-link-form]");
  const parentInviteForm = document.querySelector<HTMLFormElement>("[data-parent-invite-form]");
  const parentResetForm = document.querySelector<HTMLFormElement>("[data-parent-reset-form]");
  const tutorResetForm = document.querySelector<HTMLFormElement>("[data-tutor-reset-form]");
  const invitePreview = document.querySelector<HTMLElement>("[data-parent-invite-preview]");
  const resetStudentButton = document.querySelector<HTMLElement>("[data-student-reset]");
  const studentSearch = document.querySelector<HTMLInputElement>("[data-student-search]");
  const studentStatusFilter = document.querySelector<HTMLSelectElement>("[data-student-status-filter]");
  const studentFilterEmpty = document.querySelector<HTMLElement>("[data-student-filter-empty]");
  const quickAddDialog = document.querySelector<HTMLElement>("[data-quick-add-dialog]");
  const quickAddOpen = document.querySelector<HTMLElement>("[data-quick-add-open]");
  const quickAddClose = document.querySelector<HTMLElement>("[data-quick-add-close]");

  const studentCount = document.querySelector<HTMLElement>("[data-student-count]");
  const parentCount = document.querySelector<HTMLElement>("[data-parent-count]");
  const tutorCount = document.querySelector<HTMLElement>("[data-tutor-count]");
  const reportCount = document.querySelector<HTMLElement>("[data-report-count]");

  const quickAddConfig: Record<QuickAddTarget, { tab: "students" | "parents" | "tutors"; selector: string }> = {
    student: { tab: "students", selector: "[data-student-form]" },
    tutor: { tab: "tutors", selector: "[data-tutor-account-form]" },
    parent: { tab: "parents", selector: "[data-parent-account-form]" },
    lesson: { tab: "students", selector: "[data-lesson-report-form]" },
    report: { tab: "students", selector: "[data-lesson-report-form]" },
    assessment: { tab: "students", selector: "[data-assessment-form]" },
    target: { tab: "students", selector: "[data-target-form]" }
  };

  const resetStudentForm = () => {
    if (!studentForm) return;
    studentForm.reset();
    const idField = studentForm.querySelector<HTMLInputElement>('input[name="student-id"]');
    if (idField) idField.value = "";
  };

  const openQuickAdd = () => {
    if (!quickAddDialog) return;
    quickAddDialog.dataset.open = "true";
    quickAddDialog.setAttribute("aria-hidden", "false");
    document.body.classList.add("menu-open");
  };

  const closeQuickAdd = () => {
    if (!quickAddDialog) return;
    quickAddDialog.dataset.open = "false";
    quickAddDialog.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");
  };

  const applyStudentFilters = () => {
    if (!studentsContainer) return;
    const query = studentSearch?.value.trim().toLowerCase() ?? "";
    const status = studentStatusFilter?.value ?? "all";
    const cards = Array.from(studentsContainer.querySelectorAll<HTMLElement>("[data-student-card]"));
    let visibleCount = 0;

    cards.forEach((card) => {
      const name = (card.dataset.studentName ?? "").toLowerCase();
      const text = card.textContent?.toLowerCase() ?? "";
      const cardStatus = card.dataset.studentActive ?? "active";
      const matchesQuery = !query || name.includes(query) || text.includes(query);
      const matchesStatus = status === "all" || cardStatus === status;
      const visible = matchesQuery && matchesStatus;
      card.classList.toggle("hidden", !visible);
      if (visible) visibleCount += 1;
    });

    studentFilterEmpty?.classList.toggle("hidden", visibleCount !== 0);
  };

  const jumpToSection = (target: QuickAddTarget, studentId?: string) => {
    const config = quickAddConfig[target];
    document.querySelector<HTMLElement>(`[data-admin-tab][data-tab="${config.tab}"]`)?.click();
    if (studentId) {
      setStudentSelection(studentId);
    }
    window.setTimeout(() => {
      document.querySelector<HTMLElement>(config.selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  async function refresh() {
    const [students, tutors, parents, tutorLinksRaw, parentLinksRaw, invitesRaw, recentReports] = await Promise.all([
      fetchAllStudents(),
      fetchProfilesByRole("tutor"),
      fetchProfilesByRole("parent"),
      fetchTableRows("tutor_student_links"),
      fetchTableRows("parent_student_links"),
      fetchTableRows("parent_invites"),
      fetchRecentReports(10)
    ]);

    const tutorLinks = tutorLinksRaw as Array<Record<string, unknown>>;
    const parentLinks = parentLinksRaw as Array<Record<string, unknown>>;
    const invites = invitesRaw as Array<Record<string, unknown>>;

    const studentIds = students.map((student) => student.id);
    const { assessments, targets } = await fetchStudentContent(studentIds);
    const upcomingLessons = await fetchStudentLessons(studentIds, { status: "scheduled", limit: 8 });
    const studentsById = new Map(students.map((student) => [student.id, student]));

    fillStudentSelects(students);
    fillTutorSelects(tutors);
    fillParentSelects(parents);

    if (studentsContainer) {
      renderStudentCards(studentsContainer, students, {
        editable: true
      });

      studentsContainer.querySelectorAll<HTMLElement>("[data-student-fill]").forEach((button) => {
        button.addEventListener("click", () => {
          const studentId = button.dataset.studentId;
          if (!studentId) return;
          setStudentSelection(studentId);
          lessonReportForm?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

      studentsContainer.querySelectorAll<HTMLElement>("[data-student-edit]").forEach((button) => {
        button.addEventListener("click", () => {
          const studentId = button.dataset.studentId;
          if (!studentId || !studentForm) return;
          const student = students.find((item) => item.id === studentId);
          if (!student) return;
          const idField = studentForm.querySelector<HTMLInputElement>('input[name="student-id"]');
          const nameField = studentForm.querySelector<HTMLInputElement>('input[name="full-name"]');
          const yearField = studentForm.querySelector<HTMLInputElement>('input[name="year-group"]');
          const schoolField = studentForm.querySelector<HTMLInputElement>('input[name="school"]');
          const notesField = studentForm.querySelector<HTMLTextAreaElement>('textarea[name="notes"]');
          if (idField) idField.value = student.id;
          if (nameField) nameField.value = student.full_name ?? `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim();
          if (yearField) yearField.value = student.year_group ?? "";
          if (schoolField) schoolField.value = student.school ?? "";
          if (notesField) notesField.value = student.notes ?? "";
          studentForm.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });

      studentsContainer.querySelectorAll<HTMLElement>("[data-student-action]").forEach((button) => {
        button.addEventListener("click", () => {
          const target = button.dataset.studentAction as QuickAddTarget | undefined;
          const studentId = button.dataset.studentId;
          if (!target) return;
          jumpToSection(target, studentId);
        });
      });

      applyStudentFilters();
    }

    if (assessmentsContainer) {
      renderAssessmentList(assessmentsContainer, assessments, studentsById);
    }

    if (reportsContainer) {
      renderReportTimeline(reportsContainer, recentReports, studentsById);
    }

    if (lessonsContainer) {
      renderLessonList(lessonsContainer, upcomingLessons, studentsById, {
        emptyTitle: "No upcoming lessons",
        emptyBody: "Scheduled lessons will appear here once they are added in the portal.",
        mode: "upcoming",
        limit: 8
      });
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

          targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    }

    if (parentProfilesContainer) {
      renderProfileCards(parentProfilesContainer, parents, {
        heading: "parent",
        links: parentLinks as never[],
        studentsById,
        invites: invites as never[]
      });
    }

    if (tutorProfilesContainer) {
      renderProfileCards(tutorProfilesContainer, tutors, {
        heading: "tutor",
        links: tutorLinks as never[],
        studentsById
      });
    }

    if (studentCount) studentCount.textContent = String(students.length);
    if (parentCount) parentCount.textContent = String(parents.length);
    if (tutorCount) tutorCount.textContent = String(tutors.length);
    if (reportCount) reportCount.textContent = String(recentReports.length);
  }

  activateTabs("[data-admin-tab]", "[data-admin-panel]", "students");
  resetStudentButton?.addEventListener("click", resetStudentForm);
  studentSearch?.addEventListener("input", applyStudentFilters);
  studentStatusFilter?.addEventListener("change", applyStudentFilters);
  quickAddOpen?.addEventListener("click", openQuickAdd);
  quickAddClose?.addEventListener("click", closeQuickAdd);
  quickAddDialog?.addEventListener("click", (event) => {
    if (event.target === quickAddDialog) closeQuickAdd();
  });
  quickAddDialog?.querySelectorAll<HTMLElement>("[data-quick-add-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.quickAddTarget as QuickAddTarget | undefined;
      if (!target) return;
      closeQuickAdd();
      jumpToSection(target);
    });
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeQuickAdd();
  });

  await refresh();

  studentForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(studentForm);
    const status = studentForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      if (values["student-id"]) {
        await updateStudentRecord({
          studentId: values["student-id"],
          fullName: values["full-name"],
          yearGroup: values["year-group"],
          school: values.school,
          notes: values.notes
        });
        setStatusMessage(status, "success", "Student updated successfully.");
      } else {
        await createStudentRecord({
          fullName: values["full-name"],
          yearGroup: values["year-group"],
          school: values.school,
          notes: values.notes
        });
        setStatusMessage(status, "success", "Student created successfully.");
      }
      resetStudentForm();
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save student."));
    }
  });

  tutorAccountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(tutorAccountForm);
    const status = tutorAccountForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await createTutorAccount({
        fullName: values["full-name"],
        email: values.email,
        password: values.password
      });
      tutorAccountForm.reset();
      setStatusMessage(status, "success", result.message);
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to create tutor account."));
    }
  });

  parentAccountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(parentAccountForm);
    const status = parentAccountForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await createParentAccount({
        fullName: values["full-name"],
        email: values.email,
        password: values.password
      });
      parentAccountForm.reset();
      setStatusMessage(status, "success", result.message);
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to create parent account."));
    }
  });

  tutorLinkForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(tutorLinkForm);
    const status = tutorLinkForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await linkTutorToStudent({
        tutorId: values["tutor-id"],
        studentId: values["student-id"]
      });
      tutorLinkForm.reset();
      setStatusMessage(status, "success", result.message);
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to link tutor."));
    }
  });

  parentLinkForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(parentLinkForm);
    const status = parentLinkForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await linkParentToStudent({
        parentId: values["parent-id"],
        studentId: values["student-id"]
      });
      parentLinkForm.reset();
      setStatusMessage(status, "success", result.message);
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to link parent."));
    }
  });

  parentInviteForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(parentInviteForm);
    const status = parentInviteForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await generateParentInvite({
        parentId: values["parent-id"],
        studentId: values["student-id"]
      });
      parentInviteForm.reset();
      if (invitePreview) {
        invitePreview.textContent = `Latest invite code: ${String(result.inviteCode ?? result.code ?? "Generated successfully")}`;
      }
      setStatusMessage(status, "success", result.message);
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to generate parent invite."));
    }
  });

  parentResetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(parentResetForm);
    const status = parentResetForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await resetPortalPassword({
        userId: values["user-id"]
      });
      parentResetForm.reset();
      setStatusMessage(status, "success", result.message);
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to reset parent password."));
    }
  });

  tutorResetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(tutorResetForm);
    const status = tutorResetForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await resetPortalPassword({
        userId: values["user-id"]
      });
      tutorResetForm.reset();
      setStatusMessage(status, "success", result.message);
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to reset tutor password."));
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
