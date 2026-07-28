import {
  activateTabs,
  archiveStudent,
  archivePortalUser,
  createArticleRecord,
  createAssessmentRecord,
  createAuditEntry,
  createLessonRecord,
  createLessonReport,
  createParentAccount,
  createStudentRecord,
  createTutorAccount,
  deletePortalUser,
  escapeHtml,
  fetchAdminNotes,
  fetchAllStudents,
  fetchArticles,
  fetchAuditLogs,
  fetchProfilesByRole,
  fetchStudentContent,
  fetchStudentLessons,
  fetchTableRows,
  fillParentSelects,
  fillStudentSelects,
  fillTutorSelects,
  formatDate,
  generateParentInvite,
  getAccountStatusMeta,
  getFriendlyErrorMessage,
  getProfileName,
  getStudentName,
  guardPage,
  linkParentToStudent,
  linkTutorToStudent,
  readFormValues,
  renderAssessmentList,
  renderLessonList,
  renderReportTimeline,
  resendPortalWelcome,
  resetPortalPassword,
  restorePortalUser,
  restoreStudent,
  saveAdminNote,
  saveTargetRecord,
  setPortalUserStatus,
  setStatusMessage,
  unlinkParentFromStudent,
  unlinkTutorFromStudent,
  updatePortalUser,
  updateStudentRecord,
  type ParentInviteRow
} from "./portal-client";
import type {
  AdminNoteRow,
  ArticleRow,
  AssessmentRow,
  AuditLogRow,
  LessonRow,
  LessonReportRow,
  LinkRow,
  ProfileRow,
  StudentRow,
  TargetRow
} from "./supabase";

type AdminTab = "overview" | "students" | "tutors" | "parents" | "lessons" | "reports" | "assessments" | "articles" | "archived" | "settings";
type EntityType = "student" | "tutor" | "parent";
type SelectGroup = "students" | "tutors" | "parents";

interface AdminState {
  students: StudentRow[];
  tutors: ProfileRow[];
  parents: ProfileRow[];
  tutorLinks: LinkRow[];
  parentLinks: LinkRow[];
  lessons: LessonRow[];
  reports: LessonReportRow[];
  assessments: AssessmentRow[];
  targets: TargetRow[];
  notes: AdminNoteRow[];
  auditLogs: AuditLogRow[];
  articles: ArticleRow[];
  invites: ParentInviteRow[];
}

const state: AdminState = {
  students: [],
  tutors: [],
  parents: [],
  tutorLinks: [],
  parentLinks: [],
  lessons: [],
  reports: [],
  assessments: [],
  targets: [],
  notes: [],
  auditLogs: [],
  articles: [],
  invites: []
};

const selected = {
  students: new Set<string>(),
  tutors: new Set<string>(),
  parents: new Set<string>()
};

const sessionState = {
  adminId: "",
  activeTab: "overview" as AdminTab
};

const drawerState = {
  entityType: null as EntityType | null,
  entityId: null as string | null,
  restoreFocusTo: null as HTMLElement | null
};

const confirmationState = {
  run: null as null | (() => Promise<void>)
};

function openArchivePortalConfirmation(entityType: "parent" | "tutor", entityId: string, profile: ProfileRow, afterSuccess?: () => Promise<void>) {
  const isParent = entityType === "parent";
  openConfirmation({
    title: isParent ? "Archive parent account" : "Archive portal account",
    body: isParent
      ? "This removes parent login access and revokes outstanding invites while preserving linked students, reports, assessments, payments, messages, and audit history."
      : "This archives the portal account and removes login access while preserving linked teaching history where possible.",
    buttonLabel: isParent ? "Archive parent" : "Archive account",
    entitySummary: `${getProfileName(profile)} • ${profile.email ?? "No email recorded"}`,
    helperText: isParent
      ? "Archived parents remain linked to historical student records, but they can no longer sign in."
      : "Archived tutor accounts remain available in historical records, but the user can no longer sign in.",
    run: async () => {
      await archivePortalUser({ userId: entityId });
      if (afterSuccess) await afterSuccess();
    }
  });
}

const sidebarState = {
  collapsed: false,
  lastToggle: null as HTMLElement | null
};

const archivedState = {
  activeTab: "parents" as "parents" | "tutors" | "students"
};

const directoryState = {
  panel: null as "students" | "tutors" | "parents" | null,
  trigger: null as HTMLElement | null
};

const focusTraps = new Map<HTMLElement, (event: KeyboardEvent) => void>();

function trapFocus(container: HTMLElement) {
  const handler = (event: KeyboardEvent) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => !node.hasAttribute("hidden"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };

  releaseFocusTrap(container);
  container.addEventListener("keydown", handler);
  focusTraps.set(container, handler);
}

function releaseFocusTrap(container: HTMLElement) {
  const handler = focusTraps.get(container);
  if (!handler) return;
  container.removeEventListener("keydown", handler);
  focusTraps.delete(container);
}

function focusFirstElement(container: HTMLElement, selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])') {
  const target = container.querySelector<HTMLElement>(selector);
  target?.focus();
}

function syncBodyLock() {
  const hasOpenLayer =
    document.querySelector<HTMLElement>("[data-confirmation-dialog='member-action'][data-open='true']") ||
    document.querySelector<HTMLElement>("[data-quick-add-dialog][data-open='true']") ||
    document.querySelector<HTMLElement>("[data-admin-sidebar='drawer'][data-open='true']") ||
    document.querySelector<HTMLElement>("[data-directory-panel][data-expanded='true']") ||
    document.querySelector<HTMLElement>("[data-admin-drawer='member-detail']:not(.hidden)");

  document.body.classList.toggle("menu-open", Boolean(hasOpenLayer));
}

function byRecentDate<T extends Record<string, unknown>>(items: T[], ...keys: string[]) {
  return [...items].sort((a, b) => {
    const aDate = keys.map((key) => a[key]).find(Boolean);
    const bDate = keys.map((key) => b[key]).find(Boolean);
    const aValue = aDate ? new Date(String(aDate)).getTime() : 0;
    const bValue = bDate ? new Date(String(bDate)).getTime() : 0;
    return bValue - aValue;
  });
}

function parseCsvList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getGlobalQuery() {
  return document.querySelector<HTMLInputElement>("[data-admin-global-search]")?.value.trim().toLowerCase() ?? "";
}

function matchesQuery(values: Array<string | null | undefined>, localQuery = "") {
  const query = localQuery || getGlobalQuery();
  if (!query) return true;
  return values.some((value) => String(value ?? "").toLowerCase().includes(query));
}

function setupStateLabel(profile: ProfileRow, linkedCount: number) {
  const status = String(profile.status ?? "active").toLowerCase();
  if (status === "suspended") return "Suspended";
  if (status === "archived") return "Archived";
  if (status === "inactive") return "Inactive";
  if (!linkedCount) return "No linked student";
  if (profile.must_change_password) {
    return profile.temporary_password_created_at ? "Temporary password issued" : "Password change required";
  }
  return "Ready";
}

function attentionLabel(profile: ProfileRow) {
  const status = String(profile.status ?? "active").toLowerCase();
  if (status !== "active") {
    return getAccountStatusMeta(status).label;
  }
  if (profile.must_change_password) {
    return profile.temporary_password_created_at ? "Temporary password issued" : "Password change required";
  }
  if (profile.role === "parent" && linkedStudentIdsForParent(profile.id).length === 0) {
    return "No linked student";
  }
  return "Ready";
}

function getStudentStatus(student: StudentRow) {
  return String(student.status ?? (student.active === false ? "inactive" : "active")).toLowerCase();
}

function studentById(studentId: string) {
  return state.students.find((student) => student.id === studentId);
}

function profileById(entityType: "tutor" | "parent", userId: string) {
  const list = entityType === "tutor" ? state.tutors : state.parents;
  return list.find((profile) => profile.id === userId);
}

function noteForEntity(entityType: EntityType, entityId: string) {
  return state.notes.find((note) => note.entity_type === entityType && String(note.entity_id ?? "") === entityId);
}

function auditForEntity(entityType: EntityType, entityId: string) {
  return state.auditLogs.filter((entry) => entry.entity_type === entityType && String(entry.entity_id ?? "") === entityId).slice(0, 10);
}

function linkedStudentIdsForTutor(tutorId: string) {
  return state.tutorLinks.filter((link) => String(link.tutor_id ?? "") === tutorId).map((link) => String(link.student_id ?? ""));
}

function linkedStudentIdsForParent(parentId: string) {
  return state.parentLinks.filter((link) => String(link.parent_id ?? "") === parentId).map((link) => String(link.student_id ?? ""));
}

function tutorNamesForStudent(studentId: string) {
  return linkedProfilesForStudent(studentId, "tutor").map((profile) => getProfileName(profile));
}

function parentNamesForStudent(studentId: string) {
  return linkedProfilesForStudent(studentId, "parent").map((profile) => getProfileName(profile));
}

function linkedProfilesForStudent(studentId: string, entityType: "tutor" | "parent") {
  const links = entityType === "tutor" ? state.tutorLinks : state.parentLinks;
  const profiles = entityType === "tutor" ? state.tutors : state.parents;
  const profileKey = entityType === "tutor" ? "tutor_id" : "parent_id";

  return links
    .filter((link) => String(link.student_id ?? "") === studentId)
    .map((link) => profiles.find((profile) => profile.id === String(link[profileKey] ?? "")))
    .filter((profile): profile is ProfileRow => Boolean(profile));
}

function latestLessonForStudent(studentId: string) {
  return byRecentDate(
    state.lessons.filter((lesson) => String(lesson.student_id ?? "") === studentId),
    "lesson_date",
    "created_at",
    "updated_at"
  )[0];
}

function latestReportForStudent(studentId: string) {
  return byRecentDate(
    state.reports.filter((report) => String(report.student_id ?? "") === studentId),
    "lesson_date",
    "created_at"
  )[0];
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function metric(selector: string, value: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    node.textContent = value;
  });
}

function htmlListItem(title: string, body: string, badge?: string) {
  return `
    <article class="dashboard-list-item">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-fb-ink">${escapeHtml(title)}</p>
          <p class="mt-1 text-sm text-fb-ink-soft">${escapeHtml(body)}</p>
        </div>
        ${badge ?? ""}
      </div>
    </article>
  `;
}

function renderHtmlList(selector: string, items: string[]) {
  const container = document.querySelector<HTMLElement>(selector);
  if (!container) return;
  container.innerHTML = items.length ? items.join("") : `<article class="dashboard-list-item text-sm text-fb-ink-soft">No data available.</article>`;
}

function lessonPreviewItems(studentId: string) {
  return byRecentDate(
    state.lessons.filter((lesson) => String(lesson.student_id ?? "") === studentId),
    "lesson_date",
    "created_at"
  ).slice(0, 4);
}

function reportPreviewItems(studentId: string) {
  return byRecentDate(
    state.reports.filter((report) => String(report.student_id ?? "") === studentId),
    "lesson_date",
    "created_at"
  ).slice(0, 4);
}

function assessmentPreviewItems(studentId: string) {
  return byRecentDate(
    state.assessments.filter((assessment) => String(assessment.student_id ?? "") === studentId),
    "assessment_date",
    "created_at"
  ).slice(0, 4);
}

function targetPreviewItems(studentId: string) {
  return byRecentDate(
    state.targets.filter((target) => String(target.student_id ?? "") === studentId),
    "due_date",
    "created_at"
  ).slice(0, 4);
}

function completedHoursForStudent(studentId: string) {
  return Math.round(
    state.lessons
      .filter((lesson) => String(lesson.student_id ?? "") === studentId && String(lesson.status ?? "").toLowerCase() === "completed")
      .reduce((total, lesson) => total + Number(lesson.duration_minutes ?? 0), 0) / 60
  );
}

