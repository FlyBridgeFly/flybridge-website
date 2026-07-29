export type PortalStatus = "active" | "inactive" | "suspended" | "archived";

export interface ProfileStatusSource {
  status?: string | null;
  previous_status?: string | null;
  archived_at?: string | null;
  archived_by?: string | null;
  archive_reason?: string | null;
  updated_at?: string | null;
  email?: string | null;
  full_name?: string | null;
  role?: string | null;
  [key: string]: unknown;
}

export function sanitizeUpdatePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

export function buildProfileStatusUpdate(
  currentProfile: ProfileStatusSource,
  values: {
    status: PortalStatus;
    actorId?: string | null;
    archiveReason?: string | null;
    timestamp: string;
  }
) {
  const currentStatus = String(currentProfile.status ?? "active").toLowerCase();
  const nextStatus = values.status;

  const payload: Record<string, unknown> = {
    status: nextStatus,
    previous_status: nextStatus === "archived" ? currentStatus : currentProfile.previous_status ?? currentStatus,
    archived_at: nextStatus === "archived" ? values.timestamp : null,
    archived_by: nextStatus === "archived" ? values.actorId ?? null : null
  };

  if ("archive_reason" in currentProfile || nextStatus === "archived" || currentProfile.archive_reason != null) {
    payload.archive_reason = nextStatus === "archived" ? values.archiveReason ?? null : null;
  }

  if ("updated_at" in currentProfile) {
    payload.updated_at = values.timestamp;
  }

  return payload;
}

export function buildAuthAccessUpdate(disabled: boolean) {
  return {
    ban_duration: disabled ? "876000h" : "none"
  };
}
