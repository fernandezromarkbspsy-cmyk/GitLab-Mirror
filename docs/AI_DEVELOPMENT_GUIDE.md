# AI Development Guide

This document defines engineering standards for SOC5-Outbound.

---

# Architecture

Frontend

- React
- TypeScript
- Vite

Backend

- Laravel

Database

- Supabase

---

# Development Principles

Always

- Keep components modular.
- Keep functions small.
- Prefer composition.
- Avoid duplication.
- Keep responsibilities separated.

---

# Code Review Graph Workflow

Before editing:

1. Determine dependency graph.
2. Determine impact radius.
3. Read only affected files.
4. Explain implementation.
5. Implement.
6. Validate architecture.

---

# Safe Refactoring

Before refactoring

- Determine affected modules.
- Identify downstream dependencies.
- Preserve public interfaces.

Never perform repository-wide refactors unless explicitly requested.

---

# Debugging

Before debugging

- Determine call chain.
- Determine dependency graph.
- Identify root cause.
- Fix root cause instead of symptoms.

---

# Performance Review

Review

- Duplicate logic
- Circular dependencies
- Dead code
- Expensive renders
- Large components

---

# Architecture Review

Evaluate

- Coupling
- Cohesion
- Module boundaries
- Dependency direction
- Maintainability

---

# Pull Request Checklist

Before completion

- Dependencies verified
- Imports verified
- API compatibility verified
- Architecture verified
- No dead code