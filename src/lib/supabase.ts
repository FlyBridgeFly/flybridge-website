import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ProfileRole = "admin" | "tutor" | "parent" | string;

export interface ProfileRow {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role?: ProfileRole | null;
  phone?: string | null;
  subjects?: string[] | null;
  key_stages?: string[] | null;
  must_change_password?: boolean | null;
  temporary_password_created_at?: string | null;
  last_login_at?: string | null;
  status?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
  archive_reason?: string | null;
  previous_status?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface StudentRow {
  id: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  year_group?: string | null;
  school?: string | null;
  notes?: string | null;
  progress_status?: string | null;
  progress_status_note?: string | null;
  recall_average?: number | string | null;
  target_grade?: string | null;
  status?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
  archive_reason?: string | null;
  previous_status?: string | null;
  active?: boolean | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface LinkRow {
  id?: string;
  student_id?: string | null;
  tutor_id?: string | null;
  parent_id?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface LessonReportRow {
  id: string;
  student_id?: string | null;
  tutor_id?: string | null;
  title?: string | null;
  topic?: string | null;
  lesson_date?: string | null;
  summary?: string | null;
  strengths?: string | null;
  homework?: string | null;
  next_steps?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface LessonRow {
  id: string;
  student_id?: string | null;
  tutor_id?: string | null;
  lesson_title?: string | null;
  subject?: string | null;
  lesson_date?: string | null;
  start_time?: string | null;
  duration_minutes?: number | string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AssessmentRow {
  id: string;
  student_id?: string | null;
  created_by?: string | null;
  title?: string | null;
  score?: number | string | null;
  max_score?: number | string | null;
  notes?: string | null;
  assessment_date?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface TargetRow {
  id: string;
  student_id?: string | null;
  title?: string | null;
  target?: string | null;
  status?: string | null;
  notes?: string | null;
  due_date?: string | null;
  created_by?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
  [key: string]: unknown;
}

export interface ArticleRow {
  id: string;
  title?: string | null;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  author_id?: string | null;
  status?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AdminNoteRow {
  id: string;
  entity_type?: string | null;
  entity_id?: string | null;
  note?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  [key: string]: unknown;
}

export interface AuditLogRow {
  id: string;
  actor_id?: string | null;
  action?: string | null;
  entity_type?: string | null;
  entity_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string | null;
  [key: string]: unknown;
}

let browserClient: SupabaseClient | undefined;

function getSupabaseEnv() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY. Add both variables before using the reporting portal."
    );
  }

  return { url, anonKey };
}

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseEnv();

  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return browserClient;
}
