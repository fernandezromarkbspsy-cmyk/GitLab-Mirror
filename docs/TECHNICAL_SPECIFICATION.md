# SOC5-Outbound — Technical Specification Document

> **Implementation note (2026-09-19):** This document contains historical design material and is not authoritative where it conflicts with the source. The current backend is Laravel 12 using `AuthenticateSupabase` with Supabase Auth bearer validation, query-builder repositories/services, and Supabase-managed SQL migrations. Protected writes go through Laravel; browser reads use Supabase RLS where explicitly supported. Deployment runs PHP-FPM behind NGINX with a separate Laravel scheduler container. See `backend/routes/api.php`, `backend/bootstrap/app.php`, `supabase/migrations/`, and `docker-compose.yml` for the executable contract. References below to Sanctum, Eloquent models, Laravel Form Requests, or Laravel-managed schema are legacy material pending rewrite.

> **Document Version**: 1.0
> **Date**: 2026-08-31
> **Status**: Living Document
> **Prepared by**: Antigravity (AGY) — AI Engineering Assistant
> **Classification**: Internal — Production Grade

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Architecture Overview](#3-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Database Architecture](#7-database-architecture)
8. [Authentication & Authorization](#8-authentication--authorization)
9. [State Management](#9-state-management)
10. [API Contracts](#10-api-contracts)
11. [UI Modernization Specification](#11-ui-modernization-specification)
12. [SCSS Architecture](#12-scss-architecture)
13. [Security Model](#13-security-model)
14. [Development Workflow](#14-development-workflow)
15. [AI-Assisted Development Policy](#15-ai-assisted-development-policy)
16. [Refactoring & Technical Debt Policy](#16-refactoring--technical-debt-policy)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Deployment & Infrastructure](#18-deployment--infrastructure)
19. [Glossary](#19-glossary)

---

## 1. Executive Summary

**SOC5-Outbound** is a **production-grade internal logistics platform** designed to manage outbound operations end-to-end. It is a full-stack web application with a **React/TypeScript frontend**, a **Laravel (PHP) backend**, and **Supabase** as the primary database and real-time service layer.

The system is currently undergoing a complete **frontend UI modernization sprint** based on the approved **Pivora CRM Dashboard** design authority. The modernization replaces the legacy presentation layer entirely while preserving all business logic, backend API contracts, authentication, state management, and database schema.

This document serves as the canonical technical reference for all developers, AI agents, and stakeholders working on the platform.

---

## 2. System Overview

### 2.1 Purpose

SOC5-Outbound manages the outbound logistics supply chain including:

- Order creation and tracking
- Shipment management and dispatch
- Role-based access for operations staff, supervisors, and administrators
- Real-time data synchronization via Supabase subscriptions
- Reporting and analytics dashboards

### 2.2 Key Principles

| Principle | Description |
|---|---|
| **Preserve Business Logic** | No logic changes during UI-only sprints |
| **Single Design Language** | One unified Pivora-based design system |
| **API Stability** | Backend contracts are immutable unless explicitly changed |
| **Incremental Modernization** | UI is replaced component-by-component, not all-at-once |
| **Minimal Change Surface** | Every sprint touches only what is necessary |

### 2.3 Stakeholders

| Role | Responsibility |
|---|---|
| Operations Staff | Day-to-day platform usage |
| Supervisors | Oversight, approval workflows |
| Administrators | User management, configuration |
| Engineering Team | Development and deployment |
| AI Agents (AGY, Gemini CLI, Codex, Claude Code) | Implementation assistance |

---

## 3. Architecture Overview

```
+----------------------------------------------------------+
|                     SOC5-Outbound                        |
|                                                          |
|  +----------------------------------------------------+  |
|  |       Frontend (React + TypeScript + Vite)         |  |
|  |  Pages / Components / Zustand Stores / Router      |  |
|  |  Supabase JS Client                                |  |
|  +----------------------------+-----------------------+  |
|                               | HTTP (REST / RPC)        |
|  +----------------------------v-----------------------+  |
|  |          Backend (Laravel / PHP)                   |  |
|  |  Routes / Controllers / Services / Eloquent        |  |
|  |  Middleware: Sanctum Auth, Role Guards, CORS        |  |
|  +----------------------------+-----------------------+  |
|                               | PostgreSQL / PostgREST   |
|  +----------------------------v-----------------------+  |
|  |               Supabase (Database Layer)            |  |
|  |   PostgreSQL 15 + RLS + Auth + Realtime + Storage  |  |
|  +----------------------------------------------------+  |
+----------------------------------------------------------+
```

### 3.1 Request Lifecycle

```
User Action
    |
    v
React Component (UI Event)
    |
    v
Zustand Store Action / React Query Call
    |
    +----> Supabase JS Client
    |           |
    |           v
    |      PostgREST --> PostgreSQL (RLS enforced)
    |
    +----> Laravel HTTP API
                |
                v
           Controller --> Service --> Eloquent --> Supabase DB
```

---

## 4. Technology Stack

### 4.1 Frontend

| Technology | Version | Role |
|---|---|---|
| React | 18.x | UI component framework |
| TypeScript | 5.x | Static typing |
| Vite | 5.x | Build tool and dev server |
| React Router | 6.x | Client-side routing |
| Zustand | 4.x | Global state management |
| Supabase JS | 2.x | Direct DB access and auth |
| TanStack React Query | 5.x | Server state, caching, re-fetching |
| SCSS / Sass | 1.x | Styling architecture |

### 4.2 Backend

| Technology | Version | Role |
|---|---|---|
| PHP | 8.2+ | Runtime |
| Laravel | 10.x / 11.x | API framework |
| Composer | 2.x | Dependency management |
| Eloquent ORM | (built-in) | Database abstraction |
| Laravel Sanctum | (built-in) | API token authentication |

### 4.3 Database & Infrastructure

| Technology | Role |
|---|---|
| Supabase (Cloud-hosted) | PostgreSQL + Auth + Realtime + Storage |
| PostgreSQL 15 | Primary relational database |
| PostgREST | Auto-generated REST API (Supabase-managed) |
| Row Level Security (RLS) | Fine-grained access control at DB layer |

### 4.4 AI Toolchain

| Tool | Role |
|---|---|
| Antigravity (AGY) | Primary AI coding assistant |
| Gemini CLI | Secondary AI for scripted tasks |
| Codex | Supplementary code generation |
| Claude Code | Additional AI assistance |
| Code Review Graph (CRG) | Repository knowledge graph and impact analysis |

---

## 5. Frontend Architecture

### 5.1 Project Structure

```
soc5-outbound/
+-- src/
|   +-- assets/             # Static assets (images, fonts, icons)
|   +-- components/
|   |   +-- common/         # Button, Input, Card, Badge, Modal, etc.
|   |   +-- layout/         # Sidebar, Header, PageWrapper
|   |   +-- tables/         # DataTable, Pagination
|   |   +-- charts/         # Analytics and reporting charts
|   |   +-- modals/         # Modal dialogs
|   +-- pages/              # Route-level page components
|   +-- stores/             # Zustand state stores (domain-separated)
|   +-- hooks/              # Custom React hooks
|   +-- services/           # HTTP service layer (API call wrappers)
|   +-- types/              # TypeScript interfaces and type definitions
|   +-- utils/              # Pure utility functions (stateless)
|   +-- styles/             # SCSS 7-1 architecture
|   +-- router/             # React Router configuration
|   +-- lib/                # Third-party wrappers (supabase client)
|   +-- main.tsx            # Application entry point
+-- public/                 # Public static assets
+-- docs/
|   +-- ui-modernization/
|   |   +-- assets/         # Pivora dashboard reference images
|   +-- refactoring/
|       +-- REFACTORING_BACKLOG.md
+-- .agents/
|   +-- skills/             # Custom AI agent skills
+-- AGENTS.md               # AI agent rules and policies
+-- GEMINI.md               # Gemini / CRG configuration
+-- package.json
+-- tsconfig.json
+-- vite.config.ts
+-- index.html
```

### 5.2 Component Architecture

Components follow a strict hierarchy and composition pattern:

```
Page Component  (route-level, orchestrates data fetching and layout)
    |
    +-- Layout Component  (Sidebar, Header, PageWrapper)
    |
    +-- Feature Component  (business domain-specific)
    |       +-- Table Component
    |       +-- Form Component
    |       +-- Card Component
    |
    +-- Common/Primitive Component  (Button, Input, Badge, etc.)
```

**Rules:**
- Components must be **modular** and **focused** (single responsibility).
- Composition is preferred over duplication.
- No inline styles — all styling via SCSS modules or design tokens.
- No hardcoded colors, spacing, or typography — use SCSS variables.

### 5.3 Routing

React Router v6 handles all client-side navigation. Routes are protected by authentication guards that check the Zustand auth state before rendering.

**Protected Route Pattern:**
```typescript
// All authenticated routes are wrapped in a PrivateRoute guard
<PrivateRoute>
  <PageComponent />
</PrivateRoute>
```

**Route Structure:**
```
/                    --> Dashboard         (protected, all roles)
/login               --> Login page        (public)
/orders              --> Orders list       (protected, all roles)
/orders/:id          --> Order detail      (protected, all roles)
/shipments           --> Shipments list    (protected, all roles)
/shipments/:id       --> Shipment detail   (protected, all roles)
/reports             --> Reports           (protected, supervisor+)
/admin               --> Admin panel       (protected, admin only)
/admin/users         --> User management   (protected, admin only)
```

### 5.4 Data Fetching Strategy

| Scenario | Tool | Rationale |
|---|---|---|
| Server state (lists, details) | TanStack React Query | Caching, re-fetching, loading states |
| Direct Supabase reads | Supabase JS Client | Low-latency PostgREST with RLS |
| Mutations (create/update/delete) | React Query `useMutation` | Optimistic updates, error handling |
| Global UI state | Zustand | Auth, UI prefs, notifications |
| Real-time subscriptions | Supabase Realtime | Live shipment/status updates |

---

## 6. Backend Architecture

### 6.1 Laravel Application Structure

```
backend/ (Laravel root)
+-- app/
|   +-- Http/
|   |   +-- Controllers/    # RESTful API controllers
|   |   +-- Middleware/     # Auth, Role, Rate-limit, CORS
|   |   +-- Requests/       # Form request validation
|   +-- Models/             # Eloquent domain models
|   +-- Services/           # Business logic services
|   +-- Repositories/       # Data access layer (optional)
|   +-- Policies/           # Laravel authorization policies
+-- routes/
|   +-- api.php             # All API route definitions
+-- database/
|   +-- migrations/         # Schema migrations (synced with Supabase)
|   +-- seeders/            # Test / seed data
+-- config/
|   +-- supabase.php        # Supabase connection configuration
+-- .env                    # Environment variables (never committed)
```

### 6.2 Controller Pattern

```php
class OrderController extends Controller
{
    public function __construct(private OrderService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);
        return response()->json(
            $this->service->getPaginated($request->validated())
        );
    }

    public function store(CreateOrderRequest $request): JsonResponse
    {
        $this->authorize('create', Order::class);
        $order = $this->service->create($request->validated());
        return response()->json($order, 201);
    }
}
```

### 6.3 Middleware Stack

| Middleware | Purpose |
|---|---|
| `auth:sanctum` | Validates Laravel Sanctum bearer tokens |
| `role:{role}` | Role-based access enforcement |
| `throttle:api` | Rate limiting per user/IP |
| `cors` | Cross-origin headers for Vite dev server |

### 6.4 Preserved Backend Contracts (IMMUTABLE during UI sprints)

> [!IMPORTANT]
> The following are **read-only** during all UI modernization sprints:
> - All API endpoint paths, HTTP methods, and response schemas
> - All request validation rules (Form Requests)
> - All error response formats
> - All authentication and authorization middleware

---

## 7. Database Architecture

### 7.1 Overview

The database is hosted on **Supabase Cloud** (PostgreSQL 15). Schema is managed via Laravel migrations and the Supabase dashboard DDL. Row Level Security is enforced on all tables.

### 7.2 Core Domain Tables

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name   TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'staff')),
    department  TEXT,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no    TEXT UNIQUE NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending',
    customer_id     UUID REFERENCES customers(id),
    assigned_to     UUID REFERENCES profiles(id),
    notes           TEXT,
    total_value     NUMERIC(15,2),
    created_by      UUID REFERENCES profiles(id),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments
CREATE TABLE shipments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID REFERENCES orders(id),
    tracking_no     TEXT UNIQUE,
    carrier         TEXT,
    status          TEXT NOT NULL DEFAULT 'pending',
    dispatched_at   TIMESTAMPTZ,
    delivered_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    code        TEXT UNIQUE,
    address     TEXT,
    contact     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log
CREATE TABLE audit_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     UUID REFERENCES profiles(id),
    table_name  TEXT NOT NULL,
    record_id   UUID,
    action      TEXT NOT NULL,   -- INSERT | UPDATE | DELETE
    old_data    JSONB,
    new_data    JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.3 Row Level Security (RLS)

All tables have RLS enabled. Sample policies:

```sql
-- Staff see only assigned orders; supervisors and admins see all
CREATE POLICY "orders_select_policy" ON orders FOR SELECT
USING (
    auth.uid() = assigned_to
    OR EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
);

-- Delete restricted to admins
CREATE POLICY "orders_delete_policy" ON orders FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
```

### 7.4 Supabase Realtime

Used for:
- Live shipment status updates on the dashboard
- Notification feed (new assignments, status changes)
- Admin broadcast messages

```typescript
// Frontend subscription pattern
const channel = supabase
  .channel('shipments-realtime')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'shipments' },
    (payload) => handleShipmentChange(payload)
  )
  .subscribe();
```

---

## 8. Authentication & Authorization

### 8.1 Authentication Flow

```
User submits credentials (email + password)
    |
    v
Supabase Auth (sign-in via SDK)
    |
    +--> Returns: access_token (JWT), refresh_token
    |
    v
Zustand Auth Store saves tokens + user session
    |
    v
Subsequent API calls:
    +-- Supabase JS:   Authorization header auto-managed by SDK
    +-- Laravel API:   Bearer token in Authorization header
                           |
                           v
                   Laravel verifies via Supabase JWKS endpoint
```

### 8.2 Role-Based Access Control (RBAC)

Three roles are enforced at multiple layers:

| Role | Permissions |
|---|---|
| `admin` | Full access: user management, all records, system configuration |
| `supervisor` | Read all records, approve/reject orders, view all reports |
| `staff` | Read/write own assigned records only |

**Enforcement Layers (defense in depth):**

1. **Supabase RLS** — database-level (always enforced, cannot be bypassed)
2. **Laravel Policies** — controller-level (`$this->authorize(...)`)
3. **React Router Guards** — client-side UI gating (not a security boundary)

### 8.3 Session Management

| Property | Value |
|---|---|
| JWT access token TTL | 1 hour |
| Refresh token TTL | 30 days |
| Auto-refresh | Handled by Supabase JS SDK |
| Logout behavior | Clears Zustand store, redirects to `/login` |

---

## 9. State Management

### 9.1 Zustand Store Inventory

| Store | Responsibility |
|---|---|
| `useAuthStore` | User session, tokens, role, login/logout actions |
| `useUIStore` | Sidebar state, modal visibility, theme, notifications |
| `useOrderStore` | Order filters, selected order, pagination state |
| `useShipmentStore` | Shipment filters, selected shipment |
| `useNotificationStore` | Notification queue, read/unread state |

### 9.2 Store Contract (Immutable during UI sprints)

```typescript
// PRESERVED — never modify during UI-only work
interface AuthStore {
  user: User | null;
  session: Session | null;
  role: 'admin' | 'supervisor' | 'staff' | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### 9.3 Server State (TanStack React Query)

| Property | Value |
|---|---|
| Stale time (lists) | 30 seconds |
| Stale time (detail) | 60 seconds |
| Mutation strategy | Optimistic updates with rollback |
| Re-fetch trigger | Window focus, network reconnect |

---

## 10. API Contracts

### 10.1 Response Envelope

All Laravel API responses use a consistent envelope format:

```json
// Success (list)
{
  "data": [ { "id": "...", "reference_no": "...", "status": "..." } ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 250,
    "last_page": 13
  }
}

// Success (single)
{
  "data": { "id": "...", "reference_no": "...", "status": "..." }
}

// Error
{
  "message": "Human-readable error message",
  "errors": {
    "field_name": ["Validation error detail"]
  }
}
```

### 10.2 API Endpoint Reference

#### Orders

| Method | Endpoint | Auth Required | Min Role |
|---|---|---|---|
| GET | `/api/orders` | Yes | staff |
| GET | `/api/orders/{id}` | Yes | staff |
| POST | `/api/orders` | Yes | staff |
| PUT | `/api/orders/{id}` | Yes | staff (own) / supervisor / admin |
| DELETE | `/api/orders/{id}` | Yes | admin |

#### Shipments

| Method | Endpoint | Auth Required | Min Role |
|---|---|---|---|
| GET | `/api/shipments` | Yes | staff |
| GET | `/api/shipments/{id}` | Yes | staff |
| POST | `/api/shipments` | Yes | supervisor |
| PUT | `/api/shipments/{id}` | Yes | supervisor |
| DELETE | `/api/shipments/{id}` | Yes | admin |

#### Authentication

| Method | Endpoint | Auth Required | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | No | Delegates to Supabase Auth |
| POST | `/api/auth/logout` | Yes | Revokes current session |
| GET | `/api/auth/me` | Yes | Returns profile + role |

#### Admin

| Method | Endpoint | Auth Required | Min Role |
|---|---|---|---|
| GET | `/api/admin/users` | Yes | admin |
| POST | `/api/admin/users` | Yes | admin |
| PUT | `/api/admin/users/{id}` | Yes | admin |
| DELETE | `/api/admin/users/{id}` | Yes | admin |

### 10.3 HTTP Status Code Reference

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 204 | No content (delete) |
| 400 | Bad request / validation error |
| 401 | Unauthenticated |
| 403 | Unauthorized (insufficient role) |
| 404 | Resource not found |
| 422 | Unprocessable entity (business rule violation) |
| 429 | Too many requests (rate limit exceeded) |
| 500 | Internal server error |

---

## 11. UI Modernization Specification

### 11.1 Design Authority

The single approved design reference is the **Pivora CRM Dashboard**:

```
docs/ui-modernization/assets/pivora-dashboard-reference.png
```

All UI components must conform to this visual language. No other design sources are authoritative.

### 11.2 Design Token System

```scss
// ============================================================
// COLOR PALETTE
// ============================================================
$color-primary:          #4F46E5;   // Indigo-600 — primary actions
$color-primary-light:    #EEF2FF;   // Indigo-50  — primary backgrounds
$color-primary-dark:     #4338CA;   // Indigo-700 — hover states
$color-secondary:        #10B981;   // Emerald-500 — success, active
$color-danger:           #EF4444;   // Red-500 — errors, destructive
$color-warning:          #F59E0B;   // Amber-500 — warnings, pending
$color-info:             #3B82F6;   // Blue-500 — informational

// Neutrals
$color-surface:          #FFFFFF;   // Card / component backgrounds
$color-background:       #F9FAFB;   // Page background
$color-border:           #E5E7EB;   // Default borders
$color-border-light:     #F3F4F6;   // Subtle dividers

// Text
$color-text-primary:     #111827;   // Main body text
$color-text-secondary:   #6B7280;   // Muted / label text
$color-text-disabled:    #9CA3AF;   // Disabled state text
$color-text-inverse:     #FFFFFF;   // Text on colored backgrounds

// ============================================================
// TYPOGRAPHY
// ============================================================
$font-family-base:       'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

$font-size-xs:           0.75rem;    //  12px
$font-size-sm:           0.875rem;   //  14px
$font-size-base:         1rem;       //  16px
$font-size-lg:           1.125rem;   //  18px
$font-size-xl:           1.25rem;    //  20px
$font-size-2xl:          1.5rem;     //  24px
$font-size-3xl:          1.875rem;   //  30px
$font-size-4xl:          2.25rem;    //  36px

$font-weight-normal:     400;
$font-weight-medium:     500;
$font-weight-semibold:   600;
$font-weight-bold:       700;

$line-height-tight:      1.25;
$line-height-snug:       1.375;
$line-height-normal:     1.5;
$line-height-relaxed:    1.625;

// ============================================================
// SPACING  (4px base unit)
// ============================================================
$space-1:    0.25rem;    //   4px
$space-2:    0.5rem;     //   8px
$space-3:    0.75rem;    //  12px
$space-4:    1rem;       //  16px
$space-5:    1.25rem;    //  20px
$space-6:    1.5rem;     //  24px
$space-8:    2rem;       //  32px
$space-10:   2.5rem;     //  40px
$space-12:   3rem;       //  48px
$space-16:   4rem;       //  64px
$space-20:   5rem;       //  80px

// ============================================================
// BORDERS
// ============================================================
$border-radius-sm:    0.25rem;    //  4px
$border-radius-md:    0.5rem;     //  8px
$border-radius-lg:    0.75rem;    // 12px
$border-radius-xl:    1rem;       // 16px
$border-radius-2xl:   1.5rem;     // 24px
$border-radius-full:  9999px;     // Pill / circle

$border-width:        1px;
$border-color:        $color-border;

// ============================================================
// SHADOWS
// ============================================================
$shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
$shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
$shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
$shadow-xl:  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

// ============================================================
// TRANSITIONS
// ============================================================
$transition-fast:    all 0.15s ease-in-out;
$transition-base:    all 0.2s ease-in-out;
$transition-slow:    all 0.3s ease-in-out;

// ============================================================
// LAYOUT
// ============================================================
$sidebar-width:         240px;
$sidebar-width-collapsed: 64px;
$header-height:         64px;
$content-max-width:     1280px;
```

### 11.3 Component Specifications

#### Navigation / Sidebar

- Fixed left sidebar: 240px wide (collapsed: 64px)
- Navigation items: icon + label, vertically stacked
- Active state: primary color fill pill, white text
- Hover state: light primary tint background
- Collapse toggle: chevron button at bottom of nav
- Footer section: user avatar, display name, role badge, logout icon

#### Cards

```
+--------------------------------------+
|  Card Header                         |
|  Title (semibold, text-primary)      |
|  Subtitle (sm, text-secondary)       |
|  ----------------------------------  |
|  Content area                        |
|                                      |
|  [Optional footer actions]           |
+--------------------------------------+
```

- Background: `$color-surface`
- Border: `$border-width` solid `$color-border`
- Border radius: `$border-radius-lg`
- Shadow: `$shadow-sm`
- Padding: `$space-6`

#### Data Tables

- Column headers: uppercase, letter-spacing, `font-weight-semibold`, `color-text-secondary`, `font-size-xs`
- Rows: alternating or hover-highlight (`$color-primary-light` at 30% opacity)
- Sortable columns: sort icon visible on column hover
- Row actions: icon-only buttons (edit, view, delete) aligned right
- Pagination bar: previous/next + page number selector + total count
- Empty state: centered illustration, message, optional CTA button

#### Form Elements

- Labels: displayed above input, `$font-weight-semibold`, `$font-size-sm`
- Required indicator: asterisk `*` in `$color-danger` beside label
- Inputs: `$border-width` solid `$color-border`, `$border-radius-md`, `$space-3` padding
- Focus ring: 2px solid `$color-primary`, 2px offset
- Error state: red border, inline error message below field in `$color-danger`
- Disabled state: background `$color-background`, `$color-text-disabled` text, `cursor: not-allowed`

#### Status Badges

| Status | Background | Text Color |
|---|---|---|
| `pending` | `#FEF3C7` (amber-100) | `#92400E` (amber-800) |
| `active` / `dispatched` | `#D1FAE5` (emerald-100) | `#065F46` (emerald-800) |
| `completed` / `delivered` | `#DBEAFE` (blue-100) | `#1E40AF` (blue-800) |
| `cancelled` | `#FEE2E2` (red-100) | `#991B1B` (red-800) |

Style: `border-radius: $border-radius-full`, `font-size: $font-size-xs`, `font-weight: $font-weight-semibold`, `text-transform: uppercase`, `padding: $space-1 $space-3`

#### Buttons

| Variant | Background | Text | Use Case |
|---|---|---|---|
| Primary | `$color-primary` | white | Main CTA (submit, save, create) |
| Secondary | `$color-surface` | `$color-text-primary` | Secondary actions (cancel, back) |
| Destructive | `$color-danger` | white | Irreversible actions (delete) |
| Ghost | transparent | `$color-primary` | Tertiary / icon-only actions |

All buttons: `$border-radius-md`, `$transition-base`, visible focus ring on keyboard navigation, `cursor: not-allowed` + opacity 50% when disabled.

### 11.4 Modernization Rules

**Allowed to change during UI sprints:**
- Layout and visual hierarchy
- All CSS / SCSS
- Inline styles → design token variables
- Typography (family, size, weight)
- Colors, borders, shadows
- Icons (when appropriate)
- Legacy wrapper components
- Legacy utility CSS classes

**NEVER change during UI sprints:**
- Zustand store interfaces and actions
- Supabase queries and subscription callbacks
- Backend API call parameters or response parsing
- Business validation logic
- Authentication / authorization flows
- React Router route definitions
- TypeScript interfaces for domain data models

---

## 12. SCSS Architecture

### 12.1 Architecture Pattern (7-1 Inspired)

```
src/styles/
+-- main.scss                  <- Lightweight entry point (imports only)
+-- base/
|   +-- _reset.scss            <- CSS reset / normalize
|   +-- _typography.scss       <- Base type styles (body, headings, links)
|   +-- _variables.scss        <- All design tokens
+-- themes/
|   +-- _light.scss            <- Light theme CSS custom properties
|   +-- _dark.scss             <- Dark theme (future sprint)
+-- layout/
|   +-- _grid.scss             <- Grid system
|   +-- _sidebar.scss          <- Sidebar layout structure
|   +-- _page.scss             <- Page wrapper and content area
+-- components/
|   +-- _buttons.scss
|   +-- _cards.scss
|   +-- _tables.scss
|   +-- _forms.scss
|   +-- _badges.scss
|   +-- _modals.scss
|   +-- _navigation.scss
+-- pages/
|   +-- _dashboard.scss
|   +-- _orders.scss
|   +-- _shipments.scss
|   +-- _admin.scss
+-- utilities/
    +-- _spacing.scss          <- Margin / padding helpers
    +-- _display.scss          <- Flex / grid utilities
    +-- _text.scss             <- Text alignment, truncation
```

### 12.2 Migration Policy

SCSS architecture migration is **incremental, never big-bang**:

- Migrate styles when their component or page is modernized
- Remove obsolete legacy styles after each replacement
- `main.scss` must remain a lightweight entry point
- By Sprint 10, `main.scss` should contain only `@use` / `@forward` import statements

### 12.3 Naming Conventions

```scss
// BEM-inspired component naming
.card { }
.card__header { }
.card__body { }
.card__footer { }
.card--elevated { }        // Modifier

// State classes
.is-active { }
.is-loading { }
.is-disabled { }
.is-open { }

// Utility classes (prefixed with u-)
.u-mt-4 { margin-top: $space-4; }
.u-text-center { text-align: center; }
.u-sr-only { /* screen-reader only */ }
```

---

## 13. Security Model

### 13.1 Defense in Depth

| Layer | Mechanism |
|---|---|
| Database | PostgreSQL Row Level Security (always enforced) |
| API | Laravel Sanctum JWT + Policy authorization |
| Client | Zustand-based route guards (UI gating only) |
| Transport | HTTPS (TLS 1.3) |
| Secrets | `.env` files — never committed to version control |

### 13.2 Security Invariants (Never Violate)

1. RLS is **always enabled** on all tables — bypass is never acceptable
2. No sensitive tokens stored in `localStorage` — memory or httpOnly cookies only
3. All user inputs are validated **server-side** (Laravel Form Requests)
4. Supabase **service-role key** is backend-only — never exposed to the frontend
5. Frontend uses only the **anon key** — access scoped exclusively by RLS policies
6. All API endpoints require authentication — no accidental public exposure

### 13.3 Environment Variables

```dotenv
# Frontend (.env / .env.production)
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=[anon_key]
VITE_API_BASE_URL=https://api.soc5-outbound.internal

# Backend (.env)
SUPABASE_URL=https://[project-ref].supabase.co
SUPABASE_SERVICE_KEY=[service_role_key]      # NEVER expose to frontend
DB_CONNECTION=pgsql
DB_HOST=[supabase-pooler-host]
DB_PORT=5432
DB_DATABASE=postgres
DB_USERNAME=postgres
DB_PASSWORD=[password]
SANCTUM_STATEFUL_DOMAINS=localhost:5173
APP_ENV=production
APP_DEBUG=false
```

---

## 14. Development Workflow

### 14.1 Sprint Workflow (Mandatory Sequence)

Every implementation sprint **must** follow this exact sequence:

```
Step 1:  Use Code Review Graph (CRG) to analyze the repository
Step 2:  Determine dependency graph of affected modules
Step 3:  Determine impact radius of proposed changes
Step 4:  Read ONLY the files identified by CRG
Step 5:  Explain the implementation plan clearly
Step 6:  Wait for explicit user approval
Step 7:  Implement the approved changes
Step 8:  Build and validate (npm run build / php artisan route:list)
Step 9:  Verify architectural integrity (no broken imports / contracts)
Step 10: Report any technical debt discovered
Step 11: Update docs/refactoring/REFACTORING_BACKLOG.md
Step 12: STOP
```

### 14.2 Verb Interpretation (Official Definitions)

| Verb | Exact Meaning |
|---|---|
| **Implement** | Create or add a new feature or capability |
| **Refine** | Make targeted presentation adjustments without structural changes |
| **Adjust** | Modify specific visual properties only |
| **Remove** | Eliminate obsolete or unused code |
| **Restructure** | Reorganize architecture without changing observable behavior |

> [!WARNING]
> "Refine" and "Adjust" are **NOT** permission to redesign components or alter structure. Do not interpret them that way.

### 14.3 Git Commit Convention

```
feat(orders): add shipment dispatch modal
fix(auth): resolve token refresh race condition
refactor(sidebar): extract navigation item component
style(dashboard): apply Pivora card design tokens
docs(spec): update API endpoint reference table
chore(deps): bump react-query to 5.x
```

### 14.4 Build Commands Reference

```bash
# Frontend
npm install                  # Install dependencies
npm run dev                  # Start Vite dev server (port 5173)
npm run build                # Production build to /dist
npm run preview              # Preview production build locally
npm run typecheck            # TypeScript validation (no emit)
npm run lint                 # ESLint

# Backend
composer install             # Install PHP dependencies
php artisan serve            # Start Laravel dev server
php artisan migrate          # Run pending migrations
php artisan migrate:status   # Check migration status
php artisan route:list       # Audit registered routes
php artisan test             # Run PHPUnit tests
```

---

## 15. AI-Assisted Development Policy

### 15.1 Mandatory Pre-Implementation Flow

```
BEFORE reading source files  -->  use CRG semantic_search_nodes_tool
BEFORE modifying code        -->  use CRG get_impact_radius_tool
BEFORE implementation        -->  use CRG get_affected_flows_tool
AFTER implementation         -->  verify with CRG detect_changes_tool
```

> [!IMPORTANT]
> Code Review Graph (CRG) MUST be used before Grep, Glob, or direct file reads.
> The graph is faster, cheaper (fewer tokens), and provides structural context
> that manual file scanning cannot.

### 15.2 CRG Tool Reference

| Tool | When to Use |
|---|---|
| `detect_changes_tool` | Reviewing code changes — provides risk-scored analysis |
| `get_review_context_tool` | Source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a proposed change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions or classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `list_communities_tool` | Discovering module groupings |
| `refactor_tool` | Planning renames, finding dead code |

### 15.3 AI Agent Responsibilities

| Agent | Primary Role |
|---|---|
| AGY (Antigravity) | Primary implementation, planning, architecture decisions |
| Gemini CLI | Scripted tasks, batch operations, quick lookups |
| Codex | Code generation support |
| Claude Code | Additional implementation assistance |

**All agents must:**
1. Read `AGENTS.md` before any task
2. Use CRG before reading source files
3. Never modify backend, API contracts, or business logic during UI sprints
4. Log all discovered technical debt to `REFACTORING_BACKLOG.md`
5. Follow the sprint workflow sequence in full

---

## 16. Refactoring & Technical Debt Policy

### 16.1 Backlog File Location

```
docs/refactoring/REFACTORING_BACKLOG.md
```

### 16.2 Entry Format

Each backlog entry must include all of the following fields:

| Field | Description |
|---|---|
| **Category** | e.g., Performance, Architecture, DX, Security, Testing |
| **Priority** | High / Medium / Low |
| **Sprint Discovered** | Sprint number or date discovered |
| **Recommendation** | Specific, actionable improvement description |
| **Status** | Open / In Progress / Resolved |

### 16.3 Policy Rules

- Do **NOT** expand the current sprint scope to address discovered debt
- Do **NOT** refactor unless it is explicitly scheduled in the sprint plan
- Do **NOT** include unscheduled cleanup in unrelated pull requests
- All discovered debt goes into the backlog immediately
- Backlog is reviewed on planning cadence by the engineering lead

---

## 17. Non-Functional Requirements

### 17.1 Performance Targets

| Metric | Target |
|---|---|
| Largest Contentful Paint (LCP) | < 2.5 seconds on 4G |
| Time to Interactive (TTI) | < 3.5 seconds |
| Total Blocking Time (TBT) | < 200ms |
| API response time (p95) | < 500ms |
| Supabase query time (p95) | < 200ms |
| Initial bundle size (gzipped) | < 300KB |
| Lighthouse Performance Score | >= 85 |

### 17.2 Reliability Targets

| Metric | Target |
|---|---|
| API Uptime | 99.5% |
| Error rate | < 0.5% of all requests |
| Realtime reconnection | Automatic within 5 seconds |

### 17.3 Accessibility (A11y) Requirements

- WCAG 2.1 Level AA compliance target
- All interactive elements must be keyboard-navigable
- Focus rings visible on keyboard navigation (never `outline: none` without replacement)
- ARIA labels on all icon-only buttons
- Color contrast ratio >= 4.5:1 for normal text
- Color contrast ratio >= 3:1 for large text and UI components
- Screen reader tested for core user flows

### 17.4 Responsive Design Breakpoints

| Breakpoint | Width Range | Priority |
|---|---|---|
| Mobile | 0 – 767px | Best-effort |
| Tablet | 768 – 1023px | Supported |
| Desktop | 1024 – 1279px | Primary |
| Wide | 1280px+ | Primary |

The platform is **desktop-first**. Tablet is supported. Mobile is best-effort.

### 17.5 Browser Support Matrix

| Browser | Minimum Version |
|---|---|
| Google Chrome | 110+ |
| Mozilla Firefox | 110+ |
| Apple Safari | 16+ |
| Microsoft Edge | 110+ |

---

## 18. Deployment & Infrastructure

### 18.1 Environment Summary

| Environment | Purpose | Notes |
|---|---|---|
| Local Dev | Developer machines | Vite (port 5173) + Laravel serve |
| Staging | QA and integration testing | Mirrors production config |
| Production | Live environment | Full observability enabled |

### 18.2 Frontend Deployment Pipeline

```
Source Code
    |
    v
npm run build
    |
    v
/dist (static assets: HTML, JS, CSS, media)
    |
    v
CDN / Nginx web server
    |
    v
Users
```

- Environment variables injected at build time via `.env.production`
- All assets are cache-busted via content hashes in filenames
- `index.html` served for all routes (SPA mode), with Nginx try_files fallback

### 18.3 Backend Deployment Pipeline

```
Source Code
    |
    v
composer install --no-dev --optimize-autoloader
    |
    v
PHP-FPM + Nginx
    |
    v
Post-deploy commands:
    php artisan migrate --force
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan event:cache
```

### 18.4 Supabase

- Managed cloud instance on Supabase Cloud (no self-hosted infrastructure)
- Migrations tracked via Supabase dashboard DDL and Laravel migrations
- Realtime enabled per-table via Supabase dashboard configuration
- Backups: daily automated via Supabase Cloud
- Connection pooling: via Supabase Pooler (PgBouncer)

---

## 19. Glossary

| Term | Definition |
|---|---|
| **AGY** | Antigravity — the primary AI coding assistant for this project |
| **CRG** | Code Review Graph — MCP-based repository knowledge and analysis tool |
| **RLS** | Row Level Security — PostgreSQL feature for enforcing data access at row level |
| **RBAC** | Role-Based Access Control — permission model based on user roles |
| **Pivora** | The approved design system reference (Pivora CRM Dashboard) |
| **Supabase** | Backend-as-a-Service providing PostgreSQL, Auth, Realtime, and Storage |
| **PostgREST** | Auto-generated REST API layer over PostgreSQL, managed by Supabase |
| **Sanctum** | Laravel's lightweight API authentication package using bearer tokens |
| **Zustand** | Lightweight, hook-based React global state management library |
| **Sprint** | A bounded, scoped implementation unit with a defined stop condition |
| **Impact Radius** | The set of modules and files affected by a proposed code change |
| **SOC5** | System Operations Center 5 — the internal codename for this platform |
| **BaaS** | Backend-as-a-Service |
| **SPA** | Single Page Application |
| **TTL** | Time To Live (for tokens and cache entries) |
| **LCP** | Largest Contentful Paint (Core Web Vital for load performance) |
| **TTI** | Time to Interactive (Core Web Vital for interactivity) |

---

> **Document Maintenance Policy**
>
> This document is a **living specification**. It must be updated whenever:
> - New features are added to the platform
> - API contracts change (requires explicit approval)
> - The technology stack changes
> - Security policies are updated
> - New AI agents or tools are integrated into the workflow
> - Architectural decisions are made that differ from this spec
>
> All AI agents (AGY, Gemini CLI, Codex, Claude Code) must treat this document
> as the **authoritative technical reference** for the SOC5-Outbound platform.
