# Implementation Contract

Build SOC 5 Outbound from `docs/system-blueprint.md` and the approved documents in
this directory. Use Laravel 12, PHP 8.2+, PostgreSQL, React/TypeScript/Vite,
TanStack Query, Zustand, and Sass.

Rules: group backend code by feature; keep controllers thin; keep HTTP out of
services; keep SQL/Eloquent access in repositories; validate every payload; enforce
authorization server-side; represent lifecycle changes through one state machine;
write the request update, event, and notifications in one transaction; paginate all
collections; select needed fields; prevent N+1 queries; never expose service keys;
never hardcode secrets; and test valid and invalid transitions.

Prefer the smallest implementation that meets current requirements. Do not add a
microservice, cache, vector database, queue, or third-party SaaS until its concrete
use case and failure behavior are documented. Output complete files, migrations,
tests, environment examples, and run instructions.

Read and strictly follow:

docs/ui-modernization/00-RULES/CODEX_EXECUTION_RULES.md

Then execute this sprint.