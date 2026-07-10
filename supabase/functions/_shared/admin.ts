import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
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

export async function upsertProfile(adminClient: ReturnType<typeof createClient>, payload: Record<string, unknown>) {
  const cleaned = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== null));
  const { error } = await adminClient.from("profiles").upsert(cleaned, {
    onConflict: "id"
  });

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

export async function createAuthUser(
  adminClient: ReturnType<typeof createClient>,
  values: { email: string; password: string; fullName: string; role: "tutor" | "parent" }
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
    throw new Error(error?.message ?? "Unable to create the auth user.");
  }

  await upsertProfile(adminClient, {
    id: data.user.id,
    email: values.email,
    full_name: values.fullName,
    role: values.role,
    must_change_password: true,
    temporary_password_created_at: new Date().toISOString(),
    status: "active"
  });

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

  await upsertProfile(adminClient, {
    id: values.userId,
    must_change_password: true,
    temporary_password_created_at: new Date().toISOString(),
    status: "active"
  });
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

  if (!response.ok) {
    const text = await response.text();
    return {
      sent: false,
      message: `User created successfully, but email delivery failed: ${text || response.statusText}`
    };
  }

  return {
    sent: true,
    message: "Email sent successfully."
  };
}

export async function sendPortalCredentialsEmail(values: {
  email: string;
  fullName?: string;
  role: "tutor" | "parent";
  password: string;
}) {
  return sendEmailWithResend(
    values.email,
    `Your FlyBridge ${values.role === "parent" ? "Parent Portal" : "Tutor Portal"} login`,
    `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.6">
        <h1 style="font-size:24px;margin-bottom:12px">FlyBridge portal access</h1>
        <p>Hello ${values.fullName ?? "there"},</p>
        <p>Your FlyBridge ${values.role === "parent" ? "Parent Portal" : "Tutor Dashboard"} account is ready.</p>
        <p><strong>Email:</strong> ${values.email}<br /><strong>Temporary password:</strong> ${values.password}</p>
        <p>Please sign in at https://flybridgeeducation.co.uk/login and change your password after first login.</p>
      </div>
    `
  );
}
