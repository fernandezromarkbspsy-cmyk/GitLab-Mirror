# SOC 5 Outbound

SOC 5 Outbound is a lightweight, role-aware truck request portal for Shopee
Sorting Facility Dispatch. It replaces the Google Sheets workflow with controlled
request approvals, truck assignment, docking confirmation, realtime updates, and
an auditable event history.

## Technology

- Laravel 12 modular-monolith API on PHP 8.4
- React 19, TypeScript, and Vite
- TanStack Query for server state
- Zustand for client UI state
- Sass for styling
- Supabase PostgreSQL, Auth, and Realtime
- NGINX and Docker for deployment

The MVP intentionally avoids microservices, Redis, Pinecone, and dedicated load
balancers. These should only be introduced after production measurements establish
a concrete need. The rationale is documented in [System Design](docs/system-design.md).

## Project structure

```text
backend/                 Laravel API
frontend/                React/Vite application
supabase/migrations/     PostgreSQL schema and RLS policies
docs/                    Product and architecture documents
tools/php.ini            Project-local PHP configuration
setup-backend.ps1        Backend installation and validation
start-backend.ps1        Backend development server
```

## Quick start on this Windows machine

No administrator access is required. PHP and Composer use the project-local
configuration in `tools/php.ini`.

1. Configure `backend/.env` and `frontend/.env` as described in the
   [Setup Guide](docs/setup-guide.md).
2. Initialize the backend:

   ```powershell
   .\setup-backend.ps1
   ```

3. Start Laravel in the first terminal:

   ```powershell
   .\start-backend.ps1
   ```

4. Start React in a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Open `http://localhost:5173`.

Laravel runs on `http://127.0.0.1:8000`; Vite proxies browser `/api` requests to
that address.

## Supabase initialization

Run [001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) once in
the Supabase SQL Editor. Then create Auth users and matching `public.profiles`
rows. The profile UUID must equal the corresponding `auth.users.id`.

The publishable key may be used in the browser. Never put the service-role key in
`frontend/.env`, source control, screenshots, or client-side code.

## Validation

```powershell
# Backend
$env:PHPRC = (Resolve-Path .\tools).Path
cd backend
php artisan test
.\vendor\bin\pint --test

# Frontend
cd ..\frontend
npm run build
```

## Documentation

- [Setup Guide](docs/setup-guide.md)
- [AWS Free Tier Hosting Guide](docs/aws-free-tier-hosting.md)
- [Supabase Auth Setup](docs/supabase-auth-setup.md)
- [Outbound Data Import](docs/outbound/IMPORT.md)
- [Product Requirements](docs/prd.md)
- [System Design](docs/system-design.md)
- [Wireframes](docs/wireframes.md)
- [Feature Breakdown](docs/feature-breakdown.md)
- [System Blueprint](docs/system-blueprint.md)
