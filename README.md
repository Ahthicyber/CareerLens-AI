# CareerLens AI

Your next career move, powered by AI.

A career copilot portfolio project built with Next.js, React and TypeScript. This delivery implements all five career tools plus Supabase authentication and persistence. Resume analysis and job matching support real OpenAI requests; public demos at `/demo` require no keys. Public samples remain separate from personalized results. See [PHASE3.md](PHASE3.md) for the new tools and second migration.

For a credential-free walkthrough, run the app and open [the demo dashboard](http://localhost:3000/demo) or [the sample resume analyzer](http://localhost:3000/demo/resume).

## Features

- Responsive landing page, dashboard, navigation and persistent light/dark preference.
- PDF resume extraction (5 MB limit), pasted text, explicit provider consent.
- Resume scores, skill badges, strengths, gaps, section feedback and grounded rewrites.
- Role-specific mock interviews with deterministic rubric scoring and saved per-question feedback.
- Grounded, editable cover letters with tone controls, copy, download and save.
- Weekly roadmaps with budget checks, saved milestones and persistent task completion.
- Job-match evidence and component assessments with deterministic weighted scoring.
- Fixed fictional samples, clearly separated from live AI. Failures never substitute samples.
- Explicit browser-local report saving, searchable/filterable history, deletion, JSON and print-to-PDF export.
- Supabase email/password sign-in, Google OAuth entry/callback, password reset and logout.
- Protected account routes, explicit cloud reports/resume text, profile settings and account deletion.
- Persistent per-user Upstash rate limits, usage events and ten-table PostgreSQL migration with RLS.

## Stack and architecture

Next.js App Router, strict TypeScript, React, Tailwind CSS, an owned shadcn/ui-style Button using Radix Slot/CVA, Lucide, Motion, Recharts, Zod, OpenAI SDK, pdf-parse, Upstash, Vitest and ESLint. Installed exact versions are locked in package-lock.json. Supabase Auth/SSR and PostgreSQL provide verified sessions, private records, and row-level ownership. See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to apply the migration and configure your project.

```text
Browser -> Next.js -> verified Supabase session -> input validation
                   -> PDF text extraction (in memory)
                   -> per-user Upstash quota -> usage event
                   -> OpenAI structured responses -> Zod -> report
Explicit account Save -> Supabase PostgreSQL with RLS
Demo Save -> separate browser localStorage
```

## Run locally

Use Node.js 22.16+ or a supported newer LTS (Node 24 used for development) and npm.

```powershell
Set-Location 'D:\Projects\CareerLens AI'
npm.cmd ci
if (!(Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm.cmd run dev
```

Use npm.cmd in Windows PowerShell to avoid execution-policy errors. On macOS/Linux, use npm and copy .env.example only if .env.local does not already exist. Open http://localhost:3000; the public demo is at /demo and needs no credentials. Private workspace routes require sign-in.

For accounts, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported). Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) to run the SQL migration and allow callback URLs. Without those settings, authentication shows a configuration error; demo pages still work.

For live AI configure `OPENAI_API_KEY`, `OPENAI_MODEL`, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. Requests verify the Supabase user, limit their UUID to ten attempts per hour, and record a usage event. The old owner access token is no longer used. Missing configuration/migrations fail closed. No server secret uses a `NEXT_PUBLIC_` prefix.

## AI and scoring

`lib/ai/client.ts` sends only bounded document text to OpenAI’s Responses API with `store: false`, structured Zod schemas, a 45-second request timeout and one SDK transient retry. System instructions treat documents as untrusted data and forbid inventing credentials. Outputs render as React text, never executable HTML. Prompt instructions reduce injection risk but cannot guarantee model behavior; verify generated content.

Job compatibility uses **required skills 40%, experience 25%, preferred skills 15%, education 10%, keywords/responsibilities 10%**. The AI supplies independent component assessments and evidence. `lib/scoring.ts` computes the final rounded weighted average. A category is inapplicable only when the job omits it. Applicable categories with no resume evidence remain scored gaps. Inapplicable weights are excluded and remaining weights normalized; all inapplicable returns zero. These scores do not predict hiring outcomes. ATS scores are unofficial AI estimates.

