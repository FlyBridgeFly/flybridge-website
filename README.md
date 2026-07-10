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

### Apply the portal profile migration

Before using parent or tutor account creation, apply the profile field migration so the `profiles` table includes:

- `must_change_password`
- `temporary_password_created_at`
- `last_login_at`
- `status`

Run:

```bash
supabase db push
```

If you are not using the CLI workflow, run the SQL from `supabase/migrations/20260710_portal_profile_fields.sql` in the Supabase SQL Editor instead.

### Create an admin user

1. Create the user manually in Supabase Auth.
2. Make sure that user has a matching row in the `profiles` table.
3. Set `profiles.role` to `admin`.
4. Sign in at `/login` and you should be redirected to `/admin`.

### Create a tutor user

1. Deploy the Edge Functions listed below.
2. Sign in as an admin.
3. Open `/admin` and use the `Tutor Portals` tab to create the tutor account securely.
4. The Edge Function creates the Supabase Auth user and upserts the matching `profiles` row with `role = tutor`.
5. If you leave the password blank in the admin form, FlyBridge generates a secure temporary password server-side.

Tutor and parent account creation now runs through Supabase Edge Functions so the service role key never reaches the browser.

### Create a parent user

1. Deploy the Edge Functions listed below.
2. Sign in as an admin.
3. Open `/admin` and use the `Parent Portals` tab to create the parent account securely.
4. The Edge Function creates the Supabase Auth user and upserts the matching `profiles` row with `role = parent`.
5. If you leave the password blank in the admin form, FlyBridge generates a secure temporary password server-side.

### Link tutor to student

1. Sign in as an admin.
2. Open `/admin`.
3. Open the `Tutor Portals` tab.
4. Use the link form to assign the tutor to a student.
5. This creates a row in `tutor_student_links` through the `link-tutor-to-student` Edge Function.

### Link parent to student

1. Sign in as an admin.
2. Open `/admin`.
3. Open the `Parent Portals` tab.
4. Create the parent account if needed.
5. Use the parent linking form to connect the parent to a student.
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
```

The browser continues to use `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` from `.env`. The service role key must only exist in Supabase Edge Function secrets.

If `RESEND_API_KEY` or `FROM_EMAIL` is missing, account creation and password resets still work, but the admin UI will report that the email was not sent.

### Safe account-creation testing

1. Use throwaway tutor and parent email addresses during initial testing.
2. Verify the new users appear in Supabase Auth after creation.
3. Verify the matching `profiles` row was created or updated with the correct role.
4. Verify the expected link row appears in `tutor_student_links` or `parent_student_links`.
5. Confirm a non-admin user receives an authorization error when trying to invoke the admin functions directly.
