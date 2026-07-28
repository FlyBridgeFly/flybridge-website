# FlyBridge Website

Official Astro + Tailwind website for FlyBridge Education.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

This project is configured for static output and is compatible with Cloudflare Pages.

## Supabase Reporting Portal

The project includes a Supabase-backed portal with these routes:

- `/login`
- `/admin`
- `/tutor`
- `/parent-portal`
- `/forgot-password`
- `/change-password`
- `/reset-password`

### Frontend environment variables

Create a local `.env` file with:

```bash
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These values are read by `src/lib/supabase.ts`. Do not hardcode them into source files.

### Supabase Auth URL settings

Configure these values in the Supabase dashboard for the production project:

- Site URL: `https://flybridgeeducation.co.uk`
- Allowed redirect URLs:
  - `https://flybridgeeducation.co.uk/reset-password`
  - `https://flybridgeeducation.co.uk/reset-password/`
  - `https://www.flybridgeeducation.co.uk/reset-password`
  - `https://www.flybridgeeducation.co.uk/reset-password/`
  - `http://localhost:4321/reset-password`
  - `http://localhost:4321/reset-password/`

The forgot-password flow calls:

```ts
supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});
```

This keeps production reset links on `https://flybridgeeducation.co.uk/reset-password` while still allowing local testing on `http://localhost:4321/reset-password`.

### Apply the portal migrations

Before using the full admin control centre, apply the latest portal migrations so the database includes:

- profile auth-state fields
- admin notes
- audit logs
- expanded account and student status fields
- parent invite support used by the admin workspace

Run:

```bash
supabase db push
```

The current repo migrations include:

- `supabase/migrations/20260710093000_portal_profile_fields.sql`
- `supabase/migrations/20260710120000_portal_auth_state_sync.sql`
- `supabase/migrations/20260711103000_admin_control_centre.sql`

### Create an admin user

1. Create the user manually in Supabase Auth.
2. Make sure that user has a matching row in the `profiles` table.
3. Set `profiles.role` to `admin`.
4. Sign in at `/login` and you should be redirected to `/admin`.

### Create a tutor user

1. Deploy the Edge Functions listed below.
2. Sign in as an admin.
3. Open `/admin` and use the tutor account form in `Settings`.
4. The Edge Function creates the Supabase Auth user and upserts the matching `profiles` row with `role = tutor`.
5. If you leave the password blank in the admin form, FlyBridge generates a secure temporary password server-side.

Tutor and parent account creation now runs through Supabase Edge Functions so the service role key never reaches the browser.

### Create a parent user

1. Deploy the Edge Functions listed below.
2. Sign in as an admin.
3. Open `/admin` and use the parent account form in `Settings`.
4. The Edge Function creates the Supabase Auth user and upserts the matching `profiles` row with `role = parent`.
5. If you leave the password blank in the admin form, FlyBridge generates a secure temporary password server-side.

### Link tutor to student

1. Sign in as an admin.
2. Open `/admin`.
3. Open `Settings`.
4. Use the tutor link form or the tutor detail drawer to assign the tutor to one or more students.
5. This creates a row in `tutor_student_links` through the `link-tutor-to-student` Edge Function.

### Link parent to student

1. Sign in as an admin.
2. Open `/admin`.
3. Open `Settings`.
4. Create the parent account if needed.
5. Use the parent linking form or the parent detail drawer to connect the parent to one or more students.
6. This creates a row in `parent_student_links` through the `link-parent-to-student` Edge Function.

### Test with dummy data safely

Use real rows in your existing Supabase tables rather than local mocks.

Suggested test flow:

1. Create one student in `students`.
2. Create a throwaway admin account in Supabase Auth and set `profiles.role = admin`.
3. Sign in as that admin and use the dashboard to create one tutor account and one parent account.
4. Link both accounts to the same student from the relevant admin tabs.
5. Generate a parent invite code to confirm the invite function can insert into `parent_invites`.
6. Create a lesson report, an assessment and at least one target for the student.
7. Sign in as the tutor and confirm only assigned students appear.
8. Sign in as the parent and confirm the portal is read only and shows only linked student data.

### Deploy Supabase Edge Functions

This repo includes these Edge Functions:

- `create-tutor`
- `create-parent`
- `reset-portal-password`
- `link-parent-to-student`
- `link-tutor-to-student`
- `generate-parent-invite`
- `update-portal-user`
- `set-portal-user-status`
- `archive-portal-user`
- `delete-portal-user`
- `resend-portal-welcome`
- `repair-portal-user`

Deploy them from the repository root after logging into the Supabase CLI and linking your project:

```bash
supabase login
supabase link --project-ref your-project-ref
supabase functions deploy create-tutor
supabase functions deploy create-parent
supabase functions deploy reset-portal-password
supabase functions deploy link-parent-to-student
supabase functions deploy link-tutor-to-student
supabase functions deploy generate-parent-invite
supabase functions deploy update-portal-user
supabase functions deploy set-portal-user-status
supabase functions deploy archive-portal-user
supabase functions deploy delete-portal-user
supabase functions deploy resend-portal-welcome
supabase functions deploy repair-portal-user
```

If you prefer, you can also deploy everything in one pass:

```bash
supabase functions deploy
```

### Required Edge Function secrets

Set these secrets in Supabase before deploying or invoking the functions:

```bash
supabase secrets set SUPABASE_URL=your_supabase_project_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set FROM_EMAIL=hello@yourdomain.com
supabase secrets set RESEND_WELCOME_TEMPLATE_ID=your_published_resend_template_id
```

The browser continues to use `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` from `.env`. The service role key must only exist in Supabase Edge Function secrets.

If `RESEND_API_KEY` or `FROM_EMAIL` is missing, account creation and password resets still work, but the admin UI will report that the email was not sent.

`RESEND_WELCOME_TEMPLATE_ID` is optional. If present, FlyBridge uses a published Resend template for welcome emails. If it is absent, the Edge Functions send the built-in HTML email instead.

### Safe account-creation testing

1. Use throwaway tutor and parent email addresses during initial testing.
2. Verify the new users appear in Supabase Auth after creation.
3. Verify the matching `profiles` row was created or updated with the correct role.
4. Verify the expected link row appears in `tutor_student_links` or `parent_student_links`.
5. Confirm a non-admin user receives an authorization error when trying to invoke the admin functions directly.

### Exact post-update commands

Run these after pulling the latest repo changes:

```bash
supabase db push
supabase functions deploy create-tutor
supabase functions deploy create-parent
supabase functions deploy reset-portal-password
supabase functions deploy link-parent-to-student
supabase functions deploy link-tutor-to-student
supabase functions deploy generate-parent-invite
supabase functions deploy update-portal-user
supabase functions deploy set-portal-user-status
supabase functions deploy archive-portal-user
supabase functions deploy delete-portal-user
supabase functions deploy resend-portal-welcome
supabase functions deploy repair-portal-user

### Repairing an orphan portal Auth user

Preferred repair path:

1. Deploy `repair-portal-user`.
2. Invoke it as an admin with:
   - `authUserId`
   - `fullName`
   - `role`
   - optional `email`
   - optional `studentId`
3. The function verifies the Auth user exists, confirms no matching profile exists, creates the missing profile, optionally links a student, rotates the temporary password, and resends the welcome email.

Simpler fallback:

1. Delete the orphaned user from Supabase Authentication.
2. Recreate the account from the FlyBridge admin portal after the fixed `create-parent` or `create-tutor` function is deployed.
```
