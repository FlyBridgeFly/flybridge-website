# FlyBridge Portal Authentication Testing

## Environment notes

- Local production build: verified with `npm run build`
- Local dev server: starts successfully in an elevated shell
- Full live browser-driven portal testing is currently blocked in this Codex environment because:
  - the in-app browser backend is unavailable
  - no parent, tutor, or admin test credentials are present locally
  - the local dev server is not reachable from the non-elevated session used for normal browser/curl checks

## Source-level auth trace completed

- [x] Temporary-password login path traced from `/login`
- [x] `must_change_password` redirect path traced to `/change-password`
- [x] Password update path traced through `supabase.auth.updateUser()`
- [x] Post-password-change profile sync traced and hardened
- [x] Role routing traced for admin, tutor, and parent dashboards
- [x] Edge Function responses audited for `create-parent`, `create-tutor`, and `reset-portal-password`

## Runtime verification completed in this session

- [x] `npm run build` passes
- [ ] Local browser session opened successfully
- [ ] Local auth routes interacted with in a running browser

## Authentication flow checklist

## Temporary parent password diagnostic

1. [ ] Parent created with temporary password
2. [ ] Parent signs in
3. [ ] Redirected to `/change-password`
4. [ ] Password updated
5. [ ] RPC clears `must_change_password`
6. [ ] Parent redirected to `/parent-portal`
7. [ ] Parent signs out
8. [ ] Parent signs in with new password
9. [ ] Parent goes directly to `/parent-portal`

### Login

- [ ] Parent login
- [ ] Tutor login
- [ ] Admin login

### Password flows

- [ ] Temporary password first login
- [ ] Forced redirect to `/change-password`
- [ ] Successful password save through Supabase Auth
- [ ] `profiles.must_change_password` changed to `false`
- [ ] `profiles.last_login_at` updated after successful password change
- [ ] Redirect to the correct dashboard after password change
- [ ] Future login skips `/change-password`
- [ ] Forgot password request
- [ ] Reset password from email link

### Role routing

- [ ] Admin routes only to `/admin`
- [ ] Tutor routes only to `/tutor`
- [ ] Parent routes only to `/parent-portal`
- [ ] No redirect loops
- [ ] Missing profile shows a proper error state

## Recommended live verification steps

1. Apply the new Supabase migration files.
2. Run the site locally with real Supabase env vars.
3. Test one parent account with a temporary password.
4. Confirm the password-change success message appears before redirect.
5. Confirm the parent lands on `/parent-portal`.
6. Sign out and sign back in with the new password.
7. Repeat the same checks for tutor and admin accounts.
