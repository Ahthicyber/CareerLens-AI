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
