# AGENTS.md

## AI Development Workflow

This project uses **Code Review Graph (CRG)** as the primary repository knowledge source.

Before performing any task:

1. Use Code Review Graph to analyze the repository.
2. Determine:
   - Dependency graph
   - Impact radius
   - Call graph
   - Module relationships
   - Relevant files
3. Read only the files identified by Code Review Graph.
4. Do not scan unrelated files unless Code Review Graph indicates they are required.

---

# Before Implementation

Before making any code changes:

- Explain the affected files.
- Explain why those files are involved.
- Describe the implementation plan.
- Keep changes as small as possible.

---

# After Implementation

After every implementation:

- Verify dependencies remain intact.
- Check for broken imports.
- Check for broken API contracts.
- Check for architectural regressions.
- Detect dead code introduced by the change.
- Report any newly discovered technical debt.

---

# SOC5-Outbound Project Rules

This is a production-grade internal logistics platform.

Always preserve unless explicitly instructed otherwise:

- Business logic
- Backend API contracts
- Database schema
- Authentication
- Authorization
- Role permissions
- Request lifecycle
- Supabase integration

---

# UI Modernization Rules

When redesigning UI:

Allowed:

- Layout
- Typography
- Spacing
- Components
- Cards
- Navigation
- Tables
- Charts
- Theme
- Responsiveness

Do NOT modify:

- Backend
- API contracts
- Business rules
- Zustand stores
- Supabase queries
- Database schema

unless explicitly instructed.

---

# Refactoring Rules

Before refactoring:

- Determine impact radius using Code Review Graph.
- Show affected modules.
- Refactor only affected files.
- Avoid unrelated cleanup.

---

# Debugging Rules

Before debugging:

Use Code Review Graph to determine:

- Call chain
- Dependencies
- Upstream callers
- Downstream consumers

Fix the root cause instead of symptoms.

---

# Performance Review

When optimizing:

Identify:

- Circular dependencies
- Large components
- Duplicate logic
- Dead code
- Expensive renders
- Unnecessary API calls

Rank findings by impact.

---

# Architecture Review

When reviewing architecture:

Evaluate:

- Coupling
- Cohesion
- Dependency direction
- Module boundaries
- Reusability
- Maintainability

Provide actionable recommendations.

---

# Preferred Development Workflow

Always follow this sequence:

1. Analyze using Code Review Graph.
2. Determine dependency graph.
3. Determine impact radius.
4. Read only relevant files.
5. Explain implementation.
6. Implement.
7. Validate architecture.
8. Verify dependencies.
9. Summarize changes.

---

# General Coding Standards

- Keep components modular.
- Prefer composition over duplication.
- Keep files focused.
- Preserve existing conventions.
- Write readable code.
- Minimize unnecessary changes.
- Never perform large-scale refactors unless requested.

---

# Repository Context

Technology Stack

Frontend

- React
- TypeScript
- Vite

Backend

- Laravel (PHP)

Database

- Supabase

Analysis Tool

- Code Review Graph (MCP)

Primary AI Assistant

- Antigravity (AGY)

Secondary AI

- Gemini CLI

Additional AI

- Codex
- Claude Code

Whenever Code Review Graph tools are available through MCP:

- Prefer Code Review Graph over manual repository scanning.
- Use dependency analysis before opening files.
- Use impact analysis before implementation.
- Use graph queries whenever possible.

## Code Review Graph (Required)

When the Code Review Graph MCP server is available:

- Always use Code Review Graph before reading source files.
- Determine the dependency graph before implementation.
- Determine the impact radius before modifying code.
- Read only the files identified by Code Review Graph.
- Use architecture and dependency information instead of repository-wide searches whenever possible.
- After implementation, verify that dependencies and architecture remain valid.

# UI Modernization Policy (Permanent)

This project is a complete frontend modernization.

The approved design authority is:

- Pivora CRM Dashboard
- docs/ui-modernization/assets/pivora-dashboard-reference.png

## Core Principle

This project replaces the legacy presentation layer.

It does NOT layer a new design on top of the existing UI.

### Preserve

Always preserve:

- Business logic
- Backend APIs
- Authentication
- Routing
- State management
- Validation
- Data models
- Existing functionality

### Replace

When modernizing any UI component, replace:

- Layout
- Visual hierarchy
- CSS/SCSS
- Inline styles
- Hardcoded colors
- Hardcoded spacing
- Typography
- Borders
- Shadows
- Icons (when appropriate)
- Legacy wrappers
- Legacy utility classes

### Remove

After replacing a component, remove:

- Obsolete CSS/SCSS
- Dead style rules
- Duplicate presentation code
- Deprecated components
- Legacy theme variables
- Unused imports
- Unused wrappers

Do NOT leave legacy presentation code if it has been replaced.

Do NOT maintain multiple active design systems.

The final application must contain a single unified design language based on the approved Pivora design system.

When modernizing a component:

1. Preserve business logic.
2. Remove the legacy presentation layer.
3. Implement the new presentation layer.
4. Delete obsolete presentation code.
5. Validate the build.

# Refactoring Documentation Policy

During implementation, if technical debt or improvement opportunities are discovered:

Do NOT expand the current sprint.

Instead:

- Record them in docs/refactoring/REFACTORING_BACKLOG.md.
- Assign:
  - Category
  - Priority
  - Sprint discovered
  - Recommendation
  - Status (Open)

Only implement refactoring when it is explicitly scheduled.

# Sprint Workflow

Every implementation sprint follows:

1. Use Code Review Graph.
2. Determine dependency graph.
3. Determine impact radius.
4. Read only required files.
5. Explain implementation plan.
6. Wait for approval.
7. Implement.
8. Build.
9. Validate.
10. Report technical debt.
11. Update docs/refactoring/.
12. STOP.

# SCSS Migration Policy

SCSS architecture migration is incremental.

Do NOT migrate the entire styling system in one sprint.

Whenever a component or page is modernized:

1. Move its styling into the appropriate architecture.
2. Remove obsolete styles.
3. Keep main.scss as a lightweight entry file.
4. Avoid duplicate styling.

By Sprint 10, main.scss should primarily import:

- base/
- themes/
- layout/
- components/
- pages/
- utilities/

## Prompt Interpretation

Interpret verbs according to the following:

- Implement = create or add a new feature or capability.
- Refine = make targeted presentation adjustments without changing structure or behavior.
- Adjust = modify specific visual properties only.
- Remove = eliminate obsolete or unused code.
- Restructure = reorganize architecture without changing behavior.

Do not interpret "Refine" or "Adjust" as permission to redesign components or alter application structure unless explicitly instructed.
