# SOC5 Outbound — Claude Code Instructions

## 1. Project

Project:
- Name: SOC5 Outbound
- Repository: outbound-project/soc-5-outbound
- GitLab: https://gitlab.com/outbound-project/soc-5-outbound
- Default branch: `main`

Primary architecture:
- Frontend: React + TypeScript + Vite
- Backend: Laravel + PHP
- Database/Auth: Supabase PostgreSQL + Supabase Auth
- Serverless: Supabase Edge Functions
- Reverse proxy: Nginx
- Deployment: Docker / EC2 / Cloudflare
- Testing: Vitest / Playwright / PHPUnit where applicable

---

# 2. Core Operating Rules

## Autonomous execution

Work autonomously until the requested task is complete.

Do NOT:
- narrate every action
- provide progress updates
- repeat the user's request
- ask "Should I continue?"
- ask for confirmation between related implementation steps
- explain obvious tool operations
- repeatedly summarize what you are doing

Only stop when:
- the task is complete
- a real blocker exists
- credentials/access are required
- a destructive action requires explicit approval
- the user must make a technical/product decision
- the requested acceptance criteria cannot be satisfied safely

Prefer completing the entire requested task in one execution.

---

# 3. Token Efficiency

Use as few tool calls and tokens as reasonably possible.

Rules:
- Inspect only relevant files.
- Prefer targeted searches.
- Do not scan the entire repository unless required.
- Do not repeatedly read the same file.
- Do not repeat searches that already produced the needed information.
- Avoid unrelated investigation.
- Avoid speculative investigation.
- Make the smallest safe change.
- Run only relevant tests/validation.
- Review the final diff once.
- Do not generate unnecessary explanations.

When several files must be inspected, batch related inspection/search operations when possible.

---

# 4. Repository Inspection

Before modifying code:

1. Identify the relevant implementation.
2. Search for all important callers/usages.
3. Inspect related configuration.
4. Inspect relevant tests.
5. Check database/schema dependencies if applicable.
6. Understand the existing implementation before changing it.

Do not modify code based on a partial snippet when the surrounding implementation matters.

For a bug:
- reproduce or establish the failure path when practical
- identify root cause
- inspect callers/dependencies
- make the smallest correct fix
- validate the fix

For a feature:
- inspect existing patterns first
- reuse existing abstractions where appropriate
- avoid unnecessary new architecture

---

# 5. Change Discipline

Make minimal, focused changes.

Do NOT:
- reformat unrelated files
- rename unrelated variables
- reorganize unrelated code
- upgrade dependencies without need
- modify unrelated configuration
- introduce speculative abstractions
- rewrite working code unnecessarily

Preserve existing behavior unless the requested change requires otherwise.

Do not change public APIs/contracts unless required.

When changing behavior, check all known callers and consumers.

---

# 6. Security Rules

Security takes priority over convenience.

Never:
- commit passwords
- commit API keys
- commit access tokens
- commit JWTs
- commit service-role keys
- commit private keys
- commit `.env` secrets
- expose credentials in logs
- weaken authentication to make tests pass
- disable security controls without explicit authorization

Use environment variables or the existing secret-management mechanism.

If a secret is discovered:
- do not print it
- do not commit it
- report that a secret was detected
- recommend rotation if appropriate

For Supabase:
- distinguish authentication from authorization
- never assume `verify_jwt=true` provides role-level authorization
- carefully review service-role usage
- never expose a Supabase service-role key to frontend code

---

# 7. Database Rules

Supabase/PostgreSQL is production data.

Never edit an existing migration.

If a schema change is required:
- create a new migration
- make it idempotent where appropriate
- preserve existing data
- consider indexes and constraints
- consider rollback implications

Before changing database behavior:
- inspect relevant migrations
- inspect existing constraints
- inspect indexes
- inspect application queries
- inspect Edge Functions that use the affected tables

For potentially expensive queries:
- consider indexes
- avoid unnecessary full-table scans
- avoid leading-wildcard searches unless intentionally supported
- consider query plans when appropriate

Do not silently change production data.

---

# 8. Supabase Edge Functions

For Edge Functions:

