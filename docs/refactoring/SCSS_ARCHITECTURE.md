# SCSS Architecture

## Desired Folder Structure
```
src/
└── styles/
    ├── base/            # Core resets, typography, global element styles
    ├── themes/          # Theme variables, dark/light mode definitions
    ├── layout/          # Layout primitives (grid, flex helpers, page wrappers)
    ├── components/      # Component‑specific SCSS (Button, Card, Modal, etc.)
    ├── pages/           # Page‑level styling (Dashboard, Orders, Settings)
    └── utilities/       # Mixins, functions, helpers (spacing, colors, media queries)
```

## Naming Conventions
- **Variables**: `$<category>-<name>` (e.g., `$color-primary`, `$spacing-lg`).
- **Mixins**: `@mixin <name>(...)` – PascalCase for clarity.
- **Files**: kebab‑case matching component name (`button.scss`, `order-card.scss`).
- **Imports**: Central `index.scss` that re‑exports each folder’s entry point for easy inclusion.

## Migration Strategy (No code changes performed)
1. **Audit Existing SCSS** – Use a script to list all `.scss` files and map them to the new folders.
2. **Create New Folders** – Add empty directories following the structure above.
3. **Move Files Virtually** – Update import paths in a **dry‑run** mode (e.g., using a codemod that prints suggested changes).
4. **Validate Build** – Run `npm run dev` locally; fix any broken imports.
5. **Commit Migration** – Incrementally commit each folder migration as a separate PR to keep review manageable.
6. **Deprecate Legacy Files** – After successful migration, delete original legacy SCSS files.

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026‑08‑01 | Antigravity (AGY) | Added SCSS architecture blueprint and migration steps |

---

**Ownership:** Frontend Architecture Lead.

**Update Instructions:** Edit this file to reflect any new folder conventions or migration tooling. When a folder is fully migrated, add a checklist entry under a “Migration Progress” section (optional).
