# CareerLens AI implementation log

## Scope and plan

The workspace was empty. The attached brief explicitly asks to begin with Phase 1 and Phase 2. Work remains local; no GitHub, Supabase or Vercel account access is assumed.

1. Foundation: Next.js App Router, strict TypeScript, Tailwind, shadcn-style owned Button primitive, design tokens, responsive landing page and workspace navigation, light/dark themes.
2. Core AI MVP: clearly labeled deterministic demo, PDF extraction, resume and job match tools, structured output validation, deterministic weighted scoring, consent, server-only credentials, gated and persistently rate-limited live requests.
3. Verify: lint, typecheck, tests, production build, and practical HTTP smoke checks. Record actual results after running.

## Phase 1

Implemented app/layout.tsx, app/page.tsx, app/globals.css, components/landing.tsx, components/dashboard-shell.tsx, components/overview.tsx, components/shared.tsx, components/ui/button.tsx and configuration files. Navigation includes honest interactive previews for future tools. Login explains that accounts arrive in Phase 4.

## Phase 2

Implemented lib/ai schemas, prompts and service, lib/scoring.ts, lib/demo.ts, lib/validation.ts, PDF and analysis route handlers, resume and job match pages, report rendering, explicit browser-local saving and deletion, JSON and print/PDF export, and automated validation/API tests. Reports do not automatically persist resume inputs or PDFs.

Live requests require an owner token plus Upstash. This temporary deployment gate replaces public paid access until Phase 4 adds authenticated per-user limits. The counter is global to the owner and counts attempts, including failed provider calls. Extraction is public and not persistently rate limited; protect it with hosting firewall limits before exposing it broadly.

## Next phases

- Phase 3: real generated interviews with per-answer evaluation, personalized cover letters and roadmaps. Existing previews use fixed sample content; interview answers are not scored or saved.
- Phase 4: Supabase Auth, protected routes, all ten database tables, ownership/RLS, cloud history and account deletion. No migrations are included in the present Phase 1–2 scope.
- Phase 5: browser accessibility and responsive QA, screenshots, expanded end-to-end coverage and production operational review.

See README.md for setup and deployment. No external deployment has been performed.

## Executed verification

- `npm.cmd init -y`; runtime and development dependency installation. Initial sandboxed registry access failed; approved installation succeeded.
- `npm.cmd run lint`: passed after changing history to subscribe to browser storage with useSyncExternalStore.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test`: passed (20 tests, including the final invalid-token regression check).
- `npm.cmd run build`: passed; Next.js 16.4.6 production output includes all workspace pages and Node API routes.
- `npm.cmd audit --omit=dev`: zero runtime vulnerabilities. Installation reported seven moderate advisories in development dependencies; these were not auto-fixed across major tool versions.
- `npm.cmd run dev`: started successfully at localhost:3000. HTTP smoke checks passed for landing, dashboard, both analyzers, all three previews, history, settings, privacy, terms and login. Valid generated PDF upload returned extracted text with HTTP 200; unauthorized AI request returned HTTP 401.
- Browser preview was attempted, but no browser surfaces were connected. Visual/keyboard/mobile browser QA is unverified. No paid provider call was made; automated provider tests use mocks.

Phase 1 and Phase 2 delivery is implemented with the limitations documented above. The next implementation step is Phase 3; Supabase and production account protection follow in Phase 4.

## Supabase integration update

User requested the next step after configuring Supabase. Implemented authentication and persistence from Phase 4 ahead of the remaining Phase 3 tools. Public demo moved to /demo; account workspace is protected. Added @supabase/ssr clients, Next.js proxy refresh, verified getUser checks, email/password and Google OAuth forms/callback, reset/update password, signout, real account overview, explicit cloud report/resume saves, history, profile editing, and self-only account deletion. Removed the shared owner token from live AI; quotas are per verified user with persistent Upstash and usage events.

Created the ten-table migration with RLS, indexes, timestamps, composite owner foreign keys and deletion cascades. Added SUPABASE_SETUP.md and supabase/README.md. No hosted migrations or authentication settings were changed. A read-only hosted check accepted the configured public key and confirmed email sign-in/confirmation enabled, Google disabled, and profiles absent (PGRST205).

Executed dependency installs, npm.cmd run lint, npm.cmd run typecheck, npm.cmd run test (40 passing, including 8 real local PostgreSQL/RLS tests) and npm.cmd run build. Earlier compiler/lint failures were corrected. Local PostgreSQL tests apply the exact migration; no live user data is touched. Real sign-up, recovery email, Google sign-in and hosted database operations remain unverified until the owner completes setup. Browser visual QA remains unavailable.

Production HTTP smoke checks passed: public landing/demo/auth pages 200; private dashboard/history/settings/analyzers redirected to login; password update redirected without a session; report/resume/AI/extraction/account APIs returned 401 without authentication; invalid auth callback redirected to the local login page. The temporary production verification server was stopped after checks. .env.local remains Git-ignored.

## Saved items missing from History fix

History now includes explicitly saved resume text as well as analysis reports, with a dedicated Saved resume text filter and RESUME TEXT label. Saved text is exported and deleted through its own resume endpoint. Successful report/resume mutations invalidate history/dashboard paths, and client saves refresh route data. The server history snapshot keys the client component so refreshed props replace stale local list state. Ownership checks remain in place for all six history sources. No SQL migration change is required.

Regression tests cover merged saved-text/report history, ordering, and history/dashboard invalidation after report saves. npm.cmd run test passed with 42 tests.

## Phase 3 delivery

Implemented live role-specific interviews, cover letters, and personalized career roadmaps in the authenticated workspace. Added lib/ai/career-schemas.ts, career-prompts.ts, lib/career.ts and components/career/*; extended the AI endpoint and service with structured responses, deadline, consent, usage tracking and per-user quota. Interview feedback matches question IDs, blanks score zero, and the deterministic rubric is accuracy 40%, clarity 30%, completeness 30%. Cover drafts support editing, tone regeneration, copy, text/JSON/print export and cloud saves. Roadmaps enforce weeks/hour budgets, preserve task completion and reopen from History.

Added supabase/migrations/202611120002_career_tools.sql for transactional parent/child saves and row-locked progress updates. Existing first-migration data is preserved. Both new functions use security invoker with RLS, no administrative key. New paid tool calls use the existing shared ten-attempt per-user hourly quota; question generation and interview evaluation are separate attempts.

Updated live pages, navigation, landing copy, public demo labels, history refresh revisions and setup documentation (PHASE3.md, SUPABASE_SETUP.md, README.md). Public samples remain fixed; no fake provider fallback. Original resume text still saves only via explicit user choice.

Executed npm.cmd run lint (pass), npm.cmd run test (72 tests pass across seven files), npm.cmd run build (pass), then npm.cmd run typecheck (pass). An earlier concurrent typecheck saw changing generated Next route files; sequential checking passed. New tests cover structured provider output via mocks, deterministic scoring, question identity/count, study-budget validation, input consent, persistence APIs and actual PostgreSQL atomic saves, rollback, progress consistency and cross-user/anonymous denial.

Credential presence checked without printing values: OPENAI_API_KEY and both Upstash values are missing. No real paid generation was attempted. The new migration was tested locally but not applied to the hosted project. Real provider output quality and browser visual/interaction QA remain unverified without credentials and a connected browser.
Production HTTP smoke checks passed: public demo tools 200; private tool pages redirect to login; all four new generation operations and roadmap progress return 401 without a session. The temporary verification server was stopped.
