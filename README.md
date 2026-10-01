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

cloudflared tunnel --config "C:\Users\SPXPH4227\.cloudflared\config.yml" run soc5-outbound
cloudflared tunnel --protocol http2 run soc5-outbound

1. Configure `backend/.env` and `frontend/.env` as described in the
   [Setup Guide](docs/setup-guide.md).
2. Initialize the backend: 

   ```powershell
   .\setup-backend.ps1
   ```

3. Start the backend, frontend, and Cloudflare tunnel together:

   ```powershell
   .\start-dev.ps1
   ```

   To use a different named tunnel:

   ```powershell
   .\start-dev.ps1 -TunnelId '<tunnel-id>'
   ```

   The terminal streams labeled backend, frontend, and Cloudflare logs and
   reports `RUNNING` or `FAILED` for each service.

4. Open `http://localhost:5173`, or the Cloudflare hostname when the tunnel is
   running.

Laravel runs on `http://127.0.0.1:8000`; Vite proxies browser `/api` requests to
that address.

## Supabase initialization

Run [001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) once in
the Supabase SQL Editor. Then create Auth users and matching `public.profiles`
rows. The profile UUID must equal the corresponding `auth.users.id`.

The publishable key may be used in the browser. Never put the service-role key in
`frontend/.env`, source control, screenshots, or client-side code.

## Validation


.\scripts\preflight.ps1 -Fix

Get-Process node -ErrorAction SilentlyContinue |Stop-Process -Force

Remove-Item -Recurse -Force .\Frontend\node_modules
/frontend
npm ci

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
- [Supabase Auth Setup](docs/supabase-auth-setup.md)
- [Outbound Data Import](docs/outbound/IMPORT.md)
- [Product Requirements](docs/prd.md)
- [System Design](docs/system-design.md)
- [Wireframes](docs/wireframes.md)
- [Feature Breakdown](docs/feature-breakdown.md)
- [System Blueprint](docs/system-blueprint.md)
