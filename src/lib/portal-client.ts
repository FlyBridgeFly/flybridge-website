import type { User } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  type AssessmentRow,
  type LessonReportRow,
  type LinkRow,
  type ProfileRole,
  type ProfileRow,
  type StudentRow,
  type TargetRow
} from "./supabase";

export interface GuardResult {
  client: ReturnType<typeof createBrowserSupabaseClient>;
  user: User;
  profile: ProfileRow;
}

export interface StudentBundle {
  student: StudentRow;
  reports: LessonReportRow[];
  assessments: AssessmentRow[];
  targets: TargetRow[];
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

function stripEmpty<T extends Record<string, unknown>>(payload: T) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
}

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(value?: string | null) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(date);
}

export function getStudentName(student: StudentRow) {
  const fullName = student.full_name?.trim();
  if (fullName) return fullName;
  const first = student.first_name?.trim() ?? "";
  const last = student.last_name?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  return combined || "Unnamed student";
}

export function getProfileName(profile: ProfileRow) {
  return profile.full_name?.trim() || profile.email?.trim() || "FlyBridge user";
}

function setText(selector: string, value: string) {
  document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    node.textContent = value;
  });
}

function showNode(selector: string, visible: boolean) {
  document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    node.classList.toggle("hidden", !visible);
  });
}

function setGuardMessage(message: string) {
  setText("[data-role-error-message]", message);
}

export function redirectToLogin(reason?: string) {
  const url = new URL("/login", window.location.origin);
  if (reason) url.searchParams.set("reason", reason);
  window.location.href = url.toString();
}

export function redirectForRole(role?: ProfileRole | null) {
  if (role === "admin") {
    window.location.href = "/admin";
    return;
  }

  if (role === "tutor") {
    window.location.href = "/tutor";
    return;
  }

  window.location.href = "/parent-portal";
}

export function wireLogout(client: ReturnType<typeof createBrowserSupabaseClient>) {
  document.querySelectorAll<HTMLElement>("[data-logout]").forEach((node) => {
    node.addEventListener("click", async () => {
      await client.auth.signOut();
      redirectToLogin("signed-out");
    });
  });
}

async function insertWithFallbacks(
  table: string,
  payloads: Array<Record<string, unknown>>
) {
  const client = createBrowserSupabaseClient();
  let lastError: Error | null = null;

  for (const payload of payloads) {
    const cleaned = stripEmpty(payload);
    const { error } = await client.from(table).insert(cleaned);
    if (!error) return;
    lastError = error;
  }

  throw lastError ?? new Error(`Unable to create record in ${table}.`);
}

async function updateWithFallbacks(
  table: string,
  id: string,
  payloads: Array<Record<string, unknown>>
) {
  const client = createBrowserSupabaseClient();
  let lastError: Error | null = null;

  for (const payload of payloads) {
    const cleaned = stripEmpty(payload);
    const { error } = await client.from(table).update(cleaned).eq("id", id);
    if (!error) return;
    lastError = error;
  }

  throw lastError ?? new Error(`Unable to update record in ${table}.`);
}

export async function fetchProfile(userId: string) {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function guardPage(requiredRoles: ProfileRole[]) {
  const client = createBrowserSupabaseClient();
  showNode("[data-role-loading]", true);
  showNode("[data-role-error]", false);
  showNode("[data-role-guard]", false);

  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session?.user) {
    redirectToLogin("auth-required");
    throw new Error("Authentication required.");
  }

  const profile = await fetchProfile(session.user.id);
  if (!profile) {
    setGuardMessage("We found your account, but no FlyBridge profile record exists yet.");
    showNode("[data-role-loading]", false);
    showNode("[data-role-error]", true);
    throw new Error("Profile not found.");
  }

  const role = profile.role ?? "parent";
  if (!requiredRoles.includes(role)) {
    setGuardMessage("Your account is signed in, but it does not have permission to view this dashboard.");
    showNode("[data-role-loading]", false);
    showNode("[data-role-error]", true);
    throw new Error("Unauthorized role.");
  }

  setText("[data-session-name]", getProfileName(profile));
  setText("[data-session-role]", String(role).toUpperCase());
  setText("[data-session-email]", profile.email ?? session.user.email ?? "");
  showNode("[data-role-loading]", false);
  showNode("[data-role-guard]", true);
  wireLogout(client);

  client.auth.onAuthStateChange((_event, nextSession) => {
    if (!nextSession?.user) {
      redirectToLogin("session-ended");
    }
  });

  return {
    client,
    user: session.user,
    profile
  } satisfies GuardResult;
}