function renderDynamicFilters() {
  const subjectFilter = document.querySelector<HTMLSelectElement>("[data-tutor-subject-filter]");
  const keyStageFilter = document.querySelector<HTMLSelectElement>("[data-tutor-keystage-filter]");

  if (subjectFilter) {
    const currentValue = subjectFilter.value;
    const values = uniqueValues(state.tutors.flatMap((profile) => profile.subjects ?? []));
    subjectFilter.innerHTML = [`<option value="all">All subjects</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
    subjectFilter.value = values.includes(currentValue) ? currentValue : "all";
  }

  if (keyStageFilter) {
    const currentValue = keyStageFilter.value;
    const values = uniqueValues(state.tutors.flatMap((profile) => profile.key_stages ?? []));
    keyStageFilter.innerHTML = [`<option value="all">All key stages</option>`, ...values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join("");
    keyStageFilter.value = values.includes(currentValue) ? currentValue : "all";
  }
}

function renderOverview() {
  const activeStudents = state.students.filter((student) => getStudentStatus(student) === "active");
  const activeTutors = state.tutors.filter((profile) => String(profile.status ?? "active").toLowerCase() === "active");
  const inactiveAccounts = [...state.tutors, ...state.parents].filter((profile) => String(profile.status ?? "active").toLowerCase() !== "active");
  const upcomingLessons = byRecentDate(
    state.lessons.filter((lesson) => String(lesson.status ?? "scheduled").toLowerCase() === "scheduled"),
    "lesson_date",
    "created_at"
  ).slice(0, 6);
  const recentReports = byRecentDate(state.reports, "lesson_date", "created_at").slice(0, 6);
  const recentStudents = byRecentDate(state.students, "created_at").slice(0, 6);
  const accountsNeedingAttention = [...state.tutors, ...state.parents].filter((profile) => {
    const status = String(profile.status ?? "active").toLowerCase();
    return status !== "active" || Boolean(profile.must_change_password);
  });
  const unlinkedParents = state.parents.filter((profile) => linkedStudentIdsForParent(profile.id).length === 0).slice(0, 6);
  const studentsWithoutTutor = state.students.filter((student) => tutorNamesForStudent(student.id).length === 0).slice(0, 6);
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const assessmentsThisMonth = state.assessments.filter((assessment) => {
    const date = assessment.assessment_date ?? assessment.created_at;
    return date ? new Date(String(date)).getTime() >= monthStart.getTime() : false;
  });

  metric("[data-overview-active-students]", String(activeStudents.length));
  metric("[data-overview-active-tutors]", String(activeTutors.length));
  metric("[data-overview-parents]", String(state.parents.length));
  metric("[data-overview-upcoming-lessons]", String(upcomingLessons.length));
  metric("[data-overview-reports-review]", String(recentReports.length));
  metric("[data-overview-assessments-month]", String(assessmentsThisMonth.length));
  metric("[data-overview-inactive-accounts]", String(inactiveAccounts.length));

  const studentMap = new Map(state.students.map((student) => [student.id, student]));
  const upcomingContainer = document.querySelector<HTMLElement>("[data-overview-upcoming-list]");
  if (upcomingContainer) {
    renderLessonList(upcomingContainer, upcomingLessons, studentMap, {
      emptyTitle: "No upcoming lessons",
      emptyBody: "No data available.",
      limit: 6,
      mode: "upcoming"
    });
  }

  renderHtmlList(
    "[data-overview-recent-students]",
    recentStudents.map((student) =>
      htmlListItem(getStudentName(student), [student.year_group, student.school].filter(Boolean).join(" • ") || "Student record recently created")
    )
  );

  const reportsContainer = document.querySelector<HTMLElement>("[data-overview-recent-reports]");
  if (reportsContainer) {
    renderReportTimeline(reportsContainer, recentReports, studentMap);
  }

  renderHtmlList(
    "[data-overview-attention]",
    accountsNeedingAttention.slice(0, 6).map((profile) => {
      const status = getAccountStatusMeta(profile.status);
      return htmlListItem(
        getProfileName(profile),
        profile.email ?? "Email not recorded",
        `<span class="metric-pill ${status.badgeClass}">${escapeHtml(attentionLabel(profile))}</span>`
      );
    })
  );

  renderHtmlList(
    "[data-overview-unlinked-parents]",
    unlinkedParents.map((profile) => htmlListItem(getProfileName(profile), profile.email ?? "Email not recorded"))
  );

  renderHtmlList(
    "[data-overview-unassigned-students]",
    studentsWithoutTutor.map((student) => htmlListItem(getStudentName(student), student.year_group ?? "Year group not recorded"))
  );

  renderAuditTimeline("[data-audit-timeline='overview-audit']", state.auditLogs.slice(0, 10));
}

function renderAuditTimeline(selector: string, entries: AuditLogRow[]) {
  renderHtmlList(
    selector,
    entries.map((entry) =>
      htmlListItem(
        String(entry.action ?? "Activity").replaceAll("_", " "),
        `${entry.entity_type ?? "account"} • ${formatDate(entry.created_at ?? "")}`
      )
    )
  );
}

function tableHeadMarkup(columns: string[]) {
  return columns.map((column) => `<th class="px-4 py-3 font-semibold">${escapeHtml(column)}</th>`).join("");
}

function menuMarkup(entityType: EntityType, entityId: string) {
  const manageLabel =
    entityType === "tutor" ? "Manage tutor" : entityType === "parent" ? "Manage parent" : "Manage student";

  return `
    <details class="relative" data-row-menu data-entity-type="${escapeHtml(entityType)}" data-entity-id="${escapeHtml(entityId)}">
      <summary class="focus-pill grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full border border-slate-200 bg-white text-fb-ink" aria-label="${escapeHtml(manageLabel)}" aria-haspopup="menu">
        <span class="text-lg leading-none">⋯</span>
      </summary>
      <div class="absolute right-0 top-[2.75rem] z-20 w-64 rounded-[1rem] border border-white/70 bg-white p-2 shadow-xl shadow-slate-900/10" role="menu">
        <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="view" type="button">View profile</button>
        <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="edit" type="button">Edit ${escapeHtml(entityType)}</button>
        ${
          entityType === "student"
            ? `
              <div class="my-1 border-t border-slate-200"></div>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="assign-tutor" type="button">Assign tutor</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="link-parent" type="button">Link parent</button>
              <div class="my-1 border-t border-slate-200"></div>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="add-lesson" type="button">Add lesson</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="add-report" type="button">Add report</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="add-assessment" type="button">Add assessment</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="add-target" type="button">Add target</button>
              <div class="my-1 border-t border-slate-200"></div>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="mark-inactive" type="button">Mark inactive</button>
            `
            : `
              <div class="my-1 border-t border-slate-200"></div>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="assign-students" type="button">${entityType === "tutor" ? "Assign students" : "Link student"}</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="unlink-students" type="button">${entityType === "tutor" ? "Manage assignments" : "Unlink student"}</button>
              ${
                entityType === "tutor"
                  ? `<button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="manage-subjects" type="button">Manage subjects</button>
                     <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="manage-key-stages" type="button">Manage key stages</button>`
                  : `<button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="copy-login-email" type="button">Copy login email</button>`
              }
              <div class="my-1 border-t border-slate-200"></div>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="reset-password" type="button">Reset password</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="resend-welcome" type="button">Resend welcome email</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="send-reminder" type="button">Send login reminder</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="suspend" type="button">Suspend account</button>
              <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="reactivate" type="button">Reactivate account</button>
            `
        }
        <div class="my-1 border-t border-slate-200"></div>
        <button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" data-row-action="archive" type="button">${entityType === "parent" ? "Archive parent" : "Archive"}</button>
        ${
          entityType === "student" || entityType === "parent"
            ? ""
            : `<div class="my-1 border-t border-slate-200"></div><button class="block w-full rounded-[0.9rem] px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" data-row-action="delete" type="button">Delete permanently</button>`
        }
      </div>
    </details>
  `;
}

function renderStudents() {
  const head = document.querySelector<HTMLElement>("[data-admin-table-head='students']");
  const body = document.querySelector<HTMLElement>("[data-admin-table-body='students']");
  const cards = document.querySelector<HTMLElement>("[data-admin-cards='students-cards']");
  if (!head || !body || !cards) return;

  head.innerHTML = tableHeadMarkup(["", "Student", "Status", "Target", "Recall", "Completed hours", "Assigned tutor", "Linked parents", "Next lesson", "Last report", ""]);

  const localQuery = document.querySelector<HTMLInputElement>("[data-student-search]")?.value.trim().toLowerCase() ?? "";
  const statusFilter = document.querySelector<HTMLSelectElement>("[data-student-status-filter]")?.value ?? "all";
  const tutorFilter = document.querySelector<HTMLSelectElement>("[data-student-tutor-filter]")?.value ?? "all";
  const sort = document.querySelector<HTMLSelectElement>("[data-student-sort]")?.value ?? "name";

  const filtered = state.students
    .filter((student) => {
      const tutors = tutorNamesForStudent(student.id);
      const hasTutor = tutors.length > 0;
      const statusValue = getStudentStatus(student);
      return (
        matchesQuery([getStudentName(student), student.school, student.year_group], localQuery) &&
        (statusFilter === "all" ? statusValue !== "archived" : statusValue === statusFilter) &&
        (tutorFilter === "all" || (tutorFilter === "assigned" ? hasTutor : !hasTutor))
      );
    })
    .sort((a, b) => {
      if (sort === "created") return new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime();
      if (sort === "next_lesson") return new Date(String(latestLessonForStudent(a.id)?.lesson_date ?? 0)).getTime() - new Date(String(latestLessonForStudent(b.id)?.lesson_date ?? 0)).getTime();
      return getStudentName(a).localeCompare(getStudentName(b));
    });

  body.innerHTML = filtered.length
    ? filtered
        .map((student) => {
          const status = getAccountStatusMeta(getStudentStatus(student));
          const tutors = tutorNamesForStudent(student.id);
          const parents = parentNamesForStudent(student.id);
          const nextLesson = latestLessonForStudent(student.id);
          const lastReport = latestReportForStudent(student.id);
          return `
            <tr class="border-b border-slate-200 last:border-b-0" data-profile-open data-entity-type="student" data-entity-id="${escapeHtml(student.id)}" tabindex="0" role="link" aria-label="Open student profile for ${escapeHtml(getStudentName(student))}">
              <td class="px-4 py-3 align-top"><input class="h-4 w-4 rounded border-slate-300" data-select-row="students" data-row-id="${escapeHtml(student.id)}" type="checkbox" ${selected.students.has(student.id) ? "checked" : ""} /></td>
              <td class="px-4 py-3 align-top">
                <p class="font-semibold text-fb-ink">${escapeHtml(getStudentName(student))}</p>
                <p class="mt-1 text-xs text-fb-ink-soft">${escapeHtml([student.year_group, student.school].filter(Boolean).join(" • ") || "Year group and school not recorded")}</p>
              </td>
              <td class="px-4 py-3 align-top"><span class="metric-pill ${status.badgeClass}">${escapeHtml(status.label)}</span></td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(student.target_grade ?? "Not recorded")}</td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(String(student.recall_average ?? "Not recorded"))}</td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(`${completedHoursForStudent(student.id)}h`)}</td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(tutors.join(", ") || "Unassigned")}</td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(parents.join(", ") || "No linked parent")}</td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(nextLesson?.lesson_date ? formatDate(nextLesson.lesson_date) : "No data available.")}</td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(lastReport?.lesson_date ? formatDate(lastReport.lesson_date) : "No data available.")}</td>
              <td class="px-4 py-3 align-top text-right">${menuMarkup("student", student.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td class="px-4 py-4 text-sm text-fb-ink-soft" colspan="11">No data available.</td></tr>`;

  cards.innerHTML = filtered.length
    ? filtered
        .map((student) => {
          const status = getAccountStatusMeta(getStudentStatus(student));
          return `
            <article class="dashboard-list-item" data-profile-open data-entity-type="student" data-entity-id="${escapeHtml(student.id)}" tabindex="0" role="link" aria-label="Open student profile for ${escapeHtml(getStudentName(student))}">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-fb-ink">${escapeHtml(getStudentName(student))}</p>
                  <p class="mt-1 text-sm text-fb-ink-soft">${escapeHtml([student.year_group, student.school].filter(Boolean).join(" • ") || "Year group and school not recorded")}</p>
                </div>
                ${menuMarkup("student", student.id)}
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="metric-pill ${status.badgeClass}">${escapeHtml(status.label)}</span>
                <span class="mini-chip">${escapeHtml(student.target_grade ?? "No target grade")}</span>
              </div>
              <p class="mt-3 text-sm text-fb-ink-soft">Tutor: ${escapeHtml(tutorNamesForStudent(student.id).join(", ") || "Unassigned")}</p>
              <p class="mt-1 text-sm text-fb-ink-soft">Parents: ${escapeHtml(parentNamesForStudent(student.id).join(", ") || "No linked parent")}</p>
            </article>
          `;
        })
        .join("")
    : `<article class="dashboard-list-item text-sm text-fb-ink-soft">No data available.</article>`;
}

function renderMemberTable(entityType: "tutor" | "parent") {
  const plural = `${entityType}s`;
  const head = document.querySelector<HTMLElement>(`[data-admin-table-head='${plural}']`);
  const body = document.querySelector<HTMLElement>(`[data-admin-table-body='${plural}']`);
  const cards = document.querySelector<HTMLElement>(`[data-admin-cards='${plural}-cards']`);
  if (!head || !body || !cards) return;

  const profiles = entityType === "tutor" ? state.tutors : state.parents;
  const localQuery = document.querySelector<HTMLInputElement>(`[data-${entityType}-search]`)?.value.trim().toLowerCase() ?? "";
  const statusFilter = document.querySelector<HTMLSelectElement>(`[data-${entityType}-status-filter]`)?.value ?? "all";
  const sort = document.querySelector<HTMLSelectElement>(`[data-${entityType}-sort]`)?.value ?? "name";
  const subjectFilter = entityType === "tutor" ? document.querySelector<HTMLSelectElement>("[data-tutor-subject-filter]")?.value ?? "all" : "all";
  const keyStageFilter = entityType === "tutor" ? document.querySelector<HTMLSelectElement>("[data-tutor-keystage-filter]")?.value ?? "all" : "all";
  const linkFilter = entityType === "parent" ? document.querySelector<HTMLSelectElement>("[data-parent-link-filter]")?.value ?? "all" : "all";

  head.innerHTML =
    entityType === "tutor"
      ? tableHeadMarkup(["", "Tutor", "Status", "Subjects", "Key stages", "Assigned students", "Upcoming lessons", "Last login", "Date created", ""])
      : tableHeadMarkup(["", "Parent", "Status", "Linked students", "Portal setup", "Password state", "Last login", "Date created", ""]);

  const filtered = profiles
    .filter((profile) => {
      const linkedIds = entityType === "tutor" ? linkedStudentIdsForTutor(profile.id) : linkedStudentIdsForParent(profile.id);
      return (
        matchesQuery([getProfileName(profile), profile.email, profile.phone], localQuery) &&
        (statusFilter === "all"
          ? String(profile.status ?? "active").toLowerCase() !== "archived"
          : String(profile.status ?? "active").toLowerCase() === statusFilter) &&
        (entityType !== "tutor" || subjectFilter === "all" || (profile.subjects ?? []).includes(subjectFilter)) &&
        (entityType !== "tutor" || keyStageFilter === "all" || (profile.key_stages ?? []).includes(keyStageFilter)) &&
        (entityType !== "parent" || linkFilter === "all" || (linkFilter === "linked" ? linkedIds.length > 0 : linkedIds.length === 0))
      );
    })
    .sort((a, b) => {
      if (sort === "created") return new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime();
      if (sort === "last_login") return new Date(String(b.last_login_at ?? 0)).getTime() - new Date(String(a.last_login_at ?? 0)).getTime();
      return getProfileName(a).localeCompare(getProfileName(b));
    });

  body.innerHTML = filtered.length
    ? filtered
        .map((profile) => {
          const status = getAccountStatusMeta(profile.status);
          const linkedIds = entityType === "tutor" ? linkedStudentIdsForTutor(profile.id) : linkedStudentIdsForParent(profile.id);
          const linkedNames = linkedIds.map((id) => studentById(id)).filter((student): student is StudentRow => Boolean(student)).map((student) => getStudentName(student));
          const portalState = entityType === "parent" ? setupStateLabel(profile, linkedIds.length) : "";
          const upcomingLessons =
            entityType === "tutor"
              ? state.lessons.filter((lesson) => String(lesson.tutor_id ?? "") === profile.id && String(lesson.status ?? "scheduled").toLowerCase() === "scheduled").length
              : 0;
          return `
            <tr class="border-b border-slate-200 last:border-b-0" data-profile-open data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(entityType)} profile for ${escapeHtml(getProfileName(profile))}">
              <td class="px-4 py-3 align-top"><input class="h-4 w-4 rounded border-slate-300" data-select-row="${plural}" data-row-id="${escapeHtml(profile.id)}" type="checkbox" ${selected[plural as SelectGroup].has(profile.id) ? "checked" : ""} /></td>
              <td class="px-4 py-3 align-top">
                <p class="font-semibold text-fb-ink">${escapeHtml(getProfileName(profile))}</p>
                <p class="mt-1 text-xs text-fb-ink-soft">${escapeHtml(profile.email ?? "Email not recorded")}</p>
              </td>
              <td class="px-4 py-3 align-top"><span class="metric-pill ${status.badgeClass}">${escapeHtml(status.label)}</span></td>
              ${
                entityType === "tutor"
                  ? `
                    <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml((profile.subjects ?? []).join(", ") || "No data available.")}</td>
                    <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml((profile.key_stages ?? []).join(", ") || "No data available.")}</td>
                    <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(linkedNames.join(", ") || "No data available.")}</td>
                    <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(String(upcomingLessons))}</td>
                  `
                  : `
                    <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(linkedNames.join(", ") || "No linked student")}</td>
                    <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(portalState)}</td>
                    <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(profile.must_change_password ? "Change required" : "Up to date")}</td>
                  `
              }
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(profile.last_login_at ? formatDate(profile.last_login_at) : "No data available.")}</td>
              <td class="px-4 py-3 align-top text-sm text-fb-ink-soft">${escapeHtml(profile.created_at ? formatDate(profile.created_at) : "No data available.")}</td>
              <td class="px-4 py-3 align-top text-right">${menuMarkup(entityType, profile.id)}</td>
            </tr>
          `;
        })
        .join("")
    : `<tr><td class="px-4 py-4 text-sm text-fb-ink-soft" colspan="${entityType === "tutor" ? "10" : "9"}">No data available.</td></tr>`;

  cards.innerHTML = filtered.length
    ? filtered
        .map((profile) => {
          const status = getAccountStatusMeta(profile.status);
          const linkedIds = entityType === "tutor" ? linkedStudentIdsForTutor(profile.id) : linkedStudentIdsForParent(profile.id);
          const linkedNames = linkedIds.map((id) => studentById(id)).filter((student): student is StudentRow => Boolean(student)).map((student) => getStudentName(student));
          return `
            <article class="dashboard-list-item" data-profile-open data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" tabindex="0" role="link" aria-label="Open ${escapeHtml(entityType)} profile for ${escapeHtml(getProfileName(profile))}">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-fb-ink">${escapeHtml(getProfileName(profile))}</p>
                  <p class="mt-1 text-sm text-fb-ink-soft">${escapeHtml(profile.email ?? "Email not recorded")}</p>
                </div>
                ${menuMarkup(entityType, profile.id)}
              </div>
              <div class="mt-3 flex flex-wrap gap-2">
                <span class="metric-pill ${status.badgeClass}">${escapeHtml(status.label)}</span>
                ${entityType === "parent" ? `<span class="mini-chip">${escapeHtml(setupStateLabel(profile, linkedIds.length))}</span>` : ""}
              </div>
              ${
                entityType === "tutor"
                  ? `
                    <p class="mt-3 text-sm text-fb-ink-soft">Subjects: ${escapeHtml((profile.subjects ?? []).join(", ") || "No data available.")}</p>
                    <p class="mt-1 text-sm text-fb-ink-soft">Key stages: ${escapeHtml((profile.key_stages ?? []).join(", ") || "No data available.")}</p>
                  `
                  : `<p class="mt-3 text-sm text-fb-ink-soft">Linked students: ${escapeHtml(linkedNames.join(", ") || "No linked student")}</p>`
              }
            </article>
          `;
        })
        .join("")
    : `<article class="dashboard-list-item text-sm text-fb-ink-soft">No data available.</article>`;
}

function renderLessonsReportsAssessmentsArticles() {
  const studentMap = new Map(state.students.map((student) => [student.id, student]));

  const lessonsContainer = document.querySelector<HTMLElement>("[data-admin-lessons]");
  if (lessonsContainer) {
    renderLessonList(lessonsContainer, state.lessons, studentMap, {
      emptyTitle: "No lessons",
      emptyBody: "No data available.",
      limit: 20,
      mode: "upcoming"
    });
  }

  const reportContainer = document.querySelector<HTMLElement>("[data-audit-timeline='admin-report-activity']");
  if (reportContainer) {
    renderReportTimeline(reportContainer, byRecentDate(state.reports, "lesson_date", "created_at").slice(0, 12), studentMap);
  }

  const assessmentsContainer = document.querySelector<HTMLElement>("[data-admin-assessments]");
  if (assessmentsContainer) {
    renderAssessmentList(assessmentsContainer, state.assessments, studentMap);
  }

  const articlesContainer = document.querySelector<HTMLElement>("[data-admin-articles]");
  if (articlesContainer) {
    articlesContainer.innerHTML = state.articles.length
      ? state.articles
          .map((article) => {
            const subtitle = [article.status ?? "draft", article.slug ?? "no-slug"].join(" • ");
            return htmlListItem(article.title ?? "Untitled article", subtitle);
          })
          .join("")
      : `<article class="dashboard-list-item text-sm text-fb-ink-soft">No data available.</article>`;
  }
}

function openProfileUrl(entityType: EntityType, entityId: string, tabOverride?: AdminTab) {
  const url = new URL(window.location.href);
  url.searchParams.set("profileType", entityType);
  url.searchParams.set("id", entityId);
  url.searchParams.set("tab", tabOverride ?? (entityType === "student" ? "students" : `${entityType}s` as AdminTab));
  window.history.pushState({}, "", url);
}

function clearProfileUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("profileType");
  url.searchParams.delete("id");
  window.history.pushState({}, "", url);
}

function syncUrlIntoViewState() {
  const url = new URL(window.location.href);
  const tab = url.searchParams.get("tab") as AdminTab | null;
  const profileType = url.searchParams.get("profileType") as EntityType | null;
  const entityId = url.searchParams.get("id");

  if (tab) {
    goToTab(tab);
  }

  if (profileType && entityId) {
    window.setTimeout(() => {
      buildEntityDrawer(profileType, entityId, null);
    }, 0);
  }
}

function renderArchivedSection() {
  const mappings = {
    parents: state.parents.filter((profile) => String(profile.status ?? "active").toLowerCase() === "archived"),
    tutors: state.tutors.filter((profile) => String(profile.status ?? "active").toLowerCase() === "archived"),
    students: state.students.filter((student) => getStudentStatus(student) === "archived")
  } as const;

  (Object.keys(mappings) as Array<keyof typeof mappings>).forEach((key) => {
    const container = document.querySelector<HTMLElement>(`[data-admin-archived-list='${key}']`);
    if (!container) return;

    const items = mappings[key];
    if (!items.length) {
      container.innerHTML = `<article class="dashboard-list-item text-sm text-fb-ink-soft">No archived ${key}.</article>`;
      return;
    }

    container.innerHTML = items
      .map((item) => {
        if (key === "students") {
          const student = item as StudentRow;
          return `
            <article class="dashboard-list-item">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div class="min-w-0">
                  <button class="text-left text-sm font-semibold text-fb-ink underline-offset-4 hover:underline" data-profile-open data-entity-type="student" data-entity-id="${escapeHtml(student.id)}" type="button">${escapeHtml(getStudentName(student))}</button>
                  <p class="mt-1 text-sm text-fb-ink-soft">${escapeHtml([student.year_group, student.school].filter(Boolean).join(" • ") || "Student details not recorded")}</p>
                  <p class="mt-2 text-xs text-fb-ink-soft">Archived: ${escapeHtml(student.archived_at ? formatDate(String(student.archived_at)) : "Not recorded")}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button class="ghost-button px-4 py-2 text-sm" data-archived-action="restore-student" data-entity-id="${escapeHtml(student.id)}" type="button">Restore</button>
                </div>
              </div>
            </article>
          `;
        }

        const profile = item as ProfileRow;
        return `
          <article class="dashboard-list-item">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div class="min-w-0">
                <button class="text-left text-sm font-semibold text-fb-ink underline-offset-4 hover:underline" data-profile-open data-entity-type="${key === "parents" ? "parent" : "tutor"}" data-entity-id="${escapeHtml(profile.id)}" type="button">${escapeHtml(getProfileName(profile))}</button>
                <p class="mt-1 text-sm text-fb-ink-soft">${escapeHtml(profile.email ?? "Email not recorded")}</p>
                <p class="mt-2 text-xs text-fb-ink-soft">Archived: ${escapeHtml(profile.archived_at ? formatDate(String(profile.archived_at)) : "Not recorded")}</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button class="ghost-button px-4 py-2 text-sm" data-archived-action="restore-portal" data-entity-type="${key === "parents" ? "parent" : "tutor"}" data-entity-id="${escapeHtml(profile.id)}" type="button">Restore</button>
                ${
                  key === "parents"
                    ? ""
                    : `<button class="ghost-button px-4 py-2 text-sm text-rose-700" data-archived-action="delete-portal" data-entity-type="${key === "parents" ? "parent" : "tutor"}" data-entity-id="${escapeHtml(profile.id)}" type="button">Delete permanently</button>`
                }
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  });

  document.querySelectorAll<HTMLElement>("[data-archived-tab]").forEach((button) => {
    const active = button.dataset.archivedTab === archivedState.activeTab;
    button.setAttribute("aria-selected", String(active));
    button.classList.toggle("bg-fb-bg", active);
    button.classList.toggle("text-white", active);
  });

  document.querySelectorAll<HTMLElement>("[data-archived-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.archivedPanel !== archivedState.activeTab);
  });
}

function refreshViews() {
  renderDynamicFilters();
  renderOverview();
  renderStudents();
  renderMemberTable("tutor");
  renderMemberTable("parent");
  renderLessonsReportsAssessmentsArticles();
  renderArchivedSection();
  wireSelection();
  wireMenus();
  wireProfileOpeners();
  updateBulkBar("students");
  updateBulkBar("tutors");
  updateBulkBar("parents");
}

function openDrawer(title: string, body: string, trigger?: HTMLElement | null) {
  const drawer = document.querySelector<HTMLElement>("[data-admin-drawer='member-detail']");
  const backdrop = document.querySelector<HTMLElement>("[data-admin-drawer-backdrop='member-detail']");
  const titleNode = document.querySelector<HTMLElement>("[data-admin-drawer-title='member-detail']");
  const bodyNode = document.querySelector<HTMLElement>("[data-admin-drawer-body='member-detail']");
  if (!drawer || !backdrop || !titleNode || !bodyNode) return;

  drawerState.restoreFocusTo = trigger ?? null;
  titleNode.textContent = title;
  bodyNode.innerHTML = body;
  drawer.classList.remove("hidden");
  backdrop.classList.remove("hidden");
  drawer.setAttribute("aria-hidden", "false");
  syncBodyLock();
  trapFocus(drawer);
  window.requestAnimationFrame(() => focusFirstElement(drawer));
}