The live quota is ten attempts per user per sliding hour, persisted in Upstash. Failed provider calls consume an attempt. Upstash failures fail closed. Requests record a feature usage event in Supabase before calling the provider; no resume text is included in usage records.

## Tests

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

Tests cover input/file restrictions, deterministic scoring and missing categories, schema validation, fixed demo data, endpoint authorization/configuration, usage limits and provider errors. Provider tests mock paid services. Tests also execute the full migration in local PostgreSQL (PGlite), verify RLS on all ten tables, reject forged ownership/cross-owner references, and verify self-only deletion cascades. They do not establish real provider reliability or validate a hosted email/OAuth flow. Live credentials are not included.

## Deploy with your accounts

1. Use the existing GitHub remote or connect your own repository.
2. Review and push the release commit. Keep environment files, resumes, credentials, and saved personal reports out of source control.
3. Create a Supabase project and apply `supabase/migrations/202611120001_career_workspace.sql` in SQL Editor. This creates all ten requested tables and their ownership policies. Then apply `supabase/migrations/202611120002_career_tools.sql` to enable transactional interview/roadmap saves and progress updates. Detailed instructions are in [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
4. Configure your Supabase Auth site URL and app `/auth/callback` redirects for local and production origins. Enable Google with your own Google Cloud OAuth client if desired. Email confirmation and recovery use PKCE and must be opened in the initiating browser.
5. Import the repository into Vercel, choose the Next.js preset and npm. The default `npm run build` is supported. Do not use a static export: PDF extraction and live AI need Node route handlers.
6. Add the environment values listed above in Vercel. Use a separate Upstash database/token as appropriate. Add the Supabase project URL and publishable key. Without live configuration the public demo still works.
7. Deploy and set `NEXT_PUBLIC_APP_URL` to the deployed URL. If you change environment values, redeploy.
8. Test the landing page, theme toggle, dashboard, sample reports, history saving/deletion, PDF extraction, unauthorized live access, and a consented real analysis. Check that a provider outage shows an error. Add hosting firewall/traffic controls for the authenticated extraction endpoint before broad release.

## Privacy and limitations

No uploaded PDFs are stored. Text exists in request memory and browser component state. Saved reports can include personal information; demo local storage is readable by this browser profile. Signed-in reports are private Supabase rows under RLS. Save only on trusted devices. Clear device reports in demo Settings, individual cloud reports in History, or all account data by deleting the account in private Settings. See `/privacy` for the in-app notice. Provider API data-retention policies still apply despite `store: false`.

Only text-based PDFs are supported; no OCR and no password input. PDF parsing is synchronous request work, capped by upload size and deployment timeouts. PDFs over 25 pages are rejected after extraction; unusual files can still exhaust resources, so hosting controls matter. Vercel plan request-size limits may be lower than the app’s 5 MB cap; if uploads are rejected by the platform, use pasted text. Production deployments should align the UI limit with their platform or adopt direct private uploads with immediate deletion.

Supabase accounts and cloud reports are implemented, but the owner must apply the migration and configure email/Google in the dashboard. Run hosted sign-up and password recovery after setting the callback URLs and applying the migrations.

Interview, cover letter and roadmap tools now support live generation, validated output and explicit saves. Apply the second migration before saving interviews or roadmaps. The private dashboard includes saved interview scores; public demo trend data is illustrative. Cloud history returns up to 100 newest items per source. Reports and original resume text are saved separately. JSON and browser print/PDF exports are supported. No external deployment or paid AI call was performed; browser visual QA is unverified.

## Future work

Add hosted email/OAuth and browser end-to-end tests, real provider evaluations, history pagination, dashboard trend charts, autosaved interview drafts, screenshots and deployment monitoring.

## License

MIT. See LICENSE.

## Implementation references

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [pdf-parse maintained source](https://github.com/mehmet-kozan/pdf-parse)