- inspect `supabase/config.toml`
- inspect the function implementation
- inspect callers
- inspect related database schema/migrations
- validate authentication requirements
- validate authorization requirements
- validate request methods
- validate input data
- validate error handling
- validate duplicate/upsert behavior

Do not assume deployed Supabase code matches local code.

If runtime behavior contradicts local code:
- verify deployment/version status
- distinguish local implementation problems from stale deployment problems

---

# 9. Authentication and Authorization

Treat authentication and authorization separately.

Authentication:
- Is the caller authenticated?

Authorization:
- Is the authenticated caller allowed to perform this operation?

When reviewing protected endpoints:
- inspect middleware
- inspect JWT validation
- inspect role checks
- inspect service-role usage
- inspect frontend access assumptions

Never solve an authorization problem by merely enabling authentication.

---

# 10. Frontend Rules

Frontend code should follow existing project patterns.

Before changing frontend behavior:
- inspect relevant components
- inspect hooks
- inspect API clients/services
- inspect state/query management
- inspect existing tests

Avoid:
- unnecessary API requests
- unnecessary polling
- duplicate state
- excessive re-renders
- large data fetching when a smaller query is sufficient

For React/TanStack Query:
- reuse existing query patterns
- respect cache behavior
- avoid duplicate requests
- invalidate/update affected queries correctly

For UI changes:
- preserve existing design patterns
- maintain responsive behavior
- avoid unrelated visual changes

---

# 11. Backend Rules

Backend is Laravel/PHP.

Before modifying backend logic:
- inspect routes
- inspect controllers
- inspect middleware
- inspect services/features
- inspect repositories
- inspect models
- inspect validation
- inspect tests

Prefer existing application architecture over introducing new patterns.

Business rules should not be duplicated across multiple layers.

When changing a workflow/state transition:
- find all callers
- identify allowed states
- preserve authorization rules
- update relevant tests

---

# 12. API Rules

When modifying an API:

Check:
- route
- authentication
- authorization
- validation
- controller
- service
- repository
- response format
- frontend callers
- tests

Do not break existing consumers unnecessarily.

If a breaking API change is required, explicitly report it.

---

# 13. Testing

After implementation, run the smallest relevant validation first.

Examples:

Frontend:
- targeted Vitest tests
- TypeScript/build validation when appropriate
- targeted Playwright test when UI behavior requires it

Backend:
- targeted PHPUnit tests
- Laravel validation/tests relevant to the change

Supabase:
- TypeScript/type validation
- function-specific checks
- deployment/runtime validation when applicable

Database:
- migration validation
- constraint/index validation
- targeted SQL checks where appropriate

Do not run the entire test suite unnecessarily.

If tests cannot run:
- state why
- run the next-best validation
- do not claim tests passed

Never claim validation that was not actually performed.

---

# 14. CI/CD

The repository may contain GitLab CI/CD.

When modifying CI:
- inspect `.gitlab-ci.yml`
- inspect existing scripts
- inspect Docker configuration
- inspect deployment configuration
- preserve secret handling
- avoid hardcoding credentials
- verify job dependencies
- verify branch rules
- verify artifacts/caches only when needed

Do not assume GitHub Actions and GitLab CI are equivalent.

If both exist, determine which one is authoritative before changing either.

---

# 15. Docker

When changing Docker:

Inspect:
- Dockerfile
- docker-compose configuration
- runtime PHP/Node versions
- installed extensions
- build dependencies
- production vs development behavior

Keep runtime versions aligned with:
- `composer.json`
- `package.json`
- CI
- Docker
- deployment environment

Do not perform broad dependency/runtime upgrades unless explicitly requested or required.

---

# 16. Environment Configuration

Never commit local secrets.

Use:
- `.env.example`
- environment variables
- GitLab CI/CD variables
- Supabase secrets
- approved secret-management systems

If adding a required environment variable:
1. add a safe placeholder/documentation to `.env.example` if appropriate
2. never add the real value
3. update relevant documentation when useful

---

# 17. Git Rules

Never work directly on `main` unless the user explicitly asks for it.

Preferred workflow:

```text
main
  ↓
feature/fix/remediation branch
  ↓
commit
  ↓
review
  ↓
merge to main