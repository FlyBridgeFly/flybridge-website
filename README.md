# FlyBridge Website

Official Astro + Tailwind website for FlyBridge Education.

## Supabase Reporting Portal

The project includes a Supabase-backed reporting portal with these routes:

- `/login`
- `/admin`
- `/tutor`
- `/parent-portal`

### 1. Add Supabase env vars

Create a local `.env` file with:

```bash
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

These values are read by `src/lib/supabase.ts`. Do not hardcode them into source files.

### 2. Create an admin user

1. Create the user manually in Supabase Auth.
2. Make sure that user has a matching row in the `profiles` table.
3. Set `profiles.role` to `admin`.
4. Sign in at `/login` and you should be redirected to `/admin`.

### 3. Create a tutor user

1. Create the user manually in Supabase Auth.
2. Confirm the user has a matching `profiles` row.
3. Set `profiles.role` to `tutor`.
4. Use the admin dashboard to assign that tutor to one or more students through `tutor_student_links`.

Tutor and parent account creation is intentionally not handled in the frontend, because it would require insecure use of privileged Supabase APIs.

### 4. How to link tutor to student

1. Sign in as an admin.
2. Open `/admin`.
3. Use the `Assign tutor to student` form.
4. This creates a row in `tutor_student_links`.

### 5. How to link parent to student

Parents must also be created manually in Supabase Auth first.

1. Create the parent user in Supabase Auth.
2. Confirm the `profiles` row exists and set `profiles.role` to `parent`.
3. Insert a row into `parent_student_links` with the parent profile id and the student id.
4. The parent can then sign in at `/login` and view only linked students inside `/parent-portal`.

### 6. How to test with dummy data

Use real rows in your existing Supabase tables rather than local mocks.

Suggested test flow:

1. Create one student in `students`.
2. Create one tutor user in Supabase Auth and set `profiles.role = tutor`.
3. Create one parent user in Supabase Auth and set `profiles.role = parent`.
4. Link the tutor and parent to the student using `tutor_student_links` and `parent_student_links`.
5. Sign in as admin and create a lesson report, an assessment and a target.
6. Sign in as the tutor and confirm only assigned students appear.
7. Sign in as the parent and confirm the portal is read only and shows only linked student data.

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
