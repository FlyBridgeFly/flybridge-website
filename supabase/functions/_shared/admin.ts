import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { buildAuthAccessUpdate, buildProfileStatusUpdate, sanitizeUpdatePayload } from "./profile-archive.ts";

type PortalRole = "parent" | "tutor";
type PortalAccountFailureStage = "validation" | "auth_creation" | "profile_creation" | "student_link" | "email_delivery" | "audit_log";
type LinkTable = "parent_student_links" | "tutor_student_links";
type StatusStage = "validation" | "archive" | "restore" | "delete" | "link";
type ParentInviteRow = Record<string, unknown>;

interface PortalFunctionErrorOptions {
  stage: PortalAccountFailureStage | StatusStage;
  recoverable: boolean;
  status?: number;
  detail?: string;
}

class PortalFunctionError extends Error {
  stage: PortalAccountFailureStage | StatusStage;
  recoverable: boolean;
  status: number;
  detail?: string;

  constructor(message: string, options: PortalFunctionErrorOptions) {
    super(message);
    this.name = "PortalFunctionError";
    this.stage = options.stage;
    this.recoverable = options.recoverable;
    this.status = options.status ?? 400;
    this.detail = options.detail;
  }
}

interface ProfileInsertPayload {
  id: string;
  email: string;
  full_name: string;
  role: PortalRole;
  status: "active";
  must_change_password: true;
  temporary_password_created_at: string;
  phone?: string;
  subjects?: string[];
  key_stages?: string[];
}

interface ProvisionPortalAccountValues {
  adminClient: ReturnType<typeof createClient>;
  adminUserId: string;
  email: string;
  fullName: string;
  role: PortalRole;
  password: string;
  phone?: string;
  subjects?: string[];
  keyStages?: string[];
  studentId?: string;
  skipAuthCreate?: boolean;
  existingAuthUserId?: string;
  auditAction?: string;
}

interface ProvisionPortalAccountResult {
  success: true;
  message: string;
  role: PortalRole;
  userId: string;
  email: string;
  emailSent: boolean;
  stage?: "email_delivery" | "audit_log";
  warning?: string;
}

interface ParentInviteMutationResult {
  reachedTable: boolean;
  matchedCount: number;
  updatedCount: number;
  matchingColumns: string[];
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Edge Function secrets.");
}

export function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

export function successResponse(message: string, payload: Record<string, unknown> = {}) {
  return jsonResponse(200, {
    success: true,
    message,
    ...payload
  });
}

export function failureResponse(status: number, message: string, payload: Record<string, unknown> = {}) {
  return jsonResponse(status, {
    success: false,
    message,
    ...payload
  });
}

export function failureFromError(error: unknown, fallbackMessage: string) {
  if (error instanceof PortalFunctionError) {
    return failureResponse(error.status, error.message, {
      stage: error.stage,
      recoverable: error.recoverable,
      ...(Deno.env.get("DENO_DEPLOYMENT_ID") ? {} : error.detail ? { detail: error.detail } : {})
    });
  }

  return failureResponse(400, error instanceof Error ? error.message : fallbackMessage, {
    stage: "validation",
    recoverable: true
  });
}

export async function parseBody(request: Request) {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    throw new Error("Invalid JSON body.");
  }
}

export function getClients() {
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  return { adminClient };
}

export async function requireAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const { adminClient } = getClients();

  const {
    data: { user },
    error: authError
  } = await adminClient.auth.getUser(token);

  if (authError || !user) {
    throw new Error("Unable to verify the current user.");
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("Unable to load the admin profile.");
  }

  if (profile.role !== "admin") {
    throw new Error("Only admin users can perform this action.");
  }

  return {
    adminUser: user,
    adminProfile: profile,
    adminClient
  };
}

export async function recordAuditLog(
  adminClient: ReturnType<typeof createClient>,
  values: {
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const { error } = await adminClient.from("audit_logs").insert({
    actor_id: values.actorId ?? null,
    action: values.action,
    entity_type: values.entityType,
    entity_id: values.entityId ?? null,
    metadata: values.metadata ?? {}
  });

  if (error) {
    throw new Error(error.message);
  }
}

export function requireString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing required field: ${key}.`);
  }

  return value.trim();
}

export function optionalString(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

export function optionalStringArray(body: Record<string, unknown>, key: string) {
  const value = body[key];
  if (!Array.isArray(value)) return undefined;

  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);

  return cleaned.length ? cleaned : [];
}

export function requirePortalRole(body: Record<string, unknown>, key = "role"): PortalRole {
  const value = requireString(body, key).toLowerCase();
  if (value !== "parent" && value !== "tutor") {
    throw new PortalFunctionError("Role must be either parent or tutor.", {
      stage: "validation",
      recoverable: true
    });
  }
  return value;
}

export async function requireStudentIfSupplied(adminClient: ReturnType<typeof createClient>, studentId?: string) {
  if (!studentId) return;
  const { data, error } = await adminClient.from("students").select("id").eq("id", studentId).maybeSingle();
  if (error) {
    throw new PortalFunctionError("We could not validate the selected student.", {
      stage: "validation",
      recoverable: true,
      detail: error.message
    });
  }
  if (!data) {
    throw new PortalFunctionError("The selected student could not be found.", {
      stage: "validation",
      recoverable: true
    });
  }
}

export async function getProfileById(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient.from("profiles").select("*").eq("id", userId).maybeSingle();

  if (error || !data) {
    throw new Error("Unable to load the selected portal profile.");
  }

  return data;
}

export async function upsertProfile(adminClient: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const cleaned = sanitizeUpdatePayload(payload);
  const { error } = await adminClient.from("profiles").upsert(cleaned, {
    onConflict: "id"
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateProfileRecord(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  payload: Record<string, unknown>,
  options: {
    stage: StatusStage | PortalAccountFailureStage;
    errorMessage: string;
  }
) {
  const cleaned = sanitizeUpdatePayload(payload);
  if (!Object.keys(cleaned).length) return;

  const { error } = await adminClient.from("profiles").update(cleaned).eq("id", userId);

  if (error) {
    throw new PortalFunctionError(options.errorMessage, {
      stage: options.stage,
      recoverable: true,
      detail: error.message
    });
  }
}

export async function insertPortalProfile(adminClient: ReturnType<typeof createClient>, payload: ProfileInsertPayload) {
  const { data, error } = await adminClient.from("profiles").insert(payload).select("*").single();
  if (error) {
    throw new PortalFunctionError("The login account was created but the portal profile could not be created. The incomplete account was rolled back.", {
      stage: "profile_creation",
      recoverable: true,
      detail: error.message
    });
  }
  return data;
}

export async function verifyPortalProfileExists(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (error) {
    throw new PortalFunctionError("The portal profile could not be verified after creation. The incomplete account was rolled back.", {
      stage: "profile_creation",
      recoverable: true,
      detail: error.message
    });
  }
  if (!data) {
    throw new PortalFunctionError("The portal profile could not be verified after creation. The incomplete account was rolled back.", {
      stage: "profile_creation",
      recoverable: true
    });
  }
  return data;
}

export async function updateAuthUser(adminClient: ReturnType<typeof createClient>, userId: string, payload: Record<string, unknown>) {
  const { error } = await adminClient.auth.admin.updateUserById(userId, payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function ensureLink(
  adminClient: ReturnType<typeof createClient>,
  table: "tutor_student_links" | "parent_student_links",
  payload: Record<string, unknown>
) {
  const { data: existingLink, error: existingCheckError } = await adminClient.from(table).select("id").match(payload).maybeSingle();

  if (existingCheckError && existingCheckError.message.toLowerCase().includes("multiple")) {
    return;
  }

  if (existingCheckError) {
    throw new Error(existingCheckError.message);
  }

  if (existingLink) {
    return;
  }

  const { error } = await adminClient.from(table).insert(payload);
  if (error && !error.message.toLowerCase().includes("duplicate")) {
    throw new Error(error.message);
  }
}

export async function removeLink(
  adminClient: ReturnType<typeof createClient>,
  table: "tutor_student_links" | "parent_student_links",
  payload: Record<string, unknown>
) {
  const { error } = await adminClient.from(table).delete().match(payload);

  if (error) {
    throw new Error(error.message);
  }
}

export async function createAuthUser(
  adminClient: ReturnType<typeof createClient>,
  values: {
    email: string;
    password: string;
    fullName: string;
    role: "tutor" | "parent";
    phone?: string;
    subjects?: string[];
    keyStages?: string[];
    status?: string;
  }
) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      full_name: values.fullName,
      role: values.role
    }
  });

  if (error || !data.user) {
    throw new PortalFunctionError("The login account could not be created.", {
      stage: "auth_creation",
      recoverable: true,
      detail: error?.message
    });
  }

  return data.user;
}

export function generateTemporaryPassword() {
  const digits = Array.from(crypto.getRandomValues(new Uint32Array(1)))[0] % 900000 + 100000;
  return `FlyBridge-${digits}`;
}

export async function updatePortalPassword(
  adminClient: ReturnType<typeof createClient>,
  values: { userId: string; password: string }
) {
  const { error } = await adminClient.auth.admin.updateUserById(values.userId, {
    password: values.password
  });

  if (error) {
    throw new Error(error.message);
  }

  await updateProfileRecord(
    adminClient,
    values.userId,
    {
    must_change_password: true,
    temporary_password_created_at: new Date().toISOString(),
    status: "active"
    },
    {
      stage: "validation",
      errorMessage: "The portal profile could not be updated after resetting the password."
    }
  );
}

export async function updatePortalUserProfile(
  adminClient: ReturnType<typeof createClient>,
  values: {
    userId: string;
    fullName?: string;
    email?: string;
    phone?: string;
    subjects?: string[];
    keyStages?: string[];
    status?: string;
  }
) {
  const existingProfile = await getProfileById(adminClient, values.userId);

  if (values.email && values.email !== existingProfile.email) {
    await updateAuthUser(adminClient, values.userId, {
      email: values.email,
      email_confirm: true
    });
  }

  const profilePayload: Record<string, unknown> = {};
  if (values.fullName !== undefined) profilePayload.full_name = values.fullName;
  if (values.email !== undefined) profilePayload.email = values.email;
  if (values.phone !== undefined) profilePayload.phone = values.phone;
  if (values.subjects !== undefined) profilePayload.subjects = values.subjects;
  if (values.keyStages !== undefined) profilePayload.key_stages = values.keyStages;
  if (values.status !== undefined) profilePayload.status = values.status;

  await updateProfileRecord(adminClient, values.userId, profilePayload, {
    stage: "validation",
    errorMessage: "The portal profile could not be updated."
  });
}

export async function setPortalUserStatus(
  adminClient: ReturnType<typeof createClient>,
  values: {
    userId: string;
    status: "active" | "inactive" | "suspended" | "archived";
    actorId?: string;
    archiveReason?: string | null;
  }
) {
  const currentProfile = await getProfileById(adminClient, values.userId);
  const nextStatus = values.status;
  const timestamp = new Date().toISOString();
  const patch = buildProfileStatusUpdate(currentProfile, {
    status: nextStatus,
    actorId: values.actorId ?? null,
    archiveReason: values.archiveReason ?? null,
    timestamp
  });

  await updateProfileRecord(adminClient, values.userId, patch, {
    stage: nextStatus === "archived" ? "archive" : "restore",
    errorMessage: `Unable to update the selected portal user to ${nextStatus}.`
  });
}

export async function setPortalAuthAccess(
  adminClient: ReturnType<typeof createClient>,
  values: {
    userId: string;
    disabled: boolean;
  }
) {
  const { error } = await adminClient.auth.admin.updateUserById(values.userId, buildAuthAccessUpdate(values.disabled));

  if (error) {
    throw new PortalFunctionError(
      values.disabled ? "The portal login could not be disabled after archiving the account." : "The portal login could not be re-enabled during restore.",
      {
        stage: values.disabled ? "archive" : "restore",
        recoverable: true,
        detail: error.message
      }
    );
  }
}

export async function getStudentById(adminClient: ReturnType<typeof createClient>, studentId: string) {
  const { data, error } = await adminClient.from("students").select("*").eq("id", studentId).maybeSingle();

  if (error || !data) {
    throw new PortalFunctionError("Unable to load the selected student record.", {
      stage: "validation",
      recoverable: true,
      detail: error?.message
    });
  }

  return data;
}

export async function setStudentStatus(
  adminClient: ReturnType<typeof createClient>,
  values: {
    studentId: string;
    status: "active" | "inactive" | "archived";
    actorId?: string;
  }
) {
  const currentStudent = await getStudentById(adminClient, values.studentId);
  const currentStatus = String(currentStudent.status ?? "active").toLowerCase();
  const nextStatus = values.status;

  const { error } = await adminClient
    .from("students")
    .update({
      status: nextStatus,
      active: nextStatus === "active",
      previous_status: nextStatus === "archived" ? currentStatus : currentStudent.previous_status ?? currentStatus,
      archived_at: nextStatus === "archived" ? new Date().toISOString() : null,
      archived_by: nextStatus === "archived" ? values.actorId ?? null : null,
      archive_reason: nextStatus === "archived" ? null : null
    })
    .eq("id", values.studentId);

  if (error) {
    throw new PortalFunctionError("Unable to update the selected student status.", {
      stage: nextStatus === "archived" ? "archive" : "restore",
      recoverable: true,
      detail: error.message
    });
  }
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

const inviteUserKeys = ["parent_id", "profile_id", "user_id", "auth_user_id", "invited_user_id"] as const;
const inviteEmailKeys = ["email", "parent_email", "invited_email"] as const;
const inviteIdentityKeys = ["id", "invite_code", "code"] as const;

async function fetchParentInvites(adminClient: ReturnType<typeof createClient>) {
  const { data, error } = await adminClient.from("parent_invites").select("*").limit(1000);
  if (error) {
    throw new PortalFunctionError("The parent invites table could not be inspected while archiving the account.", {
      stage: "archive",
      recoverable: true,
      detail: error.message
    });
  }
  return (data as ParentInviteRow[]) ?? [];
}

function inviteMatchesParent(row: ParentInviteRow, userId: string, email: string) {
  const userMatchColumns = inviteUserKeys.filter((key) => key in row && String(row[key] ?? "") === userId);
  const normalizedEmail = normalizeEmail(email);
  const emailMatchColumns = inviteEmailKeys.filter((key) => key in row && normalizeEmail(row[key]) === normalizedEmail);
  return {
    matches: userMatchColumns.length > 0 || emailMatchColumns.length > 0,
    matchingColumns: [...userMatchColumns, ...emailMatchColumns]
  };
}

function buildInviteRevokePayload(row: ParentInviteRow, adminUserId: string, reason?: string | null) {
  const payload: Record<string, unknown> = {};
  if ("status" in row) payload.status = "revoked";
  if ("revoked_at" in row) payload.revoked_at = new Date().toISOString();
  if ("revoked_by" in row) payload.revoked_by = adminUserId;
  if ("archived_at" in row && !("revoked_at" in row)) payload.archived_at = new Date().toISOString();
  if ("archived_by" in row && !("revoked_by" in row)) payload.archived_by = adminUserId;
  if ("archive_reason" in row) payload.archive_reason = reason ?? "Parent account archived";
  return payload;
}

function applyInviteIdentityMatch<T>(
  query: T,
  row: ParentInviteRow
): T & { eq: (column: string, value: unknown) => T } {
  const postgrest = query as T & { eq: (column: string, value: unknown) => T };
  for (const key of inviteIdentityKeys) {
    if (key in row && row[key] != null) {
      return postgrest.eq(key, row[key]);
    }
  }
  throw new PortalFunctionError("A matching parent invite could not be updated because it has no supported identifier column.", {
    stage: "archive",
    recoverable: true
  });
}

export async function revokeParentInvites(
  adminClient: ReturnType<typeof createClient>,
  values: {
    userId: string;
    email: string;
    adminUserId: string;
    reason?: string | null;
  }
): Promise<ParentInviteMutationResult> {
  const rows = await fetchParentInvites(adminClient);
  const matchedRows = rows
    .map((row) => ({ row, match: inviteMatchesParent(row, values.userId, values.email) }))
    .filter((entry) => entry.match.matches);

  if (!matchedRows.length) {
    return {
      reachedTable: true,
      matchedCount: 0,
      updatedCount: 0,
      matchingColumns: []
    };
  }

  let updatedCount = 0;
  const matchingColumns = new Set<string>();

  for (const entry of matchedRows) {
    entry.match.matchingColumns.forEach((column) => matchingColumns.add(column));
    const payload = buildInviteRevokePayload(entry.row, values.adminUserId, values.reason);
    if (!Object.keys(payload).length) continue;
    const query = applyInviteIdentityMatch(adminClient.from("parent_invites").update(payload), entry.row);
    const { error } = await query;
    if (error) {
      throw new PortalFunctionError("Outstanding parent invitations could not be archived.", {
        stage: "archive",
        recoverable: true,
        detail: error.message
      });
    }
    updatedCount += 1;
  }

  return {
    reachedTable: true,
    matchedCount: matchedRows.length,
    updatedCount,
    matchingColumns: [...matchingColumns]
  };
}

export async function deleteAuthUser(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function deletePortalProfile(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { error } = await adminClient.from("profiles").delete().eq("id", userId);
  if (error) {
    throw new Error(error.message);
  }
}

function getLinkTable(role: PortalRole): LinkTable {
  return role === "parent" ? "parent_student_links" : "tutor_student_links";
}

function getLinkPayload(role: PortalRole, userId: string, studentId: string) {
  return role === "parent"
    ? { parent_id: userId, student_id: studentId }
    : { tutor_id: userId, student_id: studentId };
}

async function rollbackProvisionedAccount(
  adminClient: ReturnType<typeof createClient>,
  values: { userId: string; role: PortalRole; studentId?: string; deleteAuthUser: boolean }
) {
  if (values.studentId) {
    try {
      await removeLink(adminClient, getLinkTable(values.role), getLinkPayload(values.role, values.userId, values.studentId));
    } catch {
      // Best effort cleanup only.
    }
  }

  try {
    await deletePortalProfile(adminClient, values.userId);
  } catch {
    // Best effort cleanup only.
  }

  if (values.deleteAuthUser) {
    try {
      await deleteAuthUser(adminClient, values.userId);
    } catch {
      // Best effort cleanup only.
    }
  }
}

export async function getAuthUserById(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error || !data.user) {
    throw new PortalFunctionError("The selected authentication user could not be found.", {
      stage: "validation",
      recoverable: true,
      detail: error?.message
    });
  }
  return data.user;
}

export async function ensureProfileMissing(adminClient: ReturnType<typeof createClient>, userId: string) {
  const { data, error } = await adminClient.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (error) {
    throw new PortalFunctionError("We could not check whether a portal profile already exists for this user.", {
      stage: "validation",
      recoverable: true,
      detail: error.message
    });
  }
  if (data) {
    throw new PortalFunctionError("A portal profile already exists for this authentication user.", {
      stage: "validation",
      recoverable: false
    });
  }
}

async function sendEmailWithResend(to: string, subject: string, html: string) {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const fromEmail = Deno.env.get("FROM_EMAIL");

  if (!resendKey || !fromEmail) {
    return {
      sent: false,
      message: "User created successfully, but no email was sent because RESEND_API_KEY or FROM_EMAIL is missing."
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject,
      html
    })
  });

  const responseBody = await response.text();

  if (!response.ok) {
    console.info("[FlyBridge resend] email delivery failed", {
      to,
      status: response.status,
      error: responseBody || response.statusText
    });
    return {
      sent: false,
      status: response.status,
      message: `User created successfully, but email delivery failed: ${responseBody || response.statusText}`
    };
  }

  let emailId: string | null = null;
  try {
    const parsed = JSON.parse(responseBody) as { id?: string };
    emailId = typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    emailId = null;
  }

  console.info("[FlyBridge resend] email delivery reached", {
    to,
    status: response.status,
    emailId
  });

  return {
    sent: true,
    status: response.status,
    emailId,
    message: "Email sent successfully."
  };
}

export async function sendPortalCredentialsEmail(values: {
  email: string;
  fullName?: string;
  role: "tutor" | "parent";
  password: string;
}) {
  const templateId = Deno.env.get("RESEND_WELCOME_TEMPLATE_ID");
  if (templateId) {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("FROM_EMAIL");

    if (!resendKey || !fromEmail) {
      return {
        sent: false,
        message: "User created successfully, but no email was sent because RESEND_API_KEY or FROM_EMAIL is missing."
      };
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [values.email],
        subject: `Your FlyBridge ${values.role === "parent" ? "Parent Portal" : "Tutor Portal"} login`,
        template: {
          id: templateId,
          variables: {
            ACCOUNT_NAME: values.fullName ?? "there",
            ACCOUNT_EMAIL: values.email,
            TEMPORARY_PASSWORD: values.password,
            ACCOUNT_ROLE: values.role,
            LOGIN_URL: "https://flybridgeeducation.co.uk/login",
            SUPPORT_EMAIL: "admin@flybridgeeducation.co.uk"
          }
        }
      })
    });

    const responseBody = await response.text();

    if (!response.ok) {
      console.info("[FlyBridge resend] welcome template delivery failed", {
        to: values.email,
        status: response.status,
        error: responseBody || response.statusText
      });
      return {
        sent: false,
        status: response.status,
        message: `User created successfully, but email delivery failed: ${responseBody || response.statusText}`
      };
    }

    let emailId: string | null = null;
    try {
      const parsed = JSON.parse(responseBody) as { id?: string };
      emailId = typeof parsed.id === "string" ? parsed.id : null;
    } catch {
      emailId = null;
    }

    console.info("[FlyBridge resend] welcome template delivered", {
      to: values.email,
      status: response.status,
      emailId
    });

    return {
      sent: true,
      status: response.status,
      emailId,
      message: "Email sent successfully."
    };
  }

  return sendEmailWithResend(
    values.email,
    `Your FlyBridge ${values.role === "parent" ? "Parent Portal" : "Tutor Portal"} login`,
    `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:24px;margin-bottom:12px">FlyBridge portal access</h1>
        <p>Hello ${values.fullName ?? "there"},</p>
        <p>Your FlyBridge ${values.role === "parent" ? "Parent Portal" : "Tutor Dashboard"} account is ready.</p>
        <p><strong>Email:</strong> ${values.email}<br /><strong>Temporary password:</strong> ${values.password}</p>
        <p><strong>Login URL:</strong> <a href="https://flybridgeeducation.co.uk/login">https://flybridgeeducation.co.uk/login</a></p>
        <p>Please sign in and change your password immediately after first login.</p>
        <p><strong>Forgot your password?</strong> <a href="https://flybridgeeducation.co.uk/forgot-password">Reset it here</a>.</p>
        <p>If you need help, contact FlyBridge at admin@flybridgeeducation.co.uk.</p>
      </div>
    `
  );
}

export async function sendPortalReminderEmail(values: {
  email: string;
  fullName?: string;
  role: "tutor" | "parent";
}) {
  return sendEmailWithResend(
    values.email,
    `Your FlyBridge ${values.role === "parent" ? "Parent Portal" : "Tutor Portal"} login reminder`,
    `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:24px;margin-bottom:12px">FlyBridge login reminder</h1>
        <p>Hello ${values.fullName ?? "there"},</p>
        <p>Your FlyBridge ${values.role === "parent" ? "Parent Portal" : "Tutor Dashboard"} account is active.</p>
        <p><strong>Login URL:</strong> <a href="https://flybridgeeducation.co.uk/login">https://flybridgeeducation.co.uk/login</a></p>
        <p><strong>Email:</strong> ${values.email}</p>
        <p><strong>Forgot your password?</strong> <a href="https://flybridgeeducation.co.uk/forgot-password">Reset it here</a>.</p>
        <p>If you need a new temporary password, please contact FlyBridge at admin@flybridgeeducation.co.uk.</p>
      </div>
    `
  );
}

export async function deletePortalUserSecure(
  adminClient: ReturnType<typeof createClient>,
  values: {
    userId: string;
    role: "parent" | "tutor";
    email?: string | null;
    adminUserId?: string | null;
  }
) {
  const runMutation = async (label: string, operation: PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await operation;
    if (error) {
      throw new Error(`${label}: ${error.message}`);
    }
  };

  if (values.role === "parent") {
    await runMutation("Unable to remove parent-student links", adminClient.from("parent_student_links").delete().eq("parent_id", values.userId));
    if (values.email && values.adminUserId) {
      await revokeParentInvites(adminClient, {
        userId: values.userId,
        email: values.email,
        adminUserId: values.adminUserId,
        reason: "Parent account permanently deleted"
      });
    }
  }

  if (values.role === "tutor") {
    await runMutation("Unable to remove tutor-student links", adminClient.from("tutor_student_links").delete().eq("tutor_id", values.userId));
    await runMutation("Unable to clear tutor references from lessons", adminClient.from("lessons").update({ tutor_id: null }).eq("tutor_id", values.userId));
    await runMutation("Unable to clear tutor references from lesson reports", adminClient.from("lesson_reports").update({ tutor_id: null }).eq("tutor_id", values.userId));
  }

  await runMutation("Unable to clear author references from articles", adminClient.from("articles").update({ author_id: null }).eq("author_id", values.userId));
  await runMutation("Unable to clear admin note creator references", adminClient.from("admin_notes").update({ created_by: null }).eq("created_by", values.userId));
  await runMutation("Unable to clear admin note updater references", adminClient.from("admin_notes").update({ updated_by: null }).eq("updated_by", values.userId));
  await runMutation("Unable to clear audit log actor references", adminClient.from("audit_logs").update({ actor_id: null }).eq("actor_id", values.userId));

  const { error: profileDeleteError } = await adminClient.from("profiles").delete().eq("id", values.userId);
  if (profileDeleteError) {
    throw new Error(profileDeleteError.message);
  }

  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(values.userId);
  if (authDeleteError) {
    throw new Error(authDeleteError.message);
  }
}

export async function provisionPortalAccount(values: ProvisionPortalAccountValues): Promise<ProvisionPortalAccountResult> {
  const studentId = values.studentId?.trim() || undefined;
  await requireStudentIfSupplied(values.adminClient, studentId);

  let userId = values.existingAuthUserId ?? "";
  const createdAuthUser = !values.skipAuthCreate;

  try {
    if (values.skipAuthCreate) {
      if (!values.existingAuthUserId) {
        throw new PortalFunctionError("The selected authentication user is missing its ID.", {
          stage: "validation",
          recoverable: false
        });
      }
      userId = values.existingAuthUserId;
    } else {
      const user = await createAuthUser(values.adminClient, {
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: values.role,
        phone: values.phone,
        subjects: values.subjects,
        keyStages: values.keyStages,
        status: "active"
      });
      userId = user.id;
    }

    await insertPortalProfile(values.adminClient, {
      id: userId,
      email: values.email,
      full_name: values.fullName,
      role: values.role,
      status: "active",
      must_change_password: true,
      temporary_password_created_at: new Date().toISOString(),
      phone: values.phone,
      subjects: values.subjects ?? [],
      key_stages: values.keyStages ?? []
    });

    await verifyPortalProfileExists(values.adminClient, userId);

    if (studentId) {
      try {
        await ensureLink(values.adminClient, getLinkTable(values.role), getLinkPayload(values.role, userId, studentId));
      } catch (error) {
        throw new PortalFunctionError(
          "The login account and profile were created, but the student link could not be created. The incomplete account was rolled back.",
          {
            stage: "student_link",
            recoverable: true,
            detail: error instanceof Error ? error.message : undefined
          }
        );
      }
    }
  } catch (error) {
    if (userId) {
      await rollbackProvisionedAccount(values.adminClient, {
        userId,
        role: values.role,
        studentId,
        deleteAuthUser: createdAuthUser
      });
    }

    if (error instanceof PortalFunctionError) {
      throw error;
    }

    throw new PortalFunctionError("The account could not be created.", {
      stage: createdAuthUser ? "profile_creation" : "validation",
      recoverable: true,
      detail: error instanceof Error ? error.message : undefined
    });
  }

  const emailResult = await sendPortalCredentialsEmail({
    email: values.email,
    fullName: values.fullName,
    role: values.role,
    password: values.password
  });

  const baseMessage = `${values.role === "parent" ? "Parent" : "Tutor"} account created successfully.`;

  try {
    await recordAuditLog(values.adminClient, {
      actorId: values.adminUserId,
      action: values.auditAction ?? "account_created",
      entityType: values.role,
      entityId: userId,
      metadata: {
        email: values.email,
        studentId: studentId ?? null,
        emailSent: emailResult.sent
      }
    });
  } catch (error) {
    return {
      success: true,
      role: values.role,
      userId,
      email: values.email,
      emailSent: emailResult.sent,
      stage: "audit_log",
      warning: "Account created, but the audit log entry could not be recorded.",
      message: `${baseMessage} Account created, but the audit log entry could not be recorded.`
    };
  }

  if (!emailResult.sent) {
    return {
      success: true,
      role: values.role,
      userId,
      email: values.email,
      emailSent: false,
      stage: "email_delivery",
      warning: "Account created, but the welcome email was not sent.",
      message: "Account created, but the welcome email was not sent."
    };
  }

  return {
    success: true,
    role: values.role,
    userId,
    email: values.email,
    emailSent: true,
    message: `${baseMessage} Welcome email sent successfully.`
  };
}
