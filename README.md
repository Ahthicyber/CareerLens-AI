# CareerLens AI

Your next career move, powered by AI.

A career copilot portfolio project built with Next.js, React and TypeScript. This delivery implements **Phases 1 and 2** of the supplied brief. Resume analysis and job matching support real OpenAI requests; public demos require no keys. Other tools are clearly labeled interactive previews.

**Live demo:** add your Vercel URL after deployment. **Screenshots:** run locally, capture `/`, `/dashboard`, and a sample `/resume` report, and add the real images under `public/screenshots/`.

## Features

- Responsive landing page, dashboard, navigation and persistent light/dark preference.
- PDF resume extraction (5 MB limit), pasted text, explicit provider consent.
- Resume scores, skill badges, strengths, gaps, section feedback and grounded rewrites.
- Job-match evidence and component assessments with deterministic weighted scoring.
- Fixed fictional samples, clearly separated from live AI. Failures never substitute samples.
- Explicit browser-local report saving, searchable/filterable history, deletion, JSON and print-to-PDF export.
- Server-side access gate and persistent Upstash rate limit for paid requests.

## Stack and architecture

Next.js App Router, strict TypeScript, React, Tailwind CSS, an owned shadcn/ui-style Button using Radix Slot/CVA, Lucide, Motion, Recharts, Zod, OpenAI SDK, pdf-parse, Upstash, Vitest and ESLint. Installed exact versions are locked in package-lock.json. Supabase is reserved for Phase 4, not implemented yet.

```text
Browser → Next.js pages → upload route → in-memory PDF extraction
                       → analyze route → access gate → input validation
                                       → Upstash usage limit
                                       → OpenAI structured responses
                                       → Zod validation → weighted score → report
Explicit Save → browser localStorage (no cloud sync)
Demo button → deterministic fictional fixtures (no provider request)
```

## Run locally

Use Node.js 22.16+ or a supported newer LTS (Node 24 used for development) and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

On Windows PowerShell use `npm.cmd` if script execution is restricted, and `Copy-Item .env.example .env.local`. Open http://localhost:3000. The demo needs no environment variables.

For live AI configure `OPENAI_API_KEY`, `OPENAI_MODEL`, a long random `AI_ACCESS_TOKEN`, and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`. Enter the owner token into the tool form; it stays in component memory. Never distribute this shared token publicly. API endpoints refuse requests if the token or persistent limiter configuration is missing. No secret uses a `NEXT_PUBLIC_` prefix.

`NEXT_PUBLIC_APP_URL` documents the deployment origin. Supabase public variables are placeholders for Phase 4 and currently unused. Optional Gemini support is not implemented.

## AI and scoring

`lib/ai/client.ts` sends only bounded document text to OpenAI’s Responses API with `store: false`, structured Zod schemas, a 45-second request timeout and one SDK transient retry. System instructions treat documents as untrusted data and forbid inventing credentials. Outputs render as React text, never executable HTML. Prompt instructions reduce injection risk but cannot guarantee model behavior; verify generated content.

Job compatibility uses **required skills 40%, experience 25%, preferred skills 15%, education 10%, keywords/responsibilities 10%**. The AI supplies independent component assessments and evidence. `lib/scoring.ts` computes the final rounded weighted average. A category is inapplicable only when the job omits it. Applicable categories with no resume evidence remain scored gaps. Inapplicable weights are excluded and remaining weights normalized; all inapplicable returns zero. These scores do not predict hiring outcomes. ATS scores are unofficial AI estimates.

The global live quota is ten attempts per sliding hour, persisted in Upstash. Failed provider calls consume an attempt. Upstash failures fail closed. Authenticated per-user quota and detailed database usage events remain Phase 4 work.

## Tests

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

Tests cover input/file restrictions, deterministic scoring and missing categories, schema validation, fixed demo data, endpoint authorization/configuration, usage limits and provider errors. Provider tests mock paid services. Test results do not establish real provider reliability or Supabase authorization. Live credentials are not included.

## Deploy with your accounts

1. Create an empty GitHub repository in your account. Do not add environment files, resumes, credentials or saved personal reports.
2. From this folder run `git init`, `git add .`, `git commit -m "Build CareerLens AI phases 1 and 2"`, `git branch -M main`, `git remote add origin YOUR_REPOSITORY_URL`, then `git push -u origin main`. Review staged files before committing.
3. For the current MVP, Supabase is not required. For Phase 4, create a Supabase project and implement/apply reviewed migrations for profiles, resumes, resume_analyses, job_matches, interview_sessions, interview_answers, cover_letters, career_roadmaps, roadmap_tasks and usage_events, with RLS and ownership checks before connecting real user data. No database setup is claimed complete here.
4. During Phase 4, configure the Supabase Auth site URL to your deployed origin and redirect allowlist to your actual application callback routes. Add Google OAuth provider credentials and its Supabase callback URL. The current app does not have an OAuth callback or password-reset flow.
5. Import the repository into Vercel, choose the Next.js preset and npm. The default `npm run build` is supported. Do not use a static export: PDF extraction and live AI need Node route handlers.
6. Add the environment values listed above in Vercel. Use a separate Upstash database/token as appropriate. Keep the shared owner access token secret. Without live configuration the public demo still works.
7. Deploy and set `NEXT_PUBLIC_APP_URL` to the deployed URL. If you change environment values, redeploy.
8. Test the landing page, theme toggle, dashboard, sample reports, history saving/deletion, PDF extraction, unauthorized live access, and a consented real analysis. Check that a provider outage shows an error. Add hosting firewall/traffic controls for the public extraction endpoint before broad release.

## Privacy and limitations

No uploaded PDFs are stored. Text exists in request memory and browser component state. Saved reports can include personal information; local storage is readable by this browser profile and is not encrypted account storage. Save only on trusted devices. Clear reports in Settings. See `/privacy` for the in-app notice. Provider API data-retention policies still apply despite `store: false`.

Only text-based PDFs are supported; no OCR and no password input. PDF parsing is synchronous request work, capped by upload size and deployment timeouts. PDFs over 25 pages are rejected after extraction; unusual files can still exhaust resources, so hosting controls matter. Vercel plan request-size limits may be lower than the app’s 5 MB cap; if uploads are rejected by the platform, use pasted text. Production deployments should align the UI limit with their platform or adopt direct private uploads with immediate deletion.

No Supabase auth, cloud persistence, account deletion, email, OAuth, Gemini provider or live Phase 3 tools yet. Dashboard trend data is illustrative, not calculated from saved history. Job matching accepts pasted resume text or a new upload; selecting a previous analysis is future work. JSON and browser print are supported exports, without a custom PDF report engine. No deployment or GitHub publication has been performed. Browser QA and live provider testing must be reported separately from automated checks.

## Future work

Complete Phases 3–5; add real user ownership and RLS tests, cloud reports, authenticated PDF endpoints, interview answer persistence, roadmap task persistence, end-to-end browser tests, actual screenshots and deployment monitoring.

## License

MIT. See LICENSE.

## Implementation references

- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation)
- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [pdf-parse maintained source](https://github.com/mehmet-kozan/pdf-parse)
