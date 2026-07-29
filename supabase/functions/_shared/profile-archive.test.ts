import { buildAuthAccessUpdate, buildProfileStatusUpdate, sanitizeUpdatePayload } from "./profile-archive.ts";

Deno.test("archive payload preserves required identity fields by omission", () => {
  const payload = buildProfileStatusUpdate(
    {
      email: "parent@example.com",
      full_name: "Parent Example",
      role: "parent",
      status: "active",
      archive_reason: null,
      updated_at: "2026-07-28T20:00:00.000Z"
    },
    {
      status: "archived",
      actorId: "admin-user-id",
      archiveReason: "Parent requested a pause",
      timestamp: "2026-07-28T21:00:00.000Z"
    }
  );

  if ("email" in payload) throw new Error("Archive payload must not overwrite email.");
  if ("full_name" in payload) throw new Error("Archive payload must not overwrite full_name.");
  if ("role" in payload) throw new Error("Archive payload must not overwrite role.");
  if (payload.status !== "archived") throw new Error("Archive payload should set archived status.");
  if (payload.archived_by !== "admin-user-id") throw new Error("Archive payload should store archived_by.");
  if (payload.archive_reason !== "Parent requested a pause") throw new Error("Archive payload should store archive reason.");
});

Deno.test("restore payload clears archive metadata without dropping identity fields", () => {
  const payload = buildProfileStatusUpdate(
    {
      email: "parent@example.com",
      full_name: "Parent Example",
      role: "parent",
      status: "archived",
      previous_status: "active",
      archive_reason: "Requested pause",
      updated_at: "2026-07-28T20:00:00.000Z"
    },
    {
      status: "active",
      actorId: "admin-user-id",
      timestamp: "2026-07-28T21:00:00.000Z"
    }
  );

  if (payload.status !== "active") throw new Error("Restore payload should reactivate the account.");
  if (payload.archived_at !== null) throw new Error("Restore payload should clear archived_at.");
  if (payload.archived_by !== null) throw new Error("Restore payload should clear archived_by.");
  if (payload.archive_reason !== null) throw new Error("Restore payload should clear archive_reason.");
  if ("email" in payload) throw new Error("Restore payload must not overwrite email.");
});

Deno.test("sanitizeUpdatePayload removes undefined but preserves null for reversible archive fields", () => {
  const payload = sanitizeUpdatePayload({
    status: "active",
    archived_at: null,
    archive_reason: null,
    email: undefined
  });

  if (!("archived_at" in payload) || payload.archived_at !== null) {
    throw new Error("Null archive fields must remain so restore can clear them.");
  }
  if ("email" in payload) {
    throw new Error("Undefined identity fields must be omitted.");
  }
});

Deno.test("auth access payload disables and re-enables login without changing email", () => {
  const disabled = buildAuthAccessUpdate(true);
  const enabled = buildAuthAccessUpdate(false);

  if (disabled.ban_duration !== "876000h") throw new Error("Archive should ban the auth user.");
  if (enabled.ban_duration !== "none") throw new Error("Restore should remove the auth ban.");
});
