# Database migration

Apply `migrations/202611120001_career_workspace.sql` once through your project's SQL Editor. The publishable key cannot execute migrations. See the root `SUPABASE_SETUP.md` for complete dashboard setup, callback URLs and real-account checks.

`npm run test` executes this exact SQL migration in an isolated PGlite PostgreSQL database with simulated Supabase roles and `auth.uid()`. These tests do not change your hosted database.

RLS applies to all ten tables. Each child reference includes the parent owner ID; a user cannot attach their child rows to another user's records. `delete_own_account()` accepts no target ID and deletes only `auth.uid()`. Its security-definer search path is empty, and anonymous/public execution is revoked.

Usage events record requested features, never resume text. The separate persistent Upstash quota remains authoritative even if a user removes their own events. PDFs are not stored in database or object storage. Resume text is saved only by the explicit saved-resume action.

For the live Phase 3 tools, apply migrations/202611120002_career_tools.sql after the original migration. It adds atomic interview/roadmap saves and row-locked task progress updates. Both functions use security invoker permissions and existing RLS; they cannot bypass ownership. Existing data remains intact.