function closeDrawer() {
  const drawer = document.querySelector<HTMLElement>("[data-admin-drawer='member-detail']");
  const backdrop = document.querySelector<HTMLElement>("[data-admin-drawer-backdrop='member-detail']");
  if (!drawer || !backdrop) return;
  drawer.classList.add("hidden");
  backdrop.classList.add("hidden");
  drawer.setAttribute("aria-hidden", "true");
  syncBodyLock();
  releaseFocusTrap(drawer);
  drawerState.entityType = null;
  drawerState.entityId = null;
  clearProfileUrl();
  drawerState.restoreFocusTo?.focus();
  drawerState.restoreFocusTo = null;
}

function wireProfileOpeners() {
  document.querySelectorAll<HTMLElement>("[data-profile-open]").forEach((button) => {
    if (button.dataset.profileBound === "true") return;
    button.dataset.profileBound = "true";
    const openProfile = () => {
      const entityType = button.dataset.entityType as EntityType;
      const entityId = button.dataset.entityId ?? "";
      openProfileUrl(entityType, entityId);
      buildEntityDrawer(entityType, entityId, button);
    };
    button.addEventListener("click", (event) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("button, a, input, select, textarea, summary, [data-row-menu], [data-row-action], [data-select-row]")) {
        return;
      }
      openProfile();
    });
    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openProfile();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-archived-action]").forEach((button) => {
    if (button.dataset.archivedBound === "true") return;
    button.dataset.archivedBound = "true";
    button.addEventListener("click", async () => {
      const action = button.dataset.archivedAction ?? "";
      const entityId = button.dataset.entityId ?? "";
      const entityType = button.dataset.entityType as "parent" | "tutor" | undefined;

      try {
        if (action === "restore-portal") {
          await restorePortalUser({ userId: entityId });
        } else if (action === "restore-student") {
          await restoreStudent({ studentId: entityId });
        } else if (action === "delete-portal" && entityType) {
          if (entityType === "parent") {
            throw new Error("Parent accounts are archived to preserve linked history and cannot be deleted permanently from this dashboard.");
          }
          const profile = profileById(entityType, entityId);
          if (!profile?.email) {
            throw new Error("The archived account is missing its stored email address.");
          }
          openConfirmation({
            title: "Delete permanently",
            body: "This permanently removes the archived portal account and its login access while preserving educational history where possible.",
            buttonLabel: "Delete permanently",
            entitySummary: `${getProfileName(profile)} • ${profile.email}`,
            confirmLabel: `Type ${profile.email} to confirm`,
            confirmValue: profile.email,
            helperText: "Permanent deletion is only available for archived portal accounts.",
            run: async () => {
              await deletePortalUser({
                userId: entityId,
                email: profile.email ?? "",
                entityType,
                confirmationEmail: profile.email ?? ""
              });
              await refresh();
            }
          });
          return;
        }
        await refresh();
      } catch (error) {
        window.alert(await getFriendlyErrorMessage(error, "We could not complete that archived-record action just now."));
      }
    });
  });
}

function openConfirmation(config: {
  title: string;
  body: string;
  buttonLabel: string;
  confirmLabel?: string;
  confirmValue?: string;
  entitySummary?: string;
  helperText?: string;
  run: () => Promise<void>;
}) {
  const dialog = document.querySelector<HTMLElement>("[data-confirmation-dialog='member-action']");
  const title = document.querySelector<HTMLElement>("[data-confirm-title='member-action']");
  const body = document.querySelector<HTMLElement>("[data-confirm-body='member-action']");
  const entity = document.querySelector<HTMLElement>("[data-confirm-entity='member-action']");
  const submit = document.querySelector<HTMLButtonElement>("[data-confirm-submit='member-action']");
  const inputWrap = document.querySelector<HTMLElement>("[data-confirm-input-wrap='member-action']");
  const input = document.querySelector<HTMLInputElement>("[data-confirm-input='member-action']");
  const label = document.querySelector<HTMLElement>("[data-confirm-label='member-action']");
  const helper = document.querySelector<HTMLElement>("[data-confirm-helper='member-action']");
  const status = document.querySelector<HTMLElement>("[data-confirm-status='member-action']");
  const devHint = document.querySelector<HTMLElement>("[data-confirm-devhint='member-action']");
  const retry = document.querySelector<HTMLElement>("[data-confirm-actions='member-action']");
  if (!dialog || !title || !body || !submit || !inputWrap || !input || !label) return;

  title.textContent = config.title;
  body.textContent = config.body;
  if (entity) {
    entity.textContent = config.entitySummary ?? "";
    entity.classList.toggle("hidden", !config.entitySummary);
  }
  if (helper) {
    helper.textContent = config.helperText ?? "";
  }
  submit.textContent = config.buttonLabel;
  submit.disabled = Boolean(config.confirmValue);
  if (status) status.classList.add("hidden");
  if (devHint) devHint.classList.add("hidden");
  if (retry) retry.classList.add("hidden");
  input.value = "";
  if (config.confirmValue) {
    inputWrap.classList.remove("hidden");
    label.textContent = config.confirmLabel ?? "Type to confirm";
  } else {
    inputWrap.classList.add("hidden");
  }

  confirmationState.run = async () => {
    submit.disabled = true;
    const originalLabel = config.buttonLabel;
    submit.textContent = "Deleting…";
    try {
      if (config.confirmValue && input.value.trim() !== config.confirmValue.trim()) {
        setStatusMessage(status, "error", "The confirmation value did not match exactly.");
        submit.disabled = false;
        submit.textContent = originalLabel;
        return;
      }
      await config.run();
      closeConfirmation();
    } catch (error) {
      if (import.meta.env.DEV && devHint) {
        devHint.textContent = error instanceof Error ? error.message : String(error);
        devHint.className = "surface-note mt-5";
        devHint.classList.remove("hidden");
      }
      if (retry) retry.classList.remove("hidden");
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "The account could not be deleted just now."));
      submit.disabled = Boolean(config.confirmValue && input.value.trim() !== config.confirmValue.trim());
      submit.textContent = originalLabel;
    }
  };

  dialog.dataset.open = "true";
  dialog.setAttribute("aria-hidden", "false");
  syncBodyLock();
  trapFocus(dialog);
  window.requestAnimationFrame(() => {
    if (config.confirmValue) input.focus();
    else submit.focus();
  });

  input.oninput = () => {
    if (!config.confirmValue) return;
    submit.disabled = input.value.trim() !== config.confirmValue.trim();
    if (status?.classList.contains("status-error")) {
      status.classList.add("hidden");
    }
  };
}

function closeConfirmation() {
  const dialog = document.querySelector<HTMLElement>("[data-confirmation-dialog='member-action']");
  if (!dialog) return;
  dialog.dataset.open = "false";
  dialog.setAttribute("aria-hidden", "true");
  syncBodyLock();
  releaseFocusTrap(dialog);
  confirmationState.run = null;
}

function drawerActionButtons(entityType: "tutor" | "parent", profile: ProfileRow) {
  const status = String(profile.status ?? "active").toLowerCase();
  return `
    <div class="flex flex-wrap gap-2">
      <button class="quick-add-chip" data-drawer-action="reset-password" data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" type="button">Reset password</button>
      <button class="quick-add-chip" data-drawer-action="resend-welcome" data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" type="button">Resend welcome</button>
      <button class="quick-add-chip" data-drawer-action="send-reminder" data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" type="button">Send reminder</button>
      ${
        status === "active"
          ? `<button class="quick-add-chip" data-drawer-action="suspend" data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" type="button">Suspend</button>`
          : `<button class="quick-add-chip" data-drawer-action="reactivate" data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" type="button">Reactivate</button>`
      }
      <button class="quick-add-chip" data-drawer-action="archive" data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" type="button">${entityType === "parent" ? "Archive parent" : "Archive"}</button>
      ${
        entityType === "parent"
          ? ""
          : `<button class="quick-add-chip !border-rose-200 !bg-rose-50 !text-rose-700" data-drawer-action="delete" data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}" type="button">Delete permanently</button>`
      }
    </div>
  `;
}

function assignmentMarkup(entityType: "tutor" | "parent", profile: ProfileRow, linkedIds: string[]) {
  const sectionTitle = entityType === "tutor" ? "Assigned students" : "Linked students";
  return `
    <form class="form-panel" data-link-manager data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}">
      <h3 class="text-lg font-semibold text-fb-ink">${sectionTitle}</h3>
      <p class="mt-2 text-sm leading-6 text-fb-ink-soft">Select the students that should remain connected to this portal account. Existing links are shown below.</p>
      <div class="mt-4 space-y-2">
        ${
          state.students.length
            ? state.students
                .map((student) => {
                  const checked = linkedIds.includes(student.id) ? "checked" : "";
                  return `
                    <label class="flex items-start gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/60 px-4 py-3">
                      <input class="mt-1 h-4 w-4 rounded border-slate-300" name="student-link" type="checkbox" value="${escapeHtml(student.id)}" ${checked} />
                      <span class="min-w-0">
                        <span class="block text-sm font-semibold text-fb-ink">${escapeHtml(getStudentName(student))}</span>
                        <span class="mt-1 block text-sm text-fb-ink-soft">${escapeHtml([student.year_group, student.school].filter(Boolean).join(" • ") || "Student details not recorded")}</span>
                      </span>
                    </label>
                  `;
                })
                .join("")
            : `<article class="dashboard-list-item text-sm text-fb-ink-soft">No students available.</article>`
        }
      </div>
      <p class="status-message mt-4 hidden" data-form-status role="status" aria-live="polite"></p>
      <div class="form-actions">
        <button class="cta-button w-full sm:w-auto" type="submit">Save assignments</button>
      </div>
    </form>
  `;
}

function noteMarkup(entityType: EntityType, entityId: string) {
  const note = noteForEntity(entityType, entityId);
  return `
    <form class="form-panel" data-admin-note-form data-entity-type="${escapeHtml(entityType)}" data-entity-id="${escapeHtml(entityId)}" data-note-id="${escapeHtml(note?.id ?? "")}">
      <h3 class="text-lg font-semibold text-fb-ink">Admin note</h3>
      <textarea class="input-shell mt-4 min-h-32 resize-y" name="note" placeholder="Internal admin note">${escapeHtml(note?.note ?? "")}</textarea>
      <p class="status-message mt-4 hidden" data-form-status role="status" aria-live="polite"></p>
      <div class="form-actions">
        <button class="cta-button w-full sm:w-auto" type="submit">Save note</button>
      </div>
    </form>
  `;
}

function auditMarkup(entityType: EntityType, entityId: string) {
  const audits = auditForEntity(entityType, entityId);
  return `
    <section class="dashboard-section">
      <h3 class="text-lg font-semibold text-fb-ink">Recent activity</h3>
      <div class="dashboard-card-stack mt-4">
        ${
          audits.length
            ? audits
                .map((entry) => htmlListItem(String(entry.action ?? "Activity").replaceAll("_", " "), formatDate(entry.created_at ?? "")))
                .join("")
            : `<article class="dashboard-list-item text-sm text-fb-ink-soft">No data available.</article>`
        }
      </div>
    </section>
  `;
}

function studentTimelineMarkup(studentId: string) {
  const lessonItems = lessonPreviewItems(studentId);
  const reportItems = reportPreviewItems(studentId);
  const assessmentItems = assessmentPreviewItems(studentId);
  const targetItems = targetPreviewItems(studentId);

  const renderSection = (title: string, items: string[]) => `
    <section class="dashboard-section">
      <h3 class="text-lg font-semibold text-fb-ink">${title}</h3>
      <div class="dashboard-card-stack mt-4">
        ${items.length ? items.join("") : `<article class="dashboard-list-item text-sm text-fb-ink-soft">No data available.</article>`}
      </div>
    </section>
  `;

  return `
    <div class="grid gap-4 lg:grid-cols-2">
      ${renderSection(
        "Lessons",
        lessonItems.map((lesson) => htmlListItem(lesson.lesson_title ?? lesson.subject ?? "Lesson", formatDate(lesson.lesson_date ?? "")))
      )}
      ${renderSection(
        "Reports",
        reportItems.map((report) => htmlListItem(report.topic ?? "Lesson report", formatDate(report.lesson_date ?? report.created_at ?? "")))
      )}
      ${renderSection(
        "Assessments",
        assessmentItems.map((assessment) => htmlListItem(assessment.title ?? "Assessment", formatDate(assessment.assessment_date ?? assessment.created_at ?? "")))
      )}
      ${renderSection(
        "Targets",
        targetItems.map((target) => htmlListItem(target.title ?? target.target ?? "Target", target.status ?? "Status not recorded"))
      )}
    </div>
  `;
}

function buildStudentDrawer(student: StudentRow, trigger?: HTMLElement | null) {
  const tutors = linkedProfilesForStudent(student.id, "tutor");
  const parents = linkedProfilesForStudent(student.id, "parent");
  const status = getAccountStatusMeta(getStudentStatus(student));

  openDrawer(
    getStudentName(student),
    `
      <div class="space-y-5">
        <section class="dashboard-list">
          <div class="dashboard-list-item">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Student status</p>
                <p class="mt-2 text-sm text-fb-ink-soft">${escapeHtml([student.year_group, student.school].filter(Boolean).join(" • ") || "Student details not recorded")}</p>
              </div>
              <span class="metric-pill ${status.badgeClass}">${escapeHtml(status.label)}</span>
            </div>
          </div>
          <div class="dashboard-list-item">
            <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Assigned tutors</p>
            <div class="mt-3 flex flex-wrap gap-2">
              ${
                tutors.length
                  ? tutors
                      .map(
                        (profile) => `<span class="mini-chip">${escapeHtml(getProfileName(profile))}</span>`
                      )
                      .join("")
                  : `<span class="text-sm text-fb-ink-soft">No tutor assigned.</span>`
              }
            </div>
          </div>
          <div class="dashboard-list-item">
            <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Linked parents</p>
            <div class="mt-3 flex flex-wrap gap-2">
              ${
                parents.length
                  ? parents
                      .map(
                        (profile) => `<span class="mini-chip">${escapeHtml(getProfileName(profile))}</span>`
                      )
                      .join("")
                  : `<span class="text-sm text-fb-ink-soft">No linked parent.</span>`
              }
            </div>
          </div>
        </section>

        <form class="form-panel" data-student-edit-form data-student-id="${escapeHtml(student.id)}">
          <h3 class="text-lg font-semibold text-fb-ink">Edit student</h3>
          <div class="form-grid mt-4">
            <label>
              <span class="label-shell">Full name</span>
              <input class="input-shell" name="full-name" type="text" value="${escapeHtml(getStudentName(student))}" required />
            </label>
            <label>
              <span class="label-shell">Year group</span>
              <input class="input-shell" name="year-group" type="text" value="${escapeHtml(student.year_group ?? "")}" />
            </label>
            <label>
              <span class="label-shell">School</span>
              <input class="input-shell" name="school" type="text" value="${escapeHtml(student.school ?? "")}" />
            </label>
            <label>
              <span class="label-shell">Target grade</span>
              <input class="input-shell" name="target-grade" type="text" value="${escapeHtml(student.target_grade ?? "")}" />
            </label>
            <label class="sm:col-span-2">
              <span class="label-shell">Status</span>
              <select class="input-shell" name="status">
                ${["active", "inactive", "archived"].map((value) => `<option value="${value}" ${getStudentStatus(student) === value ? "selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`).join("")}
              </select>
            </label>
            <label class="sm:col-span-2">
              <span class="label-shell">Notes</span>
              <textarea class="input-shell min-h-28 resize-y" name="notes">${escapeHtml(student.notes ?? "")}</textarea>
            </label>
          </div>
          <p class="status-message mt-4 hidden" data-form-status role="status" aria-live="polite"></p>
          <div class="form-actions">
            <button class="cta-button w-full sm:w-auto" type="submit">Save student</button>
          </div>
        </form>

        ${studentTimelineMarkup(student.id)}
        ${noteMarkup("student", student.id)}
        ${auditMarkup("student", student.id)}
      </div>
    `,
    trigger
  );
}

function buildPortalUserDrawer(entityType: "tutor" | "parent", profile: ProfileRow, trigger?: HTMLElement | null) {
  const linkedIds = entityType === "tutor" ? linkedStudentIdsForTutor(profile.id) : linkedStudentIdsForParent(profile.id);
  const linkedStudents = linkedIds.map((studentId) => studentById(studentId)).filter((student): student is StudentRow => Boolean(student));
  const status = getAccountStatusMeta(profile.status);

  openDrawer(
    getProfileName(profile),
    `
      <div class="space-y-5">
        <section class="dashboard-list">
          <div class="dashboard-list-item">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Profile</p>
                <p class="mt-2 text-sm text-fb-ink-soft">${escapeHtml(profile.email ?? "Email not recorded")}</p>
                <p class="mt-1 text-sm text-fb-ink-soft">${escapeHtml(profile.phone ?? "Phone not recorded")}</p>
              </div>
              <span class="metric-pill ${status.badgeClass}">${escapeHtml(status.label)}</span>
            </div>
          </div>
          <div class="dashboard-list-item">
            <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">${entityType === "tutor" ? "Assigned students" : "Linked students"}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              ${
                linkedStudents.length
                  ? linkedStudents.map((student) => `<span class="mini-chip">${escapeHtml(getStudentName(student))}</span>`).join("")
                  : `<span class="text-sm text-fb-ink-soft">No student linked yet.</span>`
              }
            </div>
          </div>
          ${
            entityType === "tutor"
              ? `
                <div class="dashboard-list-item" data-drawer-block="subjects">
                  <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Subjects</p>
                  <p class="mt-2 text-sm text-fb-ink-soft">${escapeHtml((profile.subjects ?? []).join(", ") || "No data available.")}</p>
                </div>
                <div class="dashboard-list-item" data-drawer-block="key-stages">
                  <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Key stages</p>
                  <p class="mt-2 text-sm text-fb-ink-soft">${escapeHtml((profile.key_stages ?? []).join(", ") || "No data available.")}</p>
                </div>
              `
              : `
                <div class="dashboard-list-item">
                  <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">Portal setup</p>
                  <p class="mt-2 text-sm text-fb-ink-soft">${escapeHtml(setupStateLabel(profile, linkedIds.length))}</p>
                </div>
              `
          }
        </section>

        <form class="form-panel" data-portal-user-form data-entity-type="${entityType}" data-entity-id="${escapeHtml(profile.id)}">
          <h3 class="text-lg font-semibold text-fb-ink">Edit ${entityType}</h3>
          <div class="form-grid mt-4">
            <label>
              <span class="label-shell">Full name</span>
              <input class="input-shell" name="full-name" type="text" value="${escapeHtml(profile.full_name ?? "")}" required />
            </label>
            <label>
              <span class="label-shell">Email</span>
              <input class="input-shell" name="email" type="email" value="${escapeHtml(profile.email ?? "")}" required />
            </label>
            <label>
              <span class="label-shell">Phone</span>
              <input class="input-shell" name="phone" type="tel" value="${escapeHtml(profile.phone ?? "")}" />
            </label>
            <label>
              <span class="label-shell">Status</span>
              <select class="input-shell" name="status">
                ${["active", "inactive", "suspended", "archived"].map((value) => `<option value="${value}" ${String(profile.status ?? "active").toLowerCase() === value ? "selected" : ""}>${value[0].toUpperCase()}${value.slice(1)}</option>`).join("")}
              </select>
            </label>
            ${
              entityType === "tutor"
                ? `
                  <label class="sm:col-span-2" data-drawer-block="subjects">
                    <span class="label-shell">Subjects</span>
                    <input class="input-shell" name="subjects" type="text" value="${escapeHtml((profile.subjects ?? []).join(", "))}" placeholder="Biology, Chemistry, Physics" />
                  </label>
                  <label class="sm:col-span-2" data-drawer-block="key-stages">
                    <span class="label-shell">Key stages</span>
                    <input class="input-shell" name="key-stages" type="text" value="${escapeHtml((profile.key_stages ?? []).join(", "))}" placeholder="KS3, GCSE, A Level" />
                  </label>
                `
                : ""
            }
          </div>
          <p class="status-message mt-4 hidden" data-form-status role="status" aria-live="polite"></p>
          <div class="form-actions">
            <button class="cta-button w-full sm:w-auto" type="submit">Save changes</button>
          </div>
        </form>

        ${assignmentMarkup(entityType, profile, linkedIds)}
        ${noteMarkup(entityType, profile.id)}

        <section class="dashboard-section">
          <h3 class="text-lg font-semibold text-fb-ink">Account actions</h3>
          <p class="mt-2 text-sm leading-6 text-fb-ink-soft">Archive is recommended for accounts that should no longer appear in active lists. Permanent deletion removes portal access only.</p>
          <div class="mt-4">
            ${drawerActionButtons(entityType, profile)}
          </div>
        </section>

        ${auditMarkup(entityType, profile.id)}
      </div>
    `,
    trigger
  );
}

function buildEntityDrawer(entityType: EntityType, entityId: string, trigger?: HTMLElement | null) {
  if (entityType === "student") {
    const student = studentById(entityId);
    if (!student) return;
    buildStudentDrawer(student, trigger);
    wireDrawerContent();
    return;
  }

  const profile = profileById(entityType, entityId);
  if (!profile) return;
  buildPortalUserDrawer(entityType, profile, trigger);
  wireDrawerContent();
}

function scrollDrawerBlock(blockName: string) {
  const node = document.querySelector<HTMLElement>(`[data-drawer-block='${blockName}']`);
  node?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function syncLinkedStudents(entityType: "tutor" | "parent", entityId: string, desiredIds: string[]) {
  const existingIds = entityType === "tutor" ? linkedStudentIdsForTutor(entityId) : linkedStudentIdsForParent(entityId);
  const toAdd = desiredIds.filter((studentId) => !existingIds.includes(studentId));
  const toRemove = existingIds.filter((studentId) => !desiredIds.includes(studentId));

  for (const studentId of toAdd) {
    if (entityType === "tutor") {
      await linkTutorToStudent({ tutorId: entityId, studentId });
    } else {
      await linkParentToStudent({ parentId: entityId, studentId });
    }
  }

  for (const studentId of toRemove) {
    if (entityType === "tutor") {
      await unlinkTutorFromStudent({ tutorId: entityId, studentId });
      await createAuditEntry({
        actorId: sessionState.adminId,
        action: "tutor_unassigned",
        entityType: "tutor",
        entityId,
        metadata: { studentId }
      });
    } else {
      await unlinkParentFromStudent({ parentId: entityId, studentId });
      await createAuditEntry({
        actorId: sessionState.adminId,
        action: "parent_unlinked",
        entityType: "parent",
        entityId,
        metadata: { studentId }
      });
    }
  }
}

function wireDrawerContent() {
  const bodyNode = document.querySelector<HTMLElement>("[data-admin-drawer-body='member-detail']");
  if (!bodyNode) return;

  bodyNode.querySelectorAll<HTMLFormElement>("[data-admin-note-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const values = readFormValues(form);
      const status = form.querySelector<HTMLElement>("[data-form-status]");
      try {
        await saveAdminNote({
          id: form.dataset.noteId || undefined,
          entityType: form.dataset.entityType as EntityType,
          entityId: form.dataset.entityId ?? "",
          note: values.note,
          actorId: sessionState.adminId
        });
        setStatusMessage(status, "success", "Admin note saved.");
        await refresh();
        buildEntityDrawer(form.dataset.entityType as EntityType, form.dataset.entityId ?? "", drawerState.restoreFocusTo);
      } catch (error) {
        setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save admin note."));
      }
    });
  });

  bodyNode.querySelectorAll<HTMLFormElement>("[data-student-edit-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const studentId = form.dataset.studentId ?? "";
      const values = readFormValues(form);
      const status = form.querySelector<HTMLElement>("[data-form-status]");
      try {
        await updateStudentRecord({
          studentId,
          fullName: values["full-name"],
          yearGroup: values["year-group"],
          school: values.school,
          notes: values.notes,
          status: values.status,
          targetGrade: values["target-grade"]
        });
        setStatusMessage(status, "success", "Student updated.");
        await refresh();
        buildEntityDrawer("student", studentId, drawerState.restoreFocusTo);
      } catch (error) {
        setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to update student."));
      }
    });
  });

  bodyNode.querySelectorAll<HTMLFormElement>("[data-portal-user-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const entityType = form.dataset.entityType as "tutor" | "parent";
      const entityId = form.dataset.entityId ?? "";
      const values = readFormValues(form);
      const status = form.querySelector<HTMLElement>("[data-form-status]");
      try {
        await updatePortalUser({
          userId: entityId,
          fullName: values["full-name"],
          email: values.email,
          phone: values.phone,
          status: values.status,
          subjects: entityType === "tutor" ? parseCsvList(values.subjects ?? "") : undefined,
          keyStages: entityType === "tutor" ? parseCsvList(values["key-stages"] ?? "") : undefined
        });
        setStatusMessage(status, "success", "Portal account updated.");
        await refresh();
        buildEntityDrawer(entityType, entityId, drawerState.restoreFocusTo);
      } catch (error) {
        setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to update portal account."));
      }
    });
  });

  bodyNode.querySelectorAll<HTMLFormElement>("[data-link-manager]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const entityType = form.dataset.entityType as "tutor" | "parent";
      const entityId = form.dataset.entityId ?? "";
      const status = form.querySelector<HTMLElement>("[data-form-status]");
      const desiredIds = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="student-link"]:checked')).map((input) => input.value);
      try {
        await syncLinkedStudents(entityType, entityId, desiredIds);
        setStatusMessage(status, "success", entityType === "tutor" ? "Tutor assignments updated." : "Parent links updated.");
        await refresh();
        buildEntityDrawer(entityType, entityId, drawerState.restoreFocusTo);
      } catch (error) {
        setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to update student links."));
      }
    });
  });

  bodyNode.querySelectorAll<HTMLElement>("[data-drawer-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.drawerAction ?? "";
      const entityType = button.dataset.entityType as "tutor" | "parent";
      const entityId = button.dataset.entityId ?? "";
      const profile = profileById(entityType, entityId);
      if (!profile) return;

      if (action === "delete") {
        if (entityType === "parent") {
          openArchivePortalConfirmation(entityType, entityId, profile, async () => {
            selected.parents.delete(entityId);
            closeDrawer();
            await refresh();
          });
          return;
        }
        openConfirmation({
          title: "Delete permanently",
          body: "This removes the portal account and linked login access while preserving student lesson history where possible.",
          buttonLabel: "Delete permanently",
          entitySummary: `${getProfileName(profile)} • ${profile.email ?? "No email recorded"}`,
          confirmLabel: `Type ${profile.email ?? ""} to confirm`,
          confirmValue: String(profile.email ?? ""),
          helperText: "The Delete button will enable only when the email matches exactly.",
          run: async () => {
            await deletePortalUser({
              userId: entityId,
              email: String(profile.email ?? ""),
              entityType,
              confirmationEmail: String(profile.email ?? "")
            });
            selected[entityType === "tutor" ? "tutors" : "parents"].delete(entityId);
            closeDrawer();
            await refresh();
          }
        });
        return;
      }

      await runPortalUserAction(entityType, entityId, action);
      await refresh();
      buildEntityDrawer(entityType, entityId, drawerState.restoreFocusTo);
    });
  });
}

function wireMenus() {
  document.querySelectorAll<HTMLDetailsElement>("[data-row-menu]").forEach((menu) => {
    const summary = menu.querySelector("summary");
    if (summary instanceof HTMLElement) {
      summary.setAttribute("aria-expanded", String(menu.open));
    }
    menu.addEventListener("toggle", () => {
      if (menu.open) {
        document.querySelectorAll<HTMLDetailsElement>("[data-row-menu]").forEach((candidate) => {
          if (candidate !== menu) candidate.removeAttribute("open");
        });
      }
      if (summary instanceof HTMLElement) {
        summary.setAttribute("aria-expanded", String(menu.open));
      }
    });
    menu.querySelectorAll<HTMLElement>("[data-row-action]").forEach((button, index, actions) => {
      button.addEventListener("keydown", (event) => {
        if (event.key === "ArrowDown") {
          event.preventDefault();
          actions[(index + 1) % actions.length]?.focus();
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          actions[(index - 1 + actions.length) % actions.length]?.focus();
        }
        if (event.key === "Escape") {
          menu.removeAttribute("open");
          summary instanceof HTMLElement && summary.focus();
        }
      });
    });
    menu.querySelectorAll<HTMLElement>("[data-row-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const entityType = menu.dataset.entityType as EntityType;
        const entityId = menu.dataset.entityId ?? "";
        const action = button.dataset.rowAction ?? "";
        menu.removeAttribute("open");
        await handleRowAction(entityType, entityId, action, button);
      });
    });
  });
}

async function runPortalUserAction(entityType: "tutor" | "parent", entityId: string, action: string) {
  const profile = profileById(entityType, entityId);
  if (!profile) return;

  if (action === "reset-password") {
    await resetPortalPassword({ userId: entityId });
    return;
  }
  if (action === "resend-welcome") {
    await resendPortalWelcome({ userId: entityId, resetPassword: true });
    return;
  }
  if (action === "send-reminder") {
    await resendPortalWelcome({ userId: entityId, resetPassword: false });
    return;
  }
  if (action === "suspend") {
    await setPortalUserStatus({ userId: entityId, status: "suspended" });
    return;
  }
  if (action === "reactivate") {
    await setPortalUserStatus({ userId: entityId, status: "active" });
    return;
  }
  if (action === "archive") {
    await archivePortalUser({ userId: entityId });
    return;
  }
  if (action === "copy-login-email" && profile.email) {
    await navigator.clipboard.writeText(profile.email);
  }
}

function goToTab(tab: AdminTab) {
  sessionState.activeTab = tab;
  document.querySelector<HTMLElement>(`[data-admin-tab][data-tab='${tab}']`)?.click();
  document.querySelectorAll<HTMLElement>("[data-admin-drawer-tab]").forEach((node) => {
    const active = node.dataset.adminDrawerTab === tab;
    node.setAttribute("aria-selected", String(active));
    node.classList.toggle("bg-fb-bg", active);
    node.classList.toggle("text-white", active);
    node.classList.toggle("shadow-sm", active);
  });
}

function setNamedFieldValue(form: HTMLFormElement | null, fieldName: string, value: string) {
  const field = form?.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(`[name="${fieldName}"]`);
  if (field) {
    field.value = value;
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

async function handleRowAction(entityType: EntityType, entityId: string, action: string, trigger?: HTMLElement | null) {
  if (action === "view" || action === "edit") {
    drawerState.entityType = entityType;
    drawerState.entityId = entityId;
    buildEntityDrawer(entityType, entityId, trigger);
    return;
  }

  if (entityType === "student") {
    const student = studentById(entityId);
    if (!student) return;

    if (action === "assign-tutor" || action === "link-parent") {
      goToTab("settings");
      const form = document.querySelector<HTMLFormElement>(action === "assign-tutor" ? "[data-tutor-link-form]" : "[data-parent-link-form]");
      setNamedFieldValue(form, "student-id", entityId);
      form?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "add-lesson") {
      goToTab("lessons");
      document.querySelector<HTMLElement>("[data-lesson-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "add-report") {
      goToTab("lessons");
      document.querySelector<HTMLElement>("[data-lesson-report-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "add-assessment" || action === "add-target") {
      goToTab("assessments");
      document.querySelector<HTMLElement>(action === "add-assessment" ? "[data-assessment-form]" : "[data-target-form]")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "mark-inactive" || action === "archive") {
      await updateStudentRecord({
        studentId: entityId,
        fullName: getStudentName(student),
        yearGroup: student.year_group ?? "",
        school: student.school ?? "",
        notes: student.notes ?? "",
        status: action === "archive" ? "archived" : "inactive",
        targetGrade: student.target_grade ?? ""
      });
      await refresh();
      return;
    }
    return;
  }

  if (action === "assign-students" || action === "unlink-students") {
    drawerState.entityType = entityType;
    drawerState.entityId = entityId;
    buildEntityDrawer(entityType, entityId, trigger);
    return;
  }
  if (action === "manage-subjects") {
    drawerState.entityType = entityType;
    drawerState.entityId = entityId;
    buildEntityDrawer(entityType, entityId, trigger);
    scrollDrawerBlock("subjects");
    return;
  }
  if (action === "manage-key-stages") {
    drawerState.entityType = entityType;
    drawerState.entityId = entityId;
    buildEntityDrawer(entityType, entityId, trigger);
    scrollDrawerBlock("key-stages");
    return;
  }
  if (action === "delete") {
    const profile = profileById(entityType, entityId);
    if (!profile) return;
    if (entityType === "parent") {
      openArchivePortalConfirmation(entityType, entityId, profile, async () => {
        selected.parents.delete(entityId);
        await refresh();
      });
      return;
    }
    openConfirmation({
      title: "Delete permanently",
      body: "This removes the portal account and linked login access while preserving student lesson history where possible.",
      buttonLabel: "Delete permanently",
      entitySummary: `${getProfileName(profile)} • ${profile.email ?? "No email recorded"}`,
      confirmLabel: `Type ${profile.email ?? ""} to confirm`,
      confirmValue: String(profile.email ?? ""),
      helperText: "The Delete button will enable only when the email matches exactly.",
      run: async () => {
        await deletePortalUser({
          userId: entityId,
          email: String(profile.email ?? ""),
          entityType,
          confirmationEmail: String(profile.email ?? "")
        });
        selected[entityType === "tutor" ? "tutors" : "parents"].delete(entityId);
        await refresh();
      }
    });
    return;
  }

  await runPortalUserAction(entityType, entityId, action);
  await refresh();
}

function updateBulkBar(group: SelectGroup) {
  const bar = document.querySelector<HTMLElement>(`[data-bulk-bar='${group}']`);
  const count = document.querySelector<HTMLElement>(`[data-bulk-count='${group}']`);
  const actions = document.querySelector<HTMLElement>(`[data-bulk-actions='${group}']`);
  if (!bar || !count || !actions) return;

  count.textContent = String(selected[group].size);
  bar.classList.toggle("hidden", selected[group].size === 0);
  if (!selected[group].size) return;

  const buttons =
    group === "students"
      ? [
          `<button class="quick-add-chip" data-bulk-action="students:activate" type="button">Mark active</button>`,
          `<button class="quick-add-chip" data-bulk-action="students:inactive" type="button">Mark inactive</button>`,
          `<button class="quick-add-chip" data-bulk-action="students:archive" type="button">Archive</button>`
        ]
      : [
          `<button class="quick-add-chip" data-bulk-action="${group}:activate" type="button">Activate</button>`,
          `<button class="quick-add-chip" data-bulk-action="${group}:suspend" type="button">Suspend</button>`,
          `<button class="quick-add-chip" data-bulk-action="${group}:archive" type="button">Archive</button>`,
          group === "parents" ? `<button class="quick-add-chip" data-bulk-action="${group}:remind" type="button">Send reminder</button>` : ``
        ];

  actions.innerHTML = buttons.join("");
  actions.querySelectorAll<HTMLElement>("[data-bulk-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      const action = button.dataset.bulkAction ?? "";
      openConfirmation({
        title: "Apply bulk action",
        body: `This will update ${selected[group].size} record${selected[group].size === 1 ? "" : "s"}.`,
        buttonLabel: "Apply changes",
        run: async () => {
          await runBulkAction(action);
        }
      });
    });
  });
}

function wireSelection() {
  document.querySelectorAll<HTMLInputElement>("[data-select-row]").forEach((input) => {
    input.addEventListener("change", () => {
      const group = input.dataset.selectRow as SelectGroup;
      const rowId = input.dataset.rowId ?? "";
      if (!group || !rowId) return;
      if (input.checked) selected[group].add(rowId);
      else selected[group].delete(rowId);
      updateBulkBar(group);
    });
  });
}

async function runBulkAction(action: string) {
  const [group, command] = action.split(":") as [SelectGroup, string];
  const ids = [...selected[group]];
  if (!ids.length) return;

  if (group === "students") {
    for (const id of ids) {
      const student = studentById(id);
      if (!student) continue;
      await updateStudentRecord({
        studentId: id,
        fullName: getStudentName(student),
        yearGroup: student.year_group ?? "",
        school: student.school ?? "",
        notes: student.notes ?? "",
        status: command === "activate" ? "active" : command === "inactive" ? "inactive" : "archived",
        targetGrade: student.target_grade ?? ""
      });
    }
  } else {
    for (const id of ids) {
      if (command === "activate") await setPortalUserStatus({ userId: id, status: "active" });
      if (command === "suspend") await setPortalUserStatus({ userId: id, status: "suspended" });
      if (command === "archive") await archivePortalUser({ userId: id });
      if (command === "remind") await resendPortalWelcome({ userId: id, resetPassword: false });
    }
  }

  selected[group].clear();
  await refresh();
}

function wireOverviewLinks() {
  document.querySelectorAll<HTMLElement>("[data-overview-view]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.overviewView as AdminTab | undefined;
      if (target) goToTab(target);
    });
  });
}

async function refresh() {
  const [students, tutors, parents, tutorLinks, parentLinks, invites, notes, auditLogs, articles] = await Promise.all([
    fetchAllStudents(),
    fetchProfilesByRole("tutor"),
    fetchProfilesByRole("parent"),
    fetchTableRows("tutor_student_links").catch(() => []),
    fetchTableRows("parent_student_links").catch(() => []),
    fetchTableRows("parent_invites").catch(() => []),
    fetchAdminNotes().catch(() => []),
    fetchAuditLogs(60).catch(() => []),
    fetchArticles().catch(() => [])
  ]);

  state.students = students;
  state.tutors = tutors;
  state.parents = parents;
  state.tutorLinks = tutorLinks as LinkRow[];
  state.parentLinks = parentLinks as LinkRow[];
  state.invites = invites as ParentInviteRow[];
  state.notes = notes as AdminNoteRow[];
  state.auditLogs = auditLogs as AuditLogRow[];
  state.articles = articles as ArticleRow[];

  const studentIds = students.map((student) => student.id);
  const [{ assessments, targets, lessons, reports }, lessonRows] = await Promise.all([
    fetchStudentContent(studentIds),
    fetchStudentLessons(studentIds, { limit: 60 })
  ]);

  state.assessments = assessments;
  state.targets = targets;
  state.lessons = lessonRows.length ? lessonRows : lessons;
  state.reports = reports;

  fillStudentSelects(state.students);
  fillTutorSelects(state.tutors);
  fillParentSelects(state.parents);

  refreshViews();
  wireOverviewLinks();
}

function wireQuickAdd() {
  const dialog = document.querySelector<HTMLElement>("[data-quick-add-dialog]");
  const openButton = document.querySelector<HTMLElement>("[data-quick-add-open]");
  const closeButton = document.querySelector<HTMLElement>("[data-quick-add-close]");
  if (!dialog || !openButton || !closeButton) return;

  const show = () => {
    dialog.dataset.open = "true";
    dialog.setAttribute("aria-hidden", "false");
    syncBodyLock();
    trapFocus(dialog);
    window.requestAnimationFrame(() => focusFirstElement(dialog, "[data-quick-add-target]"));
  };
  const hide = () => {
    dialog.dataset.open = "false";
    dialog.setAttribute("aria-hidden", "true");
    syncBodyLock();
    releaseFocusTrap(dialog);
    openButton.focus();
  };

  openButton.addEventListener("click", show);
  closeButton.addEventListener("click", hide);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) hide();
  });

  dialog.querySelectorAll<HTMLElement>("[data-quick-add-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.quickAddTarget ?? "";
      hide();
      if (target === "student" || target === "tutor" || target === "parent") goToTab("settings");
      else if (target === "lesson" || target === "report") goToTab("lessons");
      else if (target === "assessment" || target === "target") goToTab("assessments");
      else if (target === "article") goToTab("articles");
    });
  });
}

function setSidebarCollapsed(collapsed: boolean) {
  sidebarState.collapsed = collapsed;
  const shell = document.querySelector<HTMLElement>("[data-admin-shell]");
  const toggle = document.querySelector<HTMLElement>("[data-sidebar-toggle]");
  if (!shell) return;
  shell.dataset.sidebarCollapsed = collapsed ? "true" : "false";
  window.localStorage.setItem("flybridge-admin-sidebar", collapsed ? "collapsed" : "expanded");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(collapsed));
    toggle.setAttribute("aria-label", collapsed ? "Expand admin sidebar" : "Collapse admin sidebar");
  }
}

function wireSidebar() {
  const stored = window.localStorage.getItem("flybridge-admin-sidebar");
  setSidebarCollapsed(stored === "collapsed");

  document.querySelector<HTMLElement>("[data-sidebar-toggle]")?.addEventListener("click", (event) => {
    sidebarState.lastToggle = event.currentTarget as HTMLElement;
    setSidebarCollapsed(!sidebarState.collapsed);
  });

  const drawer = document.querySelector<HTMLElement>("[data-admin-sidebar='drawer']");
  const backdrop = document.querySelector<HTMLElement>("[data-admin-drawer-backdrop='mobile-nav']");
  const openButton = document.querySelector<HTMLElement>("[data-admin-drawer-open]");
  if (!drawer || !backdrop || !openButton) return;

  const closeDrawer = () => {
    drawer.dataset.open = "false";
    backdrop.classList.add("hidden");
    backdrop.setAttribute("aria-hidden", "true");
    syncBodyLock();
    releaseFocusTrap(drawer);
    openButton.focus();
  };

  const openDrawer = () => {
    drawer.dataset.open = "true";
    backdrop.classList.remove("hidden");
    backdrop.setAttribute("aria-hidden", "false");
    syncBodyLock();
    trapFocus(drawer);
    window.requestAnimationFrame(() => focusFirstElement(drawer, "[data-admin-tab]"));
  };

  openButton.addEventListener("click", openDrawer);
  backdrop.addEventListener("click", closeDrawer);
  drawer.querySelectorAll<HTMLElement>("[data-admin-drawer-tab]").forEach((node) => {
    node.addEventListener("click", () => {
      const target = node.dataset.adminDrawerTab as AdminTab | undefined;
      if (target) goToTab(target);
      closeDrawer();
    });
  });
  drawer.querySelectorAll<HTMLElement>("[data-logout], a").forEach((node) => {
    node.addEventListener("click", closeDrawer);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drawer.dataset.open === "true") {
      closeDrawer();
    }
  });
}

function wireDirectoryExpansion() {
  const backdrop = document.querySelector<HTMLElement>("[data-directory-backdrop]");
  if (!backdrop) return;

  const closeExpanded = () => {
    if (!directoryState.panel) return;
    const panel = document.querySelector<HTMLElement>(`[data-directory-panel='${directoryState.panel}']`);
    if (panel) {
      panel.dataset.expanded = "false";
      releaseFocusTrap(panel);
    }
    backdrop.dataset.open = "false";
    syncBodyLock();
    directoryState.panel = null;
    directoryState.trigger?.focus();
    directoryState.trigger = null;
  };

  document.querySelectorAll<HTMLElement>("[data-directory-expand]").forEach((button) => {
    button.addEventListener("click", () => {
      const panelKey = button.dataset.directoryExpand as "students" | "tutors" | "parents" | undefined;
      if (!panelKey) return;
      const panel = document.querySelector<HTMLElement>(`[data-directory-panel='${panelKey}']`);
      if (!panel) return;
      directoryState.panel = panelKey;
      directoryState.trigger = button;
      panel.dataset.expanded = "true";
      backdrop.dataset.open = "true";
      syncBodyLock();
      trapFocus(panel);
      window.requestAnimationFrame(() => focusFirstElement(panel, "[data-directory-close]"));
    });
  });

  document.querySelectorAll<HTMLElement>("[data-directory-close]").forEach((button) => {
    button.addEventListener("click", closeExpanded);
  });

  backdrop.addEventListener("click", closeExpanded);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && directoryState.panel) {
      closeExpanded();
    }
  });
}

function wireDialogs() {
  document.querySelector<HTMLElement>("[data-confirm-close='member-action']")?.addEventListener("click", closeConfirmation);
  document.querySelector<HTMLElement>("[data-confirm-cancel='member-action']")?.addEventListener("click", closeConfirmation);
  document.querySelector<HTMLFormElement>("[data-confirm-form='member-action']")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    await confirmationState.run?.();
  });
  document.querySelector<HTMLElement>("[data-confirm-retry='member-action']")?.addEventListener("click", async () => {
    await confirmationState.run?.();
  });
  document.querySelector<HTMLElement>("[data-admin-drawer-close='member-detail']")?.addEventListener("click", closeDrawer);
  document.querySelector<HTMLElement>("[data-admin-drawer-backdrop='member-detail']")?.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeConfirmation();
      closeDrawer();
      document.querySelectorAll<HTMLDetailsElement>("[data-row-menu]").forEach((menu) => menu.removeAttribute("open"));
    }
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    document.querySelectorAll<HTMLDetailsElement>("[data-row-menu]").forEach((menu) => {
      if (!menu.contains(target)) menu.removeAttribute("open");
    });
  });
}

function wireTabRouting() {
  const selectFromHash = () => {
    const requested = window.location.hash.replace("#", "") as AdminTab;
    if (!requested) return;
    goToTab(requested);
  };

  window.addEventListener("hashchange", selectFromHash);
  selectFromHash();
}

function wireFilters() {
  [
    "[data-admin-global-search]",
    "[data-student-search]",
    "[data-student-status-filter]",
    "[data-student-tutor-filter]",
    "[data-student-sort]",
    "[data-tutor-search]",
    "[data-tutor-status-filter]",
    "[data-tutor-subject-filter]",
    "[data-tutor-keystage-filter]",
    "[data-tutor-sort]",
    "[data-parent-search]",
    "[data-parent-status-filter]",
    "[data-parent-link-filter]",
    "[data-parent-sort]"
  ].forEach((selector) => {
    document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
      node.addEventListener("input", refreshViews);
      node.addEventListener("change", refreshViews);
    });
  });
}

export async function bootstrapAdminDashboard() {
  const { profile } = await guardPage(["admin"]);
  sessionState.adminId = profile.id;

  activateTabs("[data-admin-tab]", "[data-admin-panel]", "overview");
  document.querySelectorAll<HTMLElement>("[data-admin-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextTab = button.dataset.tab as AdminTab | undefined;
      if (nextTab) sessionState.activeTab = nextTab;
    });
  });

  wireDialogs();
  wireSidebar();
  wireDirectoryExpansion();
  wireTabRouting();
  wireQuickAdd();
  wireFilters();
  document.querySelectorAll<HTMLElement>("[data-archived-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = button.dataset.archivedTab as "parents" | "tutors" | "students" | undefined;
      if (!next) return;
      archivedState.activeTab = next;
      renderArchivedSection();
    });
  });

  const lessonForm = document.querySelector<HTMLFormElement>("[data-lesson-form]");
  const lessonReportForm = document.querySelector<HTMLFormElement>("[data-lesson-report-form]");
  const assessmentForm = document.querySelector<HTMLFormElement>("[data-assessment-form]");
  const targetForm = document.querySelector<HTMLFormElement>("[data-target-form]");
  const studentForm = document.querySelector<HTMLFormElement>("[data-student-form]");
  const tutorAccountForm = document.querySelector<HTMLFormElement>("[data-tutor-account-form]");
  const parentAccountForm = document.querySelector<HTMLFormElement>("[data-parent-account-form]");
  const parentLinkForm = document.querySelector<HTMLFormElement>("[data-parent-link-form]");
  const tutorLinkForm = document.querySelector<HTMLFormElement>("[data-tutor-link-form]");
  const parentInviteForm = document.querySelector<HTMLFormElement>("[data-parent-invite-form]");
  const parentResetForm = document.querySelector<HTMLFormElement>("[data-parent-reset-form]");
  const tutorResetForm = document.querySelector<HTMLFormElement>("[data-tutor-reset-form]");
  const articleForm = document.querySelector<HTMLFormElement>("[data-article-form]");
  const resetStudentButton = document.querySelector<HTMLElement>("[data-student-reset]");
  const tutorAccountResendButton = tutorAccountForm?.querySelector<HTMLButtonElement>("[data-form-resend-welcome]");
  const parentAccountResendButton = parentAccountForm?.querySelector<HTMLButtonElement>("[data-form-resend-welcome]");

  const configureWelcomeResendButton = (
    button: HTMLButtonElement | null | undefined,
    values: { userId?: string; visible: boolean }
  ) => {
    if (!button) return;
    button.classList.toggle("hidden", !values.visible);
    if (values.visible && values.userId) {
      button.dataset.userId = values.userId;
    } else {
      delete button.dataset.userId;
    }
  };

  [tutorAccountResendButton, parentAccountResendButton].forEach((button) => {
    button?.addEventListener("click", async () => {
      const userId = button.dataset.userId ?? "";
      const status = button.closest("form")?.querySelector<HTMLElement>("[data-form-status]") ?? null;
      if (!userId) {
        setStatusMessage(status, "error", "The created account is missing its user ID, so the welcome email cannot be resent yet.");
        return;
      }
      try {
        const result = await resendPortalWelcome({ userId, resetPassword: true });
        setStatusMessage(status, "success", typeof result.message === "string" ? result.message : "Welcome email resent successfully.");
        configureWelcomeResendButton(button, { visible: false });
        await refresh();
      } catch (error) {
        setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to resend the welcome email."));
      }
    });
  });

  const resetStudentForm = () => {
    if (!studentForm) return;
    studentForm.reset();
    const hiddenId = studentForm.querySelector<HTMLInputElement>('input[name="student-id"]');
    if (hiddenId) hiddenId.value = "";
  };

  resetStudentButton?.addEventListener("click", resetStudentForm);

  await refresh();
  const hashTab = window.location.hash.replace("#", "") as AdminTab;
  if (hashTab) {
    goToTab(hashTab);
  }
  syncUrlIntoViewState();
  window.addEventListener("popstate", () => {
    syncUrlIntoViewState();
  });

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
          notes: values.notes,
          status: values.status,
          targetGrade: values["target-grade"]
        });
      } else {
        await createStudentRecord({
          fullName: values["full-name"],
          yearGroup: values["year-group"],
          school: values.school,
          notes: values.notes,
          status: values.status,
          targetGrade: values["target-grade"]
        });
      }
      setStatusMessage(status, "success", "Student saved successfully.");
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
    configureWelcomeResendButton(tutorAccountResendButton, { visible: false });
    try {
      const result = await createTutorAccount({
        fullName: values["full-name"],
        email: values.email,
        phone: values.phone,
        subjects: parseCsvList(values.subjects ?? ""),
        keyStages: parseCsvList(values["key-stages"] ?? ""),
        studentId: values["student-id"] || undefined
      });
      tutorAccountForm.reset();
      configureWelcomeResendButton(tutorAccountResendButton, {
        visible: result.emailSent === false,
        userId: result.userId
      });
      setStatusMessage(
        status,
        result.emailSent === false ? "info" : "success",
        result.emailSent === false ? "Account created, but the welcome email was not sent." : result.message
      );
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to create tutor account."));
    }
  });

  parentAccountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(parentAccountForm);
    const status = parentAccountForm.querySelector<HTMLElement>("[data-form-status]");
    configureWelcomeResendButton(parentAccountResendButton, { visible: false });
    try {
      const result = await createParentAccount({
        fullName: values["full-name"],
        email: values.email,
        phone: values.phone,
        studentId: values["student-id"] || undefined
      });
      parentAccountForm.reset();
      configureWelcomeResendButton(parentAccountResendButton, {
        visible: result.emailSent === false,
        userId: result.userId
      });
      setStatusMessage(
        status,
        result.emailSent === false ? "info" : "success",
        result.emailSent === false ? "Account created, but the welcome email was not sent." : result.message
      );
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
    const preview = document.querySelector<HTMLElement>("[data-parent-invite-preview]");
    try {
      const result = await generateParentInvite({
        parentId: values["parent-id"],
        studentId: values["student-id"]
      });
      if (preview) {
        preview.textContent = result.inviteCode ?? result.code ?? result.message;
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
      const result = await resetPortalPassword({ userId: values["user-id"] });
      parentResetForm.reset();
      setStatusMessage(status, "success", result.message);
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to reset parent password."));
    }
  });

  tutorResetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(tutorResetForm);
    const status = tutorResetForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      const result = await resetPortalPassword({ userId: values["user-id"] });
      tutorResetForm.reset();
      setStatusMessage(status, "success", result.message);
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to reset tutor password."));
    }
  });

  lessonForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(lessonForm);
    const status = lessonForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      await createLessonRecord({
        studentId: values["student-id"],
        tutorId: values["tutor-id"],
        lessonTitle: values["lesson-title"],
        subject: values.subject,
        lessonDate: values["lesson-date"],
        startTime: values["start-time"],
        durationMinutes: values["duration-minutes"],
        status: values.status
      });
      lessonForm.reset();
      setStatusMessage(status, "success", "Lesson saved.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save lesson."));
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
      setStatusMessage(status, "success", "Target saved.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save target."));
    }
  });

  articleForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(articleForm);
    const status = articleForm.querySelector<HTMLElement>("[data-form-status]");
    try {
      await createArticleRecord({
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        authorId: profile.id,
        status: values.status
      });
      articleForm.reset();
      setStatusMessage(status, "success", "Article saved.");
      await refresh();
    } catch (error) {
      setStatusMessage(status, "error", await getFriendlyErrorMessage(error, "Unable to save article."));
    }
  });
}