export async function fetchAllStudents() {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.from("students").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as StudentRow[]) ?? [];
}

export async function fetchProfilesByRole(role: string) {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.from("profiles").select("*").eq("role", role);
  if (error) throw error;
  return ((data as ProfileRow[]) ?? []).sort((a, b) => getProfileName(a).localeCompare(getProfileName(b)));
}

export async function fetchLinks(table: "tutor_student_links" | "parent_student_links", column: string, value: string) {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.from(table).select("*").eq(column, value);
  if (error) throw error;
  return (data as LinkRow[]) ?? [];
}

export async function fetchRecentReports(limit = 8) {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client
    .from("lesson_reports")
    .select("*")
    .order("lesson_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as LessonReportRow[]) ?? [];
}

export async function fetchTableRows(table: "tutor_student_links" | "parent_student_links") {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.from(table).select("*");
  if (error) throw error;
  return (data as LinkRow[]) ?? [];
}

export async function fetchStudentContent(studentIds: string[]) {
  if (studentIds.length === 0) {
    return {
      reports: [] as LessonReportRow[],
      assessments: [] as AssessmentRow[],
      targets: [] as TargetRow[]
    };
  }

  const client = createBrowserSupabaseClient();
  const [reportsRes, assessmentsRes, targetsRes] = await Promise.all([
    client.from("lesson_reports").select("*").in("student_id", studentIds),
    client.from("assessments").select("*").in("student_id", studentIds),
    client.from("student_targets").select("*").in("student_id", studentIds)
  ]);

  if (reportsRes.error) throw reportsRes.error;
  if (assessmentsRes.error) throw assessmentsRes.error;
  if (targetsRes.error) throw targetsRes.error;

  return {
    reports: (reportsRes.data as LessonReportRow[]) ?? [],
    assessments: (assessmentsRes.data as AssessmentRow[]) ?? [],
    targets: (targetsRes.data as TargetRow[]) ?? []
  };
}

export async function fetchAssignedStudentsForTutor(tutorId: string) {
  const links = await fetchLinks("tutor_student_links", "tutor_id", tutorId);
  const studentIds = links.map((link) => String(link.student_id)).filter(Boolean);
  const students = await fetchAllStudents();
  return students.filter((student) => studentIds.includes(student.id));
}

export async function fetchLinkedStudentsForParent(parentId: string) {
  const links = await fetchLinks("parent_student_links", "parent_id", parentId);
  const studentIds = links.map((link) => String(link.student_id)).filter(Boolean);
  const students = await fetchAllStudents();
  return students.filter((student) => studentIds.includes(student.id));
}

export async function createStudentRecord(values: {
  fullName: string;
  yearGroup?: string;
  school?: string;
  notes?: string;
}) {
  const [firstName = "", ...rest] = values.fullName.trim().split(" ");
  const lastName = rest.join(" ").trim();

  await insertWithFallbacks("students", [
    {
      full_name: values.fullName,
      year_group: values.yearGroup,
      school: values.school,
      notes: values.notes
    },
    {
      first_name: firstName || values.fullName,
      last_name: lastName,
      year_group: values.yearGroup,
      school: values.school,
      notes: values.notes
    },
    {
      name: values.fullName,
      year_group: values.yearGroup,
      school: values.school,
      notes: values.notes
    }
  ]);
}

export async function assignTutorToStudent(tutorId: string, studentId: string) {
  await insertWithFallbacks("tutor_student_links", [
    { tutor_id: tutorId, student_id: studentId }
  ]);
}

export async function createLessonReport(values: {
  studentId: string;
  tutorId: string;
  lessonDate?: string;
  topic?: string;
  summary?: string;
  strengths?: string;
  homework?: string;
  nextSteps?: string;
}) {
  await insertWithFallbacks("lesson_reports", [
    {
      student_id: values.studentId,
      tutor_id: values.tutorId,
      lesson_date: values.lessonDate,
      topic: values.topic,
      summary: values.summary,
      strengths: values.strengths,
      homework: values.homework,
      next_steps: values.nextSteps
    },
    {
      student_id: values.studentId,
      created_by: values.tutorId,
      lesson_date: values.lessonDate,
      title: values.topic,
      summary: values.summary,
      strengths: values.strengths,
      homework: values.homework,
      next_steps: values.nextSteps
    },
    {
      student_id: values.studentId,
      lesson_date: values.lessonDate,
      summary: values.summary,
      homework: values.homework,
      next_steps: values.nextSteps
    }
  ]);
}

export async function createAssessmentRecord(values: {
  studentId: string;
  actorId: string;
  title?: string;
  assessmentDate?: string;
  score?: string;
  maxScore?: string;
  notes?: string;
}) {
  await insertWithFallbacks("assessments", [
    {
      student_id: values.studentId,
      created_by: values.actorId,
      title: values.title,
      assessment_date: values.assessmentDate,
      score: values.score ? Number(values.score) : undefined,
      max_score: values.maxScore ? Number(values.maxScore) : undefined,
      notes: values.notes
    },
    {
      student_id: values.studentId,
      tutor_id: values.actorId,
      name: values.title,
      assessment_date: values.assessmentDate,
      score: values.score ? Number(values.score) : undefined,
      max_score: values.maxScore ? Number(values.maxScore) : undefined,
      notes: values.notes
    }
  ]);
}

export async function saveTargetRecord(values: {
  id?: string;
  studentId: string;
  actorId: string;
  title?: string;
  status?: string;
  dueDate?: string;
  notes?: string;
}) {
  const payloads = [
    {
      student_id: values.studentId,
      created_by: values.actorId,
      title: values.title,
      status: values.status,
      due_date: values.dueDate,
      notes: values.notes
    },
    {
      student_id: values.studentId,
      updated_by: values.actorId,
      target: values.title,
      status: values.status,
      due_date: values.dueDate,
      notes: values.notes
    }
  ];

  if (values.id) {
    await updateWithFallbacks("student_targets", values.id, payloads);
    return;
  }

  await insertWithFallbacks("student_targets", payloads);
}

export function renderEmptyState(container: HTMLElement, title: string, body: string) {
  container.innerHTML = `
    <article class="card-panel p-8 text-center">
      <h3 class="text-xl font-semibold text-fb-ink">${escapeHtml(title)}</h3>
      <p class="mt-3 text-base leading-7 text-fb-ink-soft">${escapeHtml(body)}</p>
    </article>
  `;
}

export function renderStudentCards(
  container: HTMLElement,
  students: StudentRow[],
  options: { compact?: boolean; showAssignments?: boolean; tutorLinks?: LinkRow[] } = {}
) {
  if (students.length === 0) {
    renderEmptyState(container, "No students yet", "Once students are added in Supabase, they will appear here.");
    return;
  }

  container.innerHTML = students
    .map((student) => {
      const assignments = options.showAssignments
        ? options.tutorLinks?.filter((link) => link.student_id === student.id).length ?? 0
        : null;
      return `
        <article class="card-panel p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">${escapeHtml(
                student.year_group ?? "Student"
              )}</p>
              <h3 class="mt-2 text-2xl font-semibold text-fb-ink">${escapeHtml(getStudentName(student))}</h3>
              <p class="mt-2 text-sm leading-6 text-fb-ink-soft">${escapeHtml(student.school ?? "School not recorded")}</p>
            </div>
            ${
              assignments !== null
                ? `<span class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">${assignments} tutor link${assignments === 1 ? "" : "s"}</span>`
                : ""
            }
          </div>
          ${
            student.notes
              ? `<p class="mt-4 text-sm leading-7 text-fb-ink-soft">${escapeHtml(String(student.notes))}</p>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

export function renderReportTimeline(
  container: HTMLElement,
  reports: LessonReportRow[],
  studentsById: Map<string, StudentRow>
) {
  if (reports.length === 0) {
    renderEmptyState(container, "No lesson reports yet", "Lesson reports will appear here once tutors begin logging sessions.");
    return;
  }

  container.innerHTML = byRecentDate(reports, "lesson_date", "created_at")
    .map((report) => {
      const student = report.student_id ? studentsById.get(String(report.student_id)) : undefined;
      return `
        <article class="card-panel p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">${escapeHtml(
                student ? getStudentName(student) : "Lesson report"
              )}</p>
              <h3 class="mt-2 text-xl font-semibold text-fb-ink">${escapeHtml(
                report.topic ?? report.title ?? "Lesson summary"
              )}</h3>
            </div>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">
              ${escapeHtml(formatDate(report.lesson_date ?? report.created_at))}
            </span>
          </div>
          <div class="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Summary</p>
              <p class="mt-2 text-sm leading-7 text-fb-ink-soft">${escapeHtml(report.summary ?? "No summary recorded.")}</p>
            </div>
            <div>
              <p class="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Homework / Next steps</p>
              <p class="mt-2 text-sm leading-7 text-fb-ink-soft">${escapeHtml(
                report.homework ?? report.next_steps ?? "No follow-up recorded."
              )}</p>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

export function renderParentStudentBundles(container: HTMLElement, bundles: StudentBundle[]) {
  if (bundles.length === 0) {
    renderEmptyState(
      container,
      "No linked students yet",
      "Once a parent account is linked to a student in Supabase, the reporting portal will populate automatically."
    );
    return;
  }

  container.innerHTML = bundles
    .map((bundle) => {
      const reportsMarkup = bundle.reports.length
        ? byRecentDate(bundle.reports, "lesson_date", "created_at")
            .slice(0, 4)
            .map(
              (report) => `
                <div class="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                  <div class="flex items-center justify-between gap-4">
                    <p class="text-sm font-semibold text-fb-ink">${escapeHtml(report.topic ?? report.title ?? "Lesson report")}</p>
                    <span class="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
                      formatDate(report.lesson_date ?? report.created_at)
                    )}</span>
                  </div>
                  <p class="mt-3 text-sm leading-7 text-fb-ink-soft">${escapeHtml(report.summary ?? "No summary recorded.")}</p>
                </div>
              `
            )
            .join("")
        : `<div class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-fb-ink-soft">No lesson reports yet.</div>`;

      const assessmentsMarkup = bundle.assessments.length
        ? byRecentDate(bundle.assessments, "assessment_date", "created_at")
            .slice(0, 4)
            .map(
              (assessment) => `
                <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <p class="text-sm font-semibold text-fb-ink">${escapeHtml(assessment.title ?? "Assessment")}</p>
                  <p class="mt-2 text-sm text-fb-ink-soft">${escapeHtml(
                    assessment.score !== undefined && assessment.score !== null
                      ? `${assessment.score}${assessment.max_score ? ` / ${assessment.max_score}` : ""}`
                      : "Score not recorded"
                  )}</p>
                  <p class="mt-3 text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
                    formatDate(assessment.assessment_date ?? assessment.created_at)
                  )}</p>
                </div>
              `
            )
            .join("")
        : `<div class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-fb-ink-soft">No assessments yet.</div>`;

      const targetsMarkup = bundle.targets.length
        ? byRecentDate(bundle.targets, "due_date", "updated_at", "created_at")
            .slice(0, 4)
            .map(
              (target) => `
                <div class="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                  <div class="flex items-center justify-between gap-4">
                    <p class="text-sm font-semibold text-fb-ink">${escapeHtml(target.title ?? target.target ?? "Target")}</p>
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
                      target.status ?? "Open"
                    )}</span>
                  </div>
                  <p class="mt-3 text-sm leading-7 text-fb-ink-soft">${escapeHtml(target.notes ?? "No additional notes recorded.")}</p>
                </div>
              `
            )
            .join("")
        : `<div class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-fb-ink-soft">No targets yet.</div>`;

      return `
        <article class="card-panel p-8 sm:p-10">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">${escapeHtml(
                bundle.student.year_group ?? "Student overview"
              )}</p>
              <h2 class="mt-2 text-3xl font-semibold tracking-tight text-fb-ink">${escapeHtml(getStudentName(bundle.student))}</h2>
              <p class="mt-2 text-sm leading-6 text-fb-ink-soft">${escapeHtml(bundle.student.school ?? "School not recorded")}</p>
            </div>
          </div>
          <div class="mt-8 grid gap-6 xl:grid-cols-3">
            <section class="space-y-4">
              <h3 class="text-lg font-semibold text-fb-ink">Lesson reports</h3>
              ${reportsMarkup}
            </section>
            <section class="space-y-4">
              <h3 class="text-lg font-semibold text-fb-ink">Assessments</h3>
              ${assessmentsMarkup}
            </section>
            <section class="space-y-4">
              <h3 class="text-lg font-semibold text-fb-ink">Targets</h3>
              ${targetsMarkup}
            </section>
          </div>
        </article>
      `;
    })
    .join("");
}

export function fillStudentSelects(students: StudentRow[]) {
  const options = [
    `<option value="">Select a student</option>`,
    ...students.map(
      (student) => `<option value="${escapeHtml(student.id)}">${escapeHtml(getStudentName(student))}</option>`
    )
  ].join("");

  document.querySelectorAll<HTMLSelectElement>("[data-student-select]").forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = options;
    if (currentValue) select.value = currentValue;
  });
}

export function fillTutorSelects(tutors: ProfileRow[]) {
  const options = [
    `<option value="">Select a tutor</option>`,
    ...tutors.map(
      (profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(getProfileName(profile))}</option>`
    )
  ].join("");

  document.querySelectorAll<HTMLSelectElement>("[data-tutor-select]").forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = options;
    if (currentValue) select.value = currentValue;
  });
}

export function fillTargetEditor(container: HTMLElement, targets: TargetRow[]) {
  container.innerHTML = targets.length
    ? byRecentDate(targets, "due_date", "updated_at", "created_at")
        .slice(0, 8)
        .map(
          (target) => `
            <button
              type="button"
              class="flex w-full items-start justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-slate-300"
              data-target-edit
              data-target-id="${escapeHtml(target.id)}"
              data-target-student="${escapeHtml(String(target.student_id ?? ""))}"
              data-target-title="${escapeHtml(target.title ?? target.target ?? "")}"
              data-target-status="${escapeHtml(target.status ?? "")}"
              data-target-due="${escapeHtml(target.due_date ?? "")}"
              data-target-notes="${escapeHtml(target.notes ?? "")}"
            >
              <span>
                <span class="block text-sm font-semibold text-fb-ink">${escapeHtml(target.title ?? target.target ?? "Target")}</span>
                <span class="mt-2 block text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
                  formatDate(target.due_date ?? target.updated_at ?? target.created_at)
                )}</span>
              </span>
              <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
                target.status ?? "Open"
              )}</span>
            </button>
          `
        )
        .join("")
    : `<div class="rounded-[1.5rem] border border-dashed border-slate-200 bg-white p-5 text-sm text-fb-ink-soft">No targets created yet.</div>`;
}

export function readFormValues(form: HTMLFormElement) {
  const entries = new FormData(form).entries();
  return Object.fromEntries(entries) as Record<string, string>;
}

export function setStatusMessage(node: HTMLElement | null, tone: "success" | "error" | "info", message: string) {
  if (!node) return;
  node.textContent = message;
  node.classList.remove("hidden", "text-emerald-700", "text-rose-700", "text-slate-600");
  if (tone === "success") node.classList.add("text-emerald-700");
  if (tone === "error") node.classList.add("text-rose-700");
  if (tone === "info") node.classList.add("text-slate-600");
}

export async function bootstrapLoginPage() {
  const client = createBrowserSupabaseClient();
  const form = document.querySelector<HTMLFormElement>("[data-login-form]");
  const feedback = document.querySelector<HTMLElement>("[data-login-feedback]");
  const reason = new URLSearchParams(window.location.search).get("reason");

  if (reason && feedback) {
    const messages: Record<string, string> = {
      "auth-required": "Please sign in to continue to the reporting portal.",
      "session-ended": "Your session ended. Please sign in again.",
      "signed-out": "You have been signed out."
    };
    setStatusMessage(feedback, "info", messages[reason] ?? "Please sign in.");
  }

  const {
    data: { session }
  } = await client.auth.getSession();

  if (session?.user) {
    const profile = await fetchProfile(session.user.id);
    redirectForRole(profile?.role ?? "parent");
    return;
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(form);
    setStatusMessage(feedback, "info", "Signing you in...");
    const { error, data } = await client.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });

    if (error) {
      setStatusMessage(feedback, "error", error.message);
      return;
    }

    if (!data.user) {
      setStatusMessage(feedback, "error", "We could not verify your account. Please try again.");
      return;
    }

    const profile = await fetchProfile(data.user.id);
    redirectForRole(profile?.role ?? "parent");
  });
}
