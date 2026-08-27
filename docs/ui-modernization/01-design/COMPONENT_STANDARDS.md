# SOC5-OUTBOUND: COMPONENT STANDARDS

This document defines the visual and behavioral standards for all reusable components in the SOC5-Outbound UI modernization project. Every component must strictly adhere to the defined design tokens.

---

## 1. Core Components

### App Layout
- **Purpose:** Top-level application container.
- **Visual Style:** Sidebar (left), Header (top), Main Content (center).
- **Guidelines:** Use `--color-bg-base` for the main background.

### Sidebar
- **Purpose:** Primary navigation.
- **Visual Style:** Collapsible, icon-heavy.
- **States:** Default, Collapsed, Hover (items).

### Header
- **Purpose:** Global context, search, user actions.
- **Visual Style:** High utility, minimalist.

### Page Header
- **Purpose:** Contextual page title and primary actions.
- **Visual Style:** Left-aligned title, right-aligned action buttons.

---

## 2. Information & Data Components

### KPI Card
- **Purpose:** High-level performance tracking.
- **Visual Style:** Headline, Trend (Semantic Color), Comparison Label.

### Analytics Card
- **Purpose:** Container for visual data.
- **Visual Style:** Bordered surface, shadow `--shadow-md`.

### Data Table
- **Purpose:** Prospect/Lead management.
- **Visual Style:** Sticky header, row zebra-striping, bulk-action capable.

### Status Pill & Badge
- **Purpose:** Quick status recognition (Pill) vs alert counts (Badge).
- **Visual Style:** Rounded corners (`--radius-sm`), semantic colors.

---

## 3. Interaction & Form Components

### Button / Icon Button
- **Purpose:** Primary/Secondary actions.
- **Style:** Primary: Filled `--color-primary`, Secondary: Ghost/Outlined.
- **States:** Hover, Focus, Disabled.

### Form Inputs (Input, Select, Checkbox, Radio, Toggle)
- **Purpose:** User data entry.
- **Style:** Rounded (`--radius-md`), clear high-contrast labels.
- **States:** Focus (ring), Error (Danger Color), Disabled.

### Modal & Drawer
- **Purpose:** Focused user interaction (Modal) vs Contextual details (Drawer).
- **Style:** Backdrop overlay for Modals.

---

## 4. UI Feedback Components

### Toast Notification
- **Purpose:** System updates.
- **Visual Style:** Non-intrusive, semantic-based.

### Empty & Loading States
- **Purpose:** Guide/inform users.
- **Style:** Skeleton loaders for data, visual CTAs for empty states.

---

## 5. Global Standards
- **Typography:** Strictly use defined weights/scales in DESIGN_TOKENS.md.
- **Accessibility:** WCAG 2.1 AA compliance (Focus states mandatory).
- **Responsive:** Fluid layout; mobile vertical stack.

---

## Implementation Recommendations
1.  **Strict Compliance:** Developers must treat this as the source of truth for component implementation.
2.  **State Management:** Ensure all components handle default, hover, focus, and disabled states according to the token rules.
3.  **Performance:** Favor skeleton screens for all data-heavy components to ensure smooth perceived performance.
4.  **Composition:** Build complex UI via smaller, modular components defined here.

*Standards finalized: August 1, 2026.*
