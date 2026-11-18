# Connect the private CareerLens workspace

The application now supports Supabase accounts and private reports. The migration must be applied in your own project before cloud data features work. A publishable key cannot execute database migrations, so no database password or service-role key is needed by the app.

## 1. Apply the migration

1. Open your CareerLens AI project in the Supabase dashboard.
2. Open **SQL Editor → New query**.
3. In VS Code, open `supabase/migrations/202611120001_career_workspace.sql` and copy its entire contents.
4. Paste into the SQL Editor and choose **Run**. Apply this migration once; it is transactional. If an error appears, do not run partial fragments; resolve it and retry the complete migration.
5. Under **Table Editor**, confirm the ten tables: profiles, resumes, resume_analyses, job_matches, interview_sessions, interview_answers, cover_letters, career_roadmaps, roadmap_tasks, usage_events.

The migration enables RLS on all ten tables, restricts ownership to the signed-in user, adds timestamps and indexes, and uses composite foreign keys to prevent cross-user parent references. It creates profiles for new/existing auth users and a narrow `delete_own_account()` RPC that can delete only its authenticated caller. Deleting an account cascades all its app data. The app never uses an administrative key.

## 2. Set authentication URLs

In **Authentication → URL Configuration**:

- Local Site URL: `http://localhost:3000`
- Add these exact Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/callback?next=/dashboard`
  - `http://localhost:3000/auth/callback?next=/update-password`
- At deployment, set Site URL to the deployed HTTPS origin and add the equivalent production callback URLs.

Keep email/password sign-in enabled. The default confirmation and recovery email templates use Supabase’s confirmation URL; PKCE flows complete through `/auth/callback`. Open sign-up confirmation or reset links in the same browser that initiated the flow so its PKCE verifier cookie is available. Expired links show a retry message. If you customize email templates to use `token_hash` directly, implement a matching OTP confirmation handler first; this app currently uses code exchange.

Configure production SMTP in Supabase before a public launch; hosted default email delivery is limited. Your password is entered only into the app’s Supabase Auth form, never into source files or chat.

## 3. Optional Google sign-in

1. Create a Google Cloud OAuth web client in your own Google project.
2. Add the redirect URI shown by Supabase’s Google provider screen (the Supabase `/auth/v1/callback` URL, not the app URL).
3. In **Authentication → Sign In / Providers → Google**, enable the provider and enter the Google client ID and secret privately in the Supabase dashboard.
4. Keep the app callback URLs in the Supabase allowlist above.

The app has a working OAuth entry point/callback, but Google cannot authenticate until you complete provider setup. Email/password does not depend on Google.

## 4. Environment and local server

`.env.local` already contains the supplied project URL and public key. The code accepts either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`; if both are set, the publishable variable wins. Never put a secret/service-role key in either public variable.

From PowerShell:

```powershell
Set-Location 'D:\Projects\CareerLens AI'
npm.cmd run dev
```

Restart an already-running server after changing environment values. Visit `http://localhost:3000/signup`, register your own account, confirm the email, and sign in. Anonymous visitors are redirected from private workspace routes to `/login`. `/demo` and its tools remain public even without credentials.

On Vercel, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or the legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) under **Project Settings → Environment Variables**. Select **Production** for the public deployment and **Preview** if you also use preview deployments. Redeploy after saving. Next.js embeds these values into the sign-up page's JavaScript at build time.

## 5. Verify with your own account

1. Sign up and verify your email, then sign in at `/login`.
2. Visit `/settings`, save a display name, and check the welcome message on `/dashboard`.
3. On `/resume`, choose **Explore sample**, run the sample report, then **Save to account**. The saved report stays labeled SAMPLE and does not count toward real dashboard scores.
4. Open `/history`, search/filter, expand the report, export it, then delete it.
5. To store your own resume text explicitly, switch to live mode and expand **Use or save resume text (optional)**. Saving a report never automatically saves the original resume. Use this panel to reload saved text. Saved resume text also appears in History under Saved resume text, where you can export or delete it.
6. Sign out, then verify private routes redirect and private APIs return 401. A second account must not see the first account’s rows.
7. Test password reset using a real reset email in the initiating browser.
8. Test permanent account deletion only with a disposable account you created for that purpose. It is irreversible and deletes all that account’s cloud data.

The automated database tests execute the migration against local PostgreSQL and verify RLS isolation, ownership forgery rejection, composite foreign keys, anonymous denial, and self-only cascade deletion. They do not apply SQL to your hosted project or replace a real email/OAuth test.

## 6. Live AI

Live requests now authenticate the Supabase user, use their UUID as the Upstash rate-limit key, and record a usage attempt before calling OpenAI. Configure `OPENAI_API_KEY`, `OPENAI_MODEL`, `UPSTASH_REDIS_REST_URL`, and `UPSTASH_REDIS_REST_TOKEN` server-side. The old `AI_ACCESS_TOKEN` is no longer used. Missing credentials/migrations fail with explicit errors; demo data is never substituted.

PDF extraction also requires a verified session. Extraction still needs hosting traffic/request-size controls before a broad public launch. Upstash remains the authoritative quota counter; database usage events are user-readable records, not the quota source. Attempts, including provider failures, count against ten requests per user per hour.

## Phase 3 tools and second migration

Live interviews, cover letters and career roadmaps are implemented. Apply the new migration `supabase/migrations/202611120002_career_tools.sql` once, after the original migration. It preserves existing data and adds atomic interview/roadmap saves and task progress updates. Do not rerun the first migration. See [PHASE3.md](PHASE3.md) for credential setup and tool workflows.

Cloud history returns up to the newest 100 items per source; pagination is future work. Dashboard scores derive from saved non-demo scored reports, not an invented readiness percentage. Demo history remains separate browser-local data. Confirmation/recovery emails and Google provider configuration must be tested with your own account; no authentication settings or hosted SQL are changed by the local source update.
