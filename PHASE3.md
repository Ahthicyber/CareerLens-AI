# Phase 3: live career tools

The signed-in workspace now includes real AI mock interviews, cover letters, and weekly career roadmaps. `/demo` keeps deterministic fictional examples separate. Generation never silently substitutes a sample if the provider fails.

## Required setup

1. Keep the original Supabase migration already applied.
2. Run **only the new** `supabase/migrations/202611120002_career_tools.sql` in Supabase SQL Editor. It adds a task key column and atomic save/progress functions while retaining existing data and ownership policies. Do not rerun the first migration.
3. Add these server-side credentials to `.env.local` (never to chat, public variables, source control, or `.env.example`):

```env
OPENAI_API_KEY=your-private-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
UPSTASH_REDIS_REST_URL=your-redis-rest-url
UPSTASH_REDIS_REST_TOKEN=your-private-redis-rest-token
```

Use an OpenAI API project with billing/credits; a ChatGPT subscription does not supply the app's API credentials. Obtain a Redis REST URL/token from your own Upstash database. No additional Supabase secret/service-role key is required. Restart the local server after environment changes. Missing credentials or migrations produce explicit errors; they do not prevent demo browsing.

## Mock interviews: `/interview`

Choose a built-in or custom role, experience level, category, difficulty and five or ten questions. Give provider consent and start. The optional timer measures elapsed practice time without a hard limit. Move between questions without losing typed answers. Answers live in page memory until the completed session is explicitly saved; reloading an unsaved interview loses it.

Submitting sends questions and answers for structured feedback. Unanswered questions require confirmation and score zero. Application code calculates each question's score from accuracy/content correctness 40%, communication clarity 30% and completeness 30%, then averages question scores equally. Feedback must match all question IDs exactly. Example answers are hypothetical guidance, not invented candidate experiences. Save the completed session to persist both the report and per-question answer/feedback rows atomically. Revisit the full result in History; it is a coaching aid, not a hiring or professional assessment.

Starting and evaluating each consume one of the shared ten AI requests per user per hour. If evaluation fails, typed answers stay available for retry without generating new questions.

## Cover letters: `/cover-letter`

Paste a resume/professional summary or load explicitly saved resume text. Supply the role, company, description, tone and optional preferences. Generate a letter grounded only in those facts. The draft is editable; copy, download text, print to PDF, export JSON, or save the current draft to History. Changing the selected tone applies on the next generation. Regeneration confirms before replacing an edited draft. Each save makes a new history entry. A letter's saved metadata retains the role/company/tone used for that generation, even if you later edit the input form.

## Roadmaps: `/roadmap`

Provide current skills, target role, level, one to forty study hours per week and one to twenty-four weeks. The service requires exactly one milestone per week and rejects plans exceeding the weekly budget. Milestones include learning objectives, topics, practice projects, interview practice and tasks. Application code assigns stable unique task keys and initializes new plans as incomplete.

Check tasks locally, then choose Save to account. After the initial save, checkbox changes save automatically. History includes **Continue roadmap**, which reloads the saved plan with its existing progress. Each progress RPC locks the caller's roadmap row, then updates the relational task and report JSON in the same transaction. Cross-user requests are denied by RLS and explicit caller checks. Failed progress updates preserve the previous checkbox value and show an error; do not assume a task saved until the control updates.

## Verification

Automated tests exercise structured AI outputs with a mocked provider, question identity/count checks, score computation, blank answers, consent and time-budget restrictions, all new paid API branches, validated saves and progress endpoints. Isolated PostgreSQL tests apply both exact migrations and verify atomic parent/child writes, rollback on invalid tasks, JSON/relational progress consistency and denial of another user's or anonymous access.

Run `npm.cmd run lint`, `npm.cmd run test`, `npm.cmd run build`, then `npm.cmd run typecheck`. Run build and typecheck sequentially after adding routes so Next.js generated route files do not change while TypeScript reads them.

Real OpenAI calls have not been tested without credentials. No hosted migration, account credential, provider billing, deployment, or paid request is created by this implementation. Complete one real generation for each tool after configuring your own credentials and applying the second migration. Browser interaction/visual testing requires a connected browser and is separately unverified in this environment.
