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

export interface ParentInviteRow {
  id?: string;
  parent_id?: string | null;
  student_id?: string | null;
  invite_code?: string | null;
  code?: string | null;
  status?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
  [key: string]: unknown;
}

export interface FunctionResponse {
  message: string;
  [key: string]: unknown;
}

interface GuardOptions {
  adminRedirectHome?: string;
  adminRedirectMessage?: string;
  unauthorizedMessage?: string;
}

async function extractErrorMessage(error: unknown) {
  const response = (error as { context?: unknown } | null)?.context;

  if (response instanceof Response) {
    try {
      const cloned = response.clone();
      const contentType = cloned.headers.get("content-type") ?? "";

      if (contentType.includes("application/json")) {
        const payload = (await cloned.json()) as Record<string, unknown>;
        if (typeof payload.message === "string" && payload.message.trim()) {
          return payload.message.trim();
        }
      }

      const text = (await cloned.text()).trim();
      if (text) return text;
    } catch {
      // Ignore parsing issues and fall back to the error object itself.
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "";
}

function mapFriendlyErrorMessage(message: string, fallback: string) {
  const normalised = message.toLowerCase();

  if (!message) return fallback;
  if (normalised.includes("invalid login credentials")) {
    return "Those login details did not match a FlyBridge portal account. Please check the email and password and try again.";
  }
  if (normalised.includes("session") && normalised.includes("missing bearer token")) {
    return "Your session has ended. Please sign in again and retry.";
  }
  if (
    normalised.includes("failed to fetch") ||
    normalised.includes("network") ||
    normalised.includes("load failed") ||
    normalised.includes("fetch failed")
  ) {
    return "We could not reach the FlyBridge portal service. Please check your connection and try again.";
  }
  if (
    normalised.includes("already registered") ||
    normalised.includes("already exists") ||
    normalised.includes("duplicate key") ||
    normalised.includes("duplicate")
  ) {
    return "Those details are already in use. If this account should already exist, sign in instead or use a different email address.";
  }
  if (
    normalised.includes("not authorized") ||
    normalised.includes("unauthorized") ||
    normalised.includes("only admin users can perform this action")
  ) {
    return "Your account does not currently have permission to do that.";
  }
  if (normalised.includes("profile not found")) {
    return "Your FlyBridge portal profile is not ready yet. Please contact FlyBridge and we can finish setting up your access.";
  }
  if (normalised.includes("missing public_supabase_url") || normalised.includes("public_supabase_anon_key")) {
    return "Portal configuration is incomplete. Add the Supabase environment variables before using this feature.";
  }
  if (normalised.includes("edge function returned a non-2xx status code")) {
    return fallback;
  }

  return message;
}

export async function getFriendlyErrorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  const message = await extractErrorMessage(error);
  return mapFriendlyErrorMessage(message, fallback);
}

function debugAuth(label: string, payload?: Record<string, unknown>) {
  if (!import.meta.env.DEV) return;
  if (payload) {
    console.info(`[FlyBridge auth] ${label}`, payload);
    return;
  }
  console.info(`[FlyBridge auth] ${label}`);
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

function formatAssessmentScore(score?: number | null, maxScore?: number | null) {
  if (score === undefined || score === null) return "Score not recorded";
  if (maxScore === undefined || maxScore === null || Number(maxScore) <= 0) return `${score}`;
  const percentage = Math.round((Number(score) / Number(maxScore)) * 100);
  return `${score} / ${maxScore} (${percentage}%)`;
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

export function getRoleLabel(role?: ProfileRole | null) {
  if (role === "admin") return "Administrator";
  if (role === "tutor") return "Tutor access";
  if (role === "parent") return "Parent access";
  return "Portal access";
}

function getProgressStatusMeta(status?: string | null) {
  const value = String(status ?? "settling_in").toLowerCase();

  if (value === "needs_attention") {
    return {
      label: "Needs attention",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700"
    };
  }

  if (value === "below_target") {
    return {
      label: "Below target",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700"
    };
  }

  if (value === "on_track") {
    return {
      label: "On track",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700"
    };
  }

  if (value === "above_target") {
    return {
      label: "Above target",
      badgeClass: "border-sky-200 bg-sky-50 text-sky-700"
    };
  }

  return {
    label: "Settling in",
    badgeClass: "border-slate-200 bg-slate-50 text-slate-700"
  };
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

function setBusy(selector: string, busy: boolean) {
  document.querySelectorAll<HTMLElement>(selector).forEach((node) => {
    node.setAttribute("aria-busy", String(busy));
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

export function getRoleHome(role?: ProfileRole | null) {
  if (role === "admin") return "/admin";
  if (role === "tutor") return "/tutor";
  return "/parent-portal";
}

export function redirectForRole(role?: ProfileRole | null, mustChangePassword?: boolean | null) {
  const nextPath = mustChangePassword ? "/change-password" : getRoleHome(role);
  if (window.location.pathname === nextPath) return;
  debugAuth("Routing to next portal page", {
    role: role ?? "parent",
    mustChangePassword: Boolean(mustChangePassword),
    nextPath
  });
  window.location.href = nextPath;
}

export function redirectForProfile(profile?: Pick<ProfileRow, "role" | "must_change_password"> | null) {
  redirectForRole(profile?.role, profile?.must_change_password);
}

function setRoleRedirect(role?: ProfileRole | null, hrefOverride?: string, labelOverride?: string) {
  const href = hrefOverride ?? getRoleHome(role);
  const label =
    labelOverride ??
    (role === "admin" ? "Open admin workspace" : role === "tutor" ? "Open tutor dashboard" : "Open parent portal");
  document.querySelectorAll<HTMLAnchorElement>("[data-role-redirect]").forEach((node) => {
    node.href = href;
    node.textContent = label;
    node.classList.remove("hidden");
  });
}

function hideRoleRedirect() {
  document.querySelectorAll<HTMLAnchorElement>("[data-role-redirect]").forEach((node) => {
    node.classList.add("hidden");
  });
}

export function wireLogout(client: ReturnType<typeof createBrowserSupabaseClient>) {
  document.querySelectorAll<HTMLElement>("[data-logout]").forEach((node) => {
    node.addEventListener("click", async () => {
      clearStoredTemporaryPassword();
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

async function requireProfile(userId: string) {
  const profile = await fetchProfile(userId);
  if (!profile) {
    throw new Error("Profile not found.");
  }
  return profile;
}

async function syncPortalAuthState({
  markPasswordChanged = false,
  updateLastLogin = true,
  loginTime = new Date().toISOString()
}: {
  markPasswordChanged?: boolean;
  updateLastLogin?: boolean;
  loginTime?: string;
}) {
  const client = createBrowserSupabaseClient();
  const payload = {
    mark_password_changed: markPasswordChanged,
    update_last_login: updateLastLogin,
    login_time: loginTime
  };

  debugAuth("Calling sync_portal_auth_state", payload);
  const { data, error } = await client.rpc("sync_portal_auth_state", payload);
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

function getStoredTemporaryPassword() {
  return window.sessionStorage.getItem("flybridge-temp-password") ?? "";
}

function storeTemporaryPassword(password: string) {
  if (!password) return;
  window.sessionStorage.setItem("flybridge-temp-password", password);
}

function clearStoredTemporaryPassword() {
  window.sessionStorage.removeItem("flybridge-temp-password");
}

function setFormPending(form: HTMLFormElement | null, pending: boolean, idleLabel?: string, busyLabel?: string) {
  if (!form) return;
  form.setAttribute("aria-busy", String(pending));
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!submit) return;
  const originalLabel = submit.dataset.idleLabel ?? idleLabel ?? submit.textContent?.trim() ?? "Submit";
  submit.dataset.idleLabel = originalLabel;
  submit.disabled = pending;
  submit.textContent = pending ? busyLabel ?? "Saving..." : originalLabel;
}

export async function guardPage(requiredRoles: ProfileRole[], options: GuardOptions = {}) {
  const client = createBrowserSupabaseClient();
  showNode("[data-role-loading]", true);
  showNode("[data-role-error]", false);
  showNode("[data-role-guard]", false);
  setBusy("[data-role-loading]", true);
  hideRoleRedirect();

  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session?.user) {
    redirectToLogin("auth-required");
    throw new Error("Authentication required.");
  }

  const profile = await fetchProfile(session.user.id);
  if (!profile) {
    setGuardMessage("We found your account, but FlyBridge has not finished setting up your portal access yet.");
    showNode("[data-role-loading]", false);
    setBusy("[data-role-loading]", false);
    showNode("[data-role-error]", true);
    throw new Error("Profile not found.");
  }

  const role = profile.role ?? "parent";
  const pathname = window.location.pathname;

  if (profile.must_change_password) {
    if (pathname !== "/change-password") {
      debugAuth("Redirecting to forced password change", {
        userId: session.user.id,
        role,
        pathname
      });
      window.location.href = "/change-password";
      throw new Error("Password change required.");
    }
  }

  if (!requiredRoles.includes(role)) {
    if (role === "admin" && options.adminRedirectHome) {
      setGuardMessage(options.adminRedirectMessage ?? "This account uses the FlyBridge admin workspace.");
      setRoleRedirect("admin", options.adminRedirectHome, "Open admin workspace");
    } else {
      setGuardMessage(
        options.unauthorizedMessage ?? "Your account is signed in, but this page is not the right portal view for your access level."
      );
    }
    showNode("[data-role-loading]", false);
    setBusy("[data-role-loading]", false);
    showNode("[data-role-error]", true);
    throw new Error("Unauthorized role.");
  }

  setText("[data-session-name]", getProfileName(profile));
  setText("[data-session-role]", getRoleLabel(role));
  setText("[data-session-email]", profile.email ?? session.user.email ?? "");
  showNode("[data-role-loading]", false);
  setBusy("[data-role-loading]", false);
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

export async function fetchTableRows(table: "tutor_student_links" | "parent_student_links" | "parent_invites") {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.from(table).select("*");
  if (error) throw error;
  return data ?? [];
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

export async function updateStudentRecord(values: {
  studentId: string;
  fullName: string;
  yearGroup?: string;
  school?: string;
  notes?: string;
}) {
  const [firstName = "", ...rest] = values.fullName.trim().split(" ");
  const lastName = rest.join(" ").trim();

  await updateWithFallbacks("students", values.studentId, [
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

export async function invokeAdminFunction<T extends FunctionResponse>(name: string, payload: Record<string, unknown>) {
  const client = createBrowserSupabaseClient();
  const { data, error } = await client.functions.invoke(name, {
    body: payload
  });

  if (error) {
    throw new Error(await getFriendlyErrorMessage(error, "We could not complete that secure admin action just now."));
  }

  if (!data) {
    throw new Error("The function completed without returning a response body.");
  }

  return data as T;
}

export async function createTutorAccount(values: {
  email: string;
  fullName: string;
  password?: string;
}) {
  return invokeAdminFunction("create-tutor", values);
}

export async function createParentAccount(values: {
  email: string;
  fullName: string;
  password?: string;
}) {
  return invokeAdminFunction("create-parent", values);
}

export async function linkTutorToStudent(values: {
  tutorId: string;
  studentId: string;
}) {
  return invokeAdminFunction("link-tutor-to-student", values);
}

export async function linkParentToStudent(values: {
  parentId: string;
  studentId: string;
}) {
  return invokeAdminFunction("link-parent-to-student", values);
}

export async function generateParentInvite(values: {
  parentId: string;
  studentId: string;
}) {
  return invokeAdminFunction<{ message: string; inviteCode?: string; code?: string }>("generate-parent-invite", values);
}

export async function resetPortalPassword(values: {
  userId: string;
  email?: string;
}) {
  return invokeAdminFunction("reset-portal-password", values);
}

export function renderEmptyState(container: HTMLElement, title: string, body: string) {
  container.setAttribute("aria-busy", "false");
  container.innerHTML = `
    <article class="card-panel border-dashed p-4 text-center sm:p-5">
      <span class="mini-chip">FlyBridge portal</span>
      <h3 class="mt-3 text-lg font-semibold text-fb-ink sm:text-xl">${escapeHtml(title)}</h3>
      <p class="mt-2 text-sm leading-6 text-fb-ink-soft sm:text-base">${escapeHtml(body)}</p>
    </article>
  `;
}

export function renderStudentCards(
  container: HTMLElement,
  students: StudentRow[],
  options: { editable?: boolean } = {}
) {
  container.setAttribute("aria-busy", "false");
  if (students.length === 0) {
    renderEmptyState(
      container,
      "No students yet",
      "Once FlyBridge student records are added, they will appear here automatically."
    );
    return;
  }

  container.innerHTML = students
    .map((student) => {
      const studentName = getStudentName(student);
      const progress = getProgressStatusMeta(String(student.progress_status ?? ""));
      const isActive = student.active !== false;
      return `
        <article class="card-panel p-4 sm:p-5" data-student-card data-student-id="${escapeHtml(student.id)}" data-student-name="${escapeHtml(
          studentName.toLowerCase()
        )}" data-student-active="${isActive ? "active" : "inactive"}">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">${escapeHtml(
                student.year_group ?? "Student"
              )}</p>
              <h3 class="mt-2 break-words text-xl font-semibold text-fb-ink">${escapeHtml(studentName)}</h3>
              <p class="mt-2 break-words text-sm leading-6 text-fb-ink-soft">${escapeHtml(student.school ?? "School not recorded")}</p>
            </div>
            <div class="flex flex-wrap gap-2 sm:justify-end">
              <span class="rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase ${
                isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"
              }">
                ${isActive ? "Active" : "Inactive"}
              </span>
              <span class="rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase ${progress.badgeClass}">
                ${escapeHtml(progress.label)}
              </span>
              <button type="button" class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2" data-student-fill data-student-id="${escapeHtml(student.id)}" aria-label="Use ${escapeHtml(studentName)} in dashboard forms">Use in forms</button>
              ${
                options.editable
                  ? `<button type="button" class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2" data-student-edit data-student-id="${escapeHtml(student.id)}" aria-label="Edit ${escapeHtml(studentName)}">Edit</button>`
                  : ""
              }
            </div>
          </div>
          ${
            student.notes
              ? `<p class="mt-4 break-words rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-fb-ink-soft">${escapeHtml(String(student.notes))}</p>`
              : ""
          }
          ${
            options.editable
              ? `<div class="mt-4 flex flex-wrap gap-2">
                  <button type="button" class="quick-add-chip" data-student-action="report" data-student-id="${escapeHtml(student.id)}">Add report</button>
                  <button type="button" class="quick-add-chip" data-student-action="assessment" data-student-id="${escapeHtml(student.id)}">Add assessment</button>
                  <button type="button" class="quick-add-chip" data-student-action="target" data-student-id="${escapeHtml(student.id)}">Add target</button>
                </div>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

export function renderAssessmentList(container: HTMLElement, assessments: AssessmentRow[], studentsById: Map<string, StudentRow>) {
  container.setAttribute("aria-busy", "false");
  if (assessments.length === 0) {
    renderEmptyState(
      container,
      "No assessments yet",
      "Assessments created by tutors or admins will appear here once progress checkpoints are recorded."
    );
    return;
  }

  container.innerHTML = byRecentDate(assessments, "assessment_date", "created_at")
    .slice(0, 12)
    .map((assessment) => {
      const student = assessment.student_id ? studentsById.get(String(assessment.student_id)) : undefined;
      return `
        <article class="card-panel p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
                student ? getStudentName(student) : "Assessment"
              )}</p>
              <h3 class="mt-2 break-words text-lg font-semibold text-fb-ink">${escapeHtml(assessment.title ?? "Assessment")}</h3>
            </div>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
              formatDate(assessment.assessment_date ?? assessment.created_at)
            )}</span>
          </div>
          <p class="mt-3 text-sm text-fb-ink-soft">${escapeHtml(formatAssessmentScore(assessment.score, assessment.max_score))}</p>
          ${
            assessment.notes
              ? `<p class="mt-3 break-words text-sm leading-7 text-fb-ink-soft">${escapeHtml(assessment.notes)}</p>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

export function renderProfileCards(
  container: HTMLElement,
  profiles: ProfileRow[],
  options: {
    heading: "parent" | "tutor";
    links?: LinkRow[];
    studentsById?: Map<string, StudentRow>;
    invites?: ParentInviteRow[];
  } = { heading: "tutor" }
) {
  container.setAttribute("aria-busy", "false");
  if (profiles.length === 0) {
    renderEmptyState(
      container,
      options.heading === "parent" ? "No parent accounts yet" : "No tutor accounts yet",
      options.heading === "parent"
        ? "Create a parent account and it will appear here once FlyBridge access is ready."
        : "Create a tutor account and it will appear here once FlyBridge access is ready."
    );
    return;
  }

  container.innerHTML = profiles
    .map((profile) => {
      const relatedLinks =
        options.heading === "parent"
          ? options.links?.filter((link) => link.parent_id === profile.id) ?? []
          : options.links?.filter((link) => link.tutor_id === profile.id) ?? [];
      const relatedStudents = relatedLinks
        .map((link) => options.studentsById?.get(String(link.student_id ?? "")))
        .filter(Boolean)
        .map((student) => getStudentName(student as StudentRow));
      const inviteCount = options.invites?.filter((invite) => invite.parent_id === profile.id).length ?? 0;
      const latestInvite = byRecentDate(
        (options.invites?.filter((invite) => invite.parent_id === profile.id) ?? []) as Record<string, unknown>[],
        "created_at",
        "expires_at"
      )[0] as ParentInviteRow | undefined;
      const status = String(profile.status ?? "active");
      const statusBadgeClass =
        status === "suspended"
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : status === "inactive"
            ? "border-amber-200 bg-amber-50 text-amber-700"
            : "border-emerald-200 bg-emerald-50 text-emerald-700";

      const relatedStudentsMarkup = relatedStudents.length
        ? relatedStudents
            .map(
              (studentName) =>
                `<span class="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(studentName)}</span>`
            )
            .join("")
        : "";

      return `
        <article class="card-panel p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">${escapeHtml(
                getRoleLabel((profile.role as ProfileRole | null | undefined) ?? options.heading)
              )}</p>
              <h3 class="mt-2 break-words text-lg font-semibold text-fb-ink sm:text-xl">${escapeHtml(getProfileName(profile))}</h3>
              <p class="mt-2 break-words text-sm leading-6 text-fb-ink-soft">${escapeHtml(profile.email ?? "Email not recorded")}</p>
            </div>
            <div class="flex flex-wrap gap-2 sm:justify-end">
              <span class="rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase ${statusBadgeClass}">
                ${escapeHtml(status)}
              </span>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
                ${relatedStudents.length} linked student${relatedStudents.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div class="mt-4 space-y-3">
            ${
              relatedStudents.length
                ? `<div class="flex flex-wrap gap-2">${relatedStudentsMarkup}</div>`
                : `<p class="text-sm leading-7 text-fb-ink-soft">No student links yet.</p>`
            }
            <div class="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-fb-ink-soft">
              Account status: ${escapeHtml(status)}${profile.last_login_at ? ` • Last login ${escapeHtml(formatDate(profile.last_login_at))}` : ""}
            </div>
            ${
              options.heading === "parent"
                ? `<div class="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-fb-ink-soft">
                    Access status: ${escapeHtml(latestInvite?.status ?? "Profile created and ready to link")}
                    ${inviteCount ? ` • ${inviteCount} invite${inviteCount === 1 ? "" : "s"} generated` : ""}
                  </div>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");
}

export function activateTabs(groupSelector: string, panelSelector: string, initialTab: string) {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>(groupSelector));
  const panels = Array.from(document.querySelectorAll<HTMLElement>(panelSelector));

  tabs.forEach((tab) => {
    const key = tab.dataset.tab ?? "";
    const panel = panels.find((candidate) => candidate.dataset.panel === key);
    if (!key || !panel) return;
    const panelId = `panel-${key}`;
    const tabId = `tab-${key}`;
    tab.id = tabId;
    panel.id = panelId;
    tab.setAttribute("aria-controls", panelId);
    panel.setAttribute("aria-labelledby", tabId);
  });

  const showTab = (tabKey: string) => {
    tabs.forEach((tab) => {
      const active = tab.dataset.tab === tabKey;
      tab.setAttribute("aria-selected", String(active));
      tab.setAttribute("tabindex", active ? "0" : "-1");
      tab.classList.toggle("bg-fb-bg", active);
      tab.classList.toggle("text-white", active);
      tab.classList.toggle("shadow-sm", active);
      tab.classList.toggle("border-slate-200", !active);
      tab.classList.toggle("bg-white", !active);
      tab.classList.toggle("text-fb-ink", !active);
    });
    panels.forEach((panel) => {
      const isActive = panel.dataset.panel === tabKey;
      panel.classList.toggle("hidden", !isActive);
      panel.setAttribute("aria-hidden", String(!isActive));
      if (isActive) {
        panel.classList.remove("animate-rise-in");
        window.requestAnimationFrame(() => panel.classList.add("animate-rise-in"));
      }
    });
    if (window.location.hash !== `#${tabKey}`) {
      history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${tabKey}`);
    }
  };

  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.addEventListener("click", () => showTab(tab.dataset.tab ?? initialTab));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const currentIndex = tabs.indexOf(tab);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
      const nextTab = tabs[nextIndex];
      nextTab?.focus();
      showTab(nextTab?.dataset.tab ?? initialTab);
    });
  });

  panels.forEach((panel) => {
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("tabindex", "0");
  });

  const requested = window.location.hash.replace("#", "");
  showTab(requested || initialTab);
}

export function renderReportTimeline(
  container: HTMLElement,
  reports: LessonReportRow[],
  studentsById: Map<string, StudentRow>
) {
  container.setAttribute("aria-busy", "false");
  if (reports.length === 0) {
    renderEmptyState(container, "No lesson reports yet", "Lesson reports will appear here once tutors begin recording completed sessions.");
    return;
  }

  container.innerHTML = byRecentDate(reports, "lesson_date", "created_at")
    .map((report) => {
      const student = report.student_id ? studentsById.get(String(report.student_id)) : undefined;
      return `
        <article class="card-panel p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">${escapeHtml(
                student ? getStudentName(student) : "Lesson report"
              )}</p>
              <h3 class="mt-2 text-lg font-semibold text-fb-ink sm:text-xl">${escapeHtml(
                report.topic ?? report.title ?? "Lesson summary"
              )}</h3>
            </div>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
              ${escapeHtml(formatDate(report.lesson_date ?? report.created_at))}
            </span>
          </div>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Summary</p>
              <p class="mt-2 break-words text-sm leading-6 text-fb-ink-soft">${escapeHtml(report.summary ?? "No summary recorded.")}</p>
            </div>
            <div>
              <p class="text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">Homework / Next steps</p>
              <p class="mt-2 break-words text-sm leading-6 text-fb-ink-soft">${escapeHtml(
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
  container.setAttribute("aria-busy", "false");
  if (bundles.length === 0) {
    renderEmptyState(
      container,
      "No linked students yet",
      "Once FlyBridge links this parent account to a student, the reporting portal will populate automatically."
    );
    return;
  }

  container.innerHTML = bundles
    .map((bundle) => {
      const reports = byRecentDate(bundle.reports, "lesson_date", "created_at");
      const assessments = byRecentDate(bundle.assessments, "assessment_date", "created_at");
      const targets = byRecentDate(bundle.targets, "due_date", "updated_at", "created_at");
      const latestReport = reports[0];
      const activeTargets = targets.filter((target) => String(target.status ?? "").toLowerCase() !== "complete");
      const progress = getProgressStatusMeta(String(bundle.student.progress_status ?? ""));
      const recallAverage =
        bundle.student.recall_average !== undefined && bundle.student.recall_average !== null && bundle.student.recall_average !== ""
          ? `${bundle.student.recall_average}`
          : "Not tracked yet";
      const overviewItems = [
        {
          label: "Progress status",
          value: progress.label
        },
        {
          label: "Recall score",
          value: recallAverage
        },
        {
          label: "Latest lesson",
          value: latestReport ? formatDate(latestReport.lesson_date ?? latestReport.created_at) : "Pending"
        },
        {
          label: "Current targets",
          value: String(activeTargets.length)
        }
      ];

      const assessmentsMarkup = assessments.length
        ? assessments
            .slice(0, 2)
            .map(
              (assessment) => `
                <div class="rounded-[1rem] border border-slate-200 bg-white p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p class="break-words text-sm font-semibold text-fb-ink">${escapeHtml(assessment.title ?? "Assessment")}</p>
                    <span class="mini-chip">${escapeHtml(formatDate(assessment.assessment_date ?? assessment.created_at))}</span>
                  </div>
                  <p class="mt-3 text-base font-semibold text-fb-ink">${escapeHtml(
                    formatAssessmentScore(assessment.score, assessment.max_score)
                  )}</p>
                  ${
                    assessment.notes
                      ? `<p class="mt-2 break-words text-sm leading-6 text-fb-ink-soft">${escapeHtml(assessment.notes)}</p>`
                      : ""
                  }
                </div>
              `
            )
            .join("")
        : `<div class="rounded-[1rem] border border-dashed border-slate-200 bg-white p-4 text-sm text-fb-ink-soft">No assessments have been added yet.</div>`;

      const targetsMarkup = targets.length
        ? targets
            .slice(0, 2)
            .map(
              (target) => `
                <div class="rounded-[1rem] border border-slate-200 bg-white p-4">
                  <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <p class="break-words text-sm font-semibold text-fb-ink">${escapeHtml(target.title ?? target.target ?? "Target")}</p>
                    <span class="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
                      target.status ?? "Open"
                    )}</span>
                  </div>
                  <p class="mt-3 break-words text-sm leading-6 text-fb-ink-soft">${escapeHtml(target.notes ?? "No additional notes recorded.")}</p>
                </div>
              `
            )
            .join("")
        : `<div class="rounded-[1rem] border border-dashed border-slate-200 bg-white p-4 text-sm text-fb-ink-soft">No targets are being tracked yet.</div>`;

      const latestReportMarkup = latestReport
        ? `
            <section class="dark-panel p-5 sm:p-6">
              <p class="text-xs font-semibold tracking-[0.18em] text-sky-200 uppercase">Latest lesson update</p>
              <h3 class="mt-3 break-words text-xl font-semibold text-white sm:text-2xl">${escapeHtml(
                latestReport.topic ?? latestReport.title ?? "Lesson summary"
              )}</h3>
              <p class="mt-3 break-words text-sm leading-6 text-slate-300">${escapeHtml(
                latestReport.summary ?? "No summary recorded."
              )}</p>
              <div class="mt-4 grid gap-4 sm:grid-cols-2">
                <div class="rounded-[1rem] border border-white/10 bg-white/[0.05] p-4">
                  <p class="text-xs font-semibold tracking-[0.16em] text-sky-200 uppercase">Strengths</p>
                  <p class="mt-2 break-words text-sm leading-6 text-slate-200">${escapeHtml(
                    latestReport.strengths ?? "No strengths were highlighted in this update."
                  )}</p>
                </div>
                <div class="rounded-[1rem] border border-white/10 bg-white/[0.05] p-4">
                  <p class="text-xs font-semibold tracking-[0.16em] text-sky-200 uppercase">Areas to improve</p>
                  <p class="mt-2 break-words text-sm leading-6 text-slate-200">${escapeHtml(
                    latestReport.next_steps ?? "The next teaching focus has not been added yet."
                  )}</p>
                </div>
              </div>
              <div class="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.05] p-4">
                <p class="text-xs font-semibold tracking-[0.16em] text-sky-200 uppercase">Homework and follow-up</p>
                <p class="mt-2 break-words text-sm leading-6 text-slate-200">${escapeHtml(
                  latestReport.homework ?? "No homework or follow-up task was recorded in this update."
                )}</p>
              </div>
            </section>
          `
        : `
            <section class="dark-panel p-5 sm:p-6">
              <p class="text-xs font-semibold tracking-[0.18em] text-sky-200 uppercase">Latest lesson update</p>
              <h3 class="mt-3 text-xl font-semibold text-white sm:text-2xl">The first lesson update will appear here.</h3>
              <p class="mt-3 text-sm leading-6 text-slate-300">Once FlyBridge logs the next lesson, this space will show a concise summary, key strengths, homework and the most useful next step for your child.</p>
              <div class="mt-4 rounded-[1rem] border border-white/10 bg-white/[0.05] p-4 text-sm leading-6 text-slate-200">
                Nothing is missing on your account. This simply means a lesson report has not been added yet.
              </div>
            </section>
          `;

      return `
        <article class="card-panel p-4 sm:p-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0">
              <p class="text-xs font-semibold tracking-[0.18em] text-slate-500 uppercase">${escapeHtml(
                bundle.student.year_group ?? "Student overview"
              )}</p>
              <h2 class="mt-2 break-words text-2xl font-semibold tracking-tight text-fb-ink sm:text-[2rem]">${escapeHtml(getStudentName(bundle.student))}</h2>
              <p class="mt-2 break-words text-sm leading-6 text-fb-ink-soft">${escapeHtml(bundle.student.school ?? "School not recorded")}</p>
            </div>
            <span class="rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-[0.14em] uppercase ${progress.badgeClass}">
              ${escapeHtml(progress.label)}
            </span>
          </div>
          <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            ${overviewItems
              .map(
                (item) => `
                  <div class="rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-3.5">
                    <p class="text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">${escapeHtml(item.label)}</p>
                    <p class="mt-2 text-base font-semibold text-fb-ink sm:text-lg">${escapeHtml(item.value)}</p>
                  </div>
                `
              )
              .join("")}
          </div>
          ${
            bundle.student.progress_status_note
              ? `<div class="mt-4 rounded-[1rem] border border-sky-100 bg-sky-50/90 px-4 py-3.5 text-sm leading-6 text-fb-ink-soft">
                  <span class="font-semibold text-fb-ink">Current progress note:</span> ${escapeHtml(bundle.student.progress_status_note)}
                </div>`
              : ""
          }
          <div class="mt-5 grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
            ${latestReportMarkup}
            <div class="space-y-4">
              <section class="card-panel p-5 sm:p-6">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 class="text-lg font-semibold text-fb-ink">Assessment progress</h3>
                  <span class="mini-chip">Latest checkpoints</span>
                </div>
                <div class="mt-4 space-y-3">
                  ${assessmentsMarkup}
                </div>
              </section>
              <section class="card-panel p-5 sm:p-6">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h3 class="text-lg font-semibold text-fb-ink">Current targets</h3>
                  <span class="mini-chip">Shared focus</span>
                </div>
                <div class="mt-4 space-y-3">
                  ${targetsMarkup}
                </div>
              </section>
            </div>
          </div>
          <div class="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm leading-6 text-fb-ink-soft">
            This view is deliberately selective. It is meant to show families the clearest summary of progress without pulling them into every student resource or worksheet.
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

export function setStudentSelection(studentId: string) {
  if (!studentId) return;
  document.querySelectorAll<HTMLSelectElement>("[data-student-select]").forEach((select) => {
    select.value = studentId;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  document.querySelectorAll<HTMLElement>("[data-student-card]").forEach((card) => {
    const active = card.dataset.studentId === studentId;
    card.classList.toggle("ring-2", active);
    card.classList.toggle("ring-sky-200", active);
    card.classList.toggle("bg-sky-50/40", active);
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

export function fillParentSelects(parents: ProfileRow[]) {
  const options = [
    `<option value="">Select a parent</option>`,
    ...parents.map(
      (profile) => `<option value="${escapeHtml(profile.id)}">${escapeHtml(getProfileName(profile))}</option>`
    )
  ].join("");

  document.querySelectorAll<HTMLSelectElement>("[data-parent-select]").forEach((select) => {
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
              class="flex w-full items-start justify-between gap-4 rounded-[1rem] border border-slate-200 bg-white px-4 py-3.5 text-left transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2"
              data-target-edit
              data-target-id="${escapeHtml(target.id)}"
              data-target-student="${escapeHtml(String(target.student_id ?? ""))}"
              data-target-title="${escapeHtml(target.title ?? target.target ?? "")}"
              data-target-status="${escapeHtml(target.status ?? "")}"
              data-target-due="${escapeHtml(target.due_date ?? "")}"
              data-target-notes="${escapeHtml(target.notes ?? "")}"
              aria-label="Edit target ${escapeHtml(target.title ?? target.target ?? "Target")}"
            >
              <span class="min-w-0">
                <span class="block break-words text-sm font-semibold text-fb-ink">${escapeHtml(target.title ?? target.target ?? "Target")}</span>
                <span class="mt-1.5 block text-xs font-semibold tracking-[0.14em] text-slate-500 uppercase">${escapeHtml(
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
    : `<div class="rounded-[1rem] border border-dashed border-slate-200 bg-white p-4 text-sm text-fb-ink-soft">No targets created yet.</div>`;
}

export function readFormValues(form: HTMLFormElement) {
  const entries = new FormData(form).entries();
  return Object.fromEntries(entries) as Record<string, string>;
}

export function setStatusMessage(node: HTMLElement | null, tone: "success" | "error" | "info", message: string) {
  if (!node) return;
  node.textContent = message;
  node.classList.remove("hidden", "status-success", "status-error", "status-info");
  node.classList.add("status-message");
  if (tone === "success") node.classList.add("status-success");
  if (tone === "error") node.classList.add("status-error");
  if (tone === "info") node.classList.add("status-info");
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
      "signed-out": "You have been signed out.",
      "password-reset-complete": "Your password has been updated. Please sign in with your new password."
    };
    setStatusMessage(feedback, "info", messages[reason] ?? "Please sign in.");
  }

  const {
    data: { session }
  } = await client.auth.getSession();

  if (session?.user) {
    let profile: ProfileRow;
    try {
      profile = await requireProfile(session.user.id);
    } catch {
      await client.auth.signOut();
      setStatusMessage(
        feedback,
        "error",
        "We found your account, but FlyBridge has not finished setting up your portal profile yet. Please contact FlyBridge."
      );
      return;
    }
    debugAuth("Existing session found on login page", {
      userId: session.user.id,
      mustChangePassword: Boolean(profile.must_change_password),
      role: profile.role ?? "parent"
    });
    redirectForProfile(profile);
    return;
  }

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(form);
    setFormPending(form, true, "Sign in", "Signing in...");
    setStatusMessage(feedback, "info", "Signing you in...");
    const { error, data } = await client.auth.signInWithPassword({
      email: values.email,
      password: values.password
    });

    if (error) {
      setFormPending(form, false, "Sign in");
      setStatusMessage(
        feedback,
        "error",
        await getFriendlyErrorMessage(error, "We could not sign you in right now. Please try again.")
      );
      return;
    }

    if (!data.user) {
      setFormPending(form, false, "Sign in");
      setStatusMessage(feedback, "error", "We could not verify your account. Please try again.");
      return;
    }

    let profile: ProfileRow;
    try {
      profile = await requireProfile(data.user.id);
    } catch {
      await client.auth.signOut();
      setFormPending(form, false, "Sign in");
      setStatusMessage(
        feedback,
        "error",
        "Your login worked, but no FlyBridge portal profile was found for this account. Please contact FlyBridge."
      );
      return;
    }

    debugAuth("Login succeeded", {
      userId: data.user.id,
      mustChangePassword: Boolean(profile.must_change_password),
      role: profile.role ?? "parent"
    });

    if (!profile.must_change_password) {
      try {
        await syncPortalAuthState({
          markPasswordChanged: false,
          updateLastLogin: true
        });
      } catch {
        // Non-blocking for standard sign-in. The dashboard should still open.
      }
      clearStoredTemporaryPassword();
    } else {
      storeTemporaryPassword(values.password);
    }

    redirectForProfile(profile);
  });
}

export async function bootstrapForgotPasswordPage() {
  const client = createBrowserSupabaseClient();
  const form = document.querySelector<HTMLFormElement>("[data-forgot-password-form]");
  const feedback = document.querySelector<HTMLElement>("[data-forgot-password-feedback]");

  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(form);
    setFormPending(form, true, "Send reset link", "Sending reset link...");
    setStatusMessage(feedback, "info", "Sending reset link...");

    const { error } = await client.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      setFormPending(form, false, "Send reset link");
      setStatusMessage(
        feedback,
        "error",
        await getFriendlyErrorMessage(error, "We could not send a reset link right now.")
      );
      return;
    }

    setStatusMessage(
      feedback,
      "success",
      "If that email is linked to a FlyBridge portal account, a reset link has been sent."
    );
    form.reset();
    setFormPending(form, false, "Send reset link");
  });
}

async function bootstrapPasswordUpdatePage(formSelector: string, feedbackSelector: string, successReason: string) {
  const client = createBrowserSupabaseClient();
  const form = document.querySelector<HTMLFormElement>(formSelector);
  const feedback = document.querySelector<HTMLElement>(feedbackSelector);
  const retryButton = document.querySelector<HTMLButtonElement>("[data-profile-sync-retry]");

  const {
    data: { session }
  } = await client.auth.getSession();

  if (!session?.user) {
    redirectToLogin("auth-required");
    return;
  }

  if (!form) return;

  let profile: ProfileRow;
  try {
    profile = await requireProfile(session.user.id);
  } catch {
    setStatusMessage(
      feedback,
      "error",
      "We found your account, but no FlyBridge portal profile is available yet. Please contact FlyBridge."
    );
    return;
  }

  if (successReason === "password-changed" && !profile.must_change_password) {
    redirectForRole(profile.role ?? "parent", false);
    return;
  }

  debugAuth("Loaded password change page", {
    userId: session.user.id,
    mustChangePassword: Boolean(profile.must_change_password),
    role: profile.role ?? "parent"
  });

  let retryState: { loginTime: string } | null = null;

  const syncProfileAfterPasswordChange = async (loginTime: string) => {
    let syncedProfile: ProfileRow | null = null;

    try {
      syncedProfile = await syncPortalAuthState({
        markPasswordChanged: true,
        updateLastLogin: true,
        loginTime
      });
      debugAuth("sync_portal_auth_state succeeded", {
        userId: session.user.id,
        returnedMustChangePassword: syncedProfile?.must_change_password ?? null
      });
    } catch (error) {
      debugAuth("sync_portal_auth_state failed", {
        userId: session.user.id,
        error: await extractErrorMessage(error)
      });
      throw error;
    }

    const refreshedProfile = await requireProfile(session.user.id);
    debugAuth("Profile re-fetched after sync", {
      userId: session.user.id,
      beforeMustChangePassword: Boolean(profile.must_change_password),
      afterMustChangePassword: Boolean(refreshedProfile.must_change_password)
    });

    if (refreshedProfile.must_change_password) {
      throw new Error("Password changed, but the portal still marks this account as requiring a password change.");
    }

    const { error: refreshError } = await client.auth.refreshSession();
    if (refreshError) {
      throw refreshError;
    }

    clearStoredTemporaryPassword();
    retryState = null;
    retryButton?.classList.add("hidden");
    return refreshedProfile;
  };

  if (form.dataset.authBound === "true") return;
  form.dataset.authBound = "true";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = readFormValues(form);
    const nextPassword = values.password.trim();
    const confirmPassword = values["confirm-password"].trim();
    const temporaryPassword = getStoredTemporaryPassword();

    if (!nextPassword) {
      setStatusMessage(feedback, "error", "Enter a new password before continuing.");
      return;
    }

    if (nextPassword.length < 8) {
      setStatusMessage(feedback, "error", "Use at least 8 characters for the new password.");
      return;
    }

    if (nextPassword !== confirmPassword) {
      setStatusMessage(feedback, "error", "The new passwords do not match yet.");
      return;
    }

    if (temporaryPassword && nextPassword === temporaryPassword) {
      setStatusMessage(feedback, "error", "Choose a different password from the temporary one you just used.");
      return;
    }

    setFormPending(
      form,
      true,
      successReason === "password-reset-complete" ? "Save new password" : "Update password",
      "Saving password..."
    );
    setStatusMessage(feedback, "info", "Updating your password...");
    const { error } = await client.auth.updateUser({
      password: nextPassword
    });

    debugAuth(error ? "updateUser failed" : "updateUser succeeded", {
      userId: session.user.id,
      error: error ? await extractErrorMessage(error) : null
    });

    if (error) {
      setFormPending(
        form,
        false,
        successReason === "password-reset-complete" ? "Save new password" : "Update password"
      );
      setStatusMessage(
        feedback,
        "error",
        await getFriendlyErrorMessage(error, "We could not update the password right now.")
      );
      return;
    }

    const loginTime = new Date().toISOString();
    retryState = { loginTime };
    try {
      const updatedProfile = await syncProfileAfterPasswordChange(loginTime);
      form.reset();
      setStatusMessage(
        feedback,
        "success",
        successReason === "password-reset-complete"
          ? "Password saved successfully. Redirecting you back to login..."
          : "Password updated successfully. Redirecting you to your dashboard..."
      );
      const nextRoute =
        successReason === "password-reset-complete" ? "/login?reason=password-reset-complete" : getRoleHome(updatedProfile.role);
      debugAuth("Password flow redirect chosen", {
        userId: session.user.id,
        role: updatedProfile.role ?? "parent",
        nextRoute
      });
      window.setTimeout(() => {
        if (successReason === "password-reset-complete") {
          redirectToLogin(successReason);
          return;
        }
        redirectForRole(updatedProfile.role ?? profile.role ?? "parent", false);
      }, 1200);
    } catch (profileSyncError) {
      setFormPending(
        form,
        false,
        successReason === "password-reset-complete" ? "Save new password" : "Update password"
      );
      setStatusMessage(
        feedback,
        "error",
        import.meta.env.DEV
          ? `Password updated, but portal sync failed: ${(await extractErrorMessage(profileSyncError)) || "Unknown sync error."}`
          : "Your password was updated, but FlyBridge could not finish the portal setup. Please retry the portal sync below."
      );
      retryButton?.classList.remove("hidden");
      return;
    }
  });

  retryButton?.addEventListener("click", async () => {
    if (!retryState) return;
    setFormPending(form, true, successReason === "password-reset-complete" ? "Save new password" : "Update password", "Retrying sync...");
    retryButton.classList.add("hidden");
    setStatusMessage(feedback, "info", "Retrying portal setup...");
    try {
      const updatedProfile = await syncProfileAfterPasswordChange(retryState.loginTime);
      setStatusMessage(feedback, "success", "Portal setup completed. Redirecting now...");
      window.setTimeout(() => {
        redirectForRole(updatedProfile.role ?? profile.role ?? "parent", false);
      }, 900);
    } catch (retryError) {
      setFormPending(form, false, successReason === "password-reset-complete" ? "Save new password" : "Update password");
      setStatusMessage(
        feedback,
        "error",
        import.meta.env.DEV
          ? `Retry failed: ${(await extractErrorMessage(retryError)) || "Unknown sync error."}`
          : "The password has changed, but the portal still could not finish setup. Please contact FlyBridge."
      );
      retryButton.classList.remove("hidden");
    }
  });
}

export async function bootstrapChangePasswordPage() {
  return bootstrapPasswordUpdatePage("[data-change-password-form]", "[data-change-password-feedback]", "password-changed");
}

export async function bootstrapResetPasswordPage() {
  return bootstrapPasswordUpdatePage("[data-reset-password-form]", "[data-reset-password-feedback]", "password-reset-complete");
}
