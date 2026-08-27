# Cloudflare Tunnel Setup

This guide shows how to expose the SOC 5 Outbound frontend and backend through
a single Cloudflare-managed domain.

Use this setup when you want:

- a public frontend URL for browser access
- backend API requests routed under `/api`
- clean Supabase auth redirects that point to the right origin

## Local ports

The project runs these services locally:

- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:8000`

If you use Docker instead of the Vite dev server, the web container is on
`http://127.0.0.1:8080`, but this guide focuses on the standard frontend plus
backend split.

## What you need

- `backend/.env` and `frontend/.env` already created
- Supabase URL and publishable key configured
- Cloudflare Tunnel installed through `cloudflared`
- A tunnel credentials file for the named tunnel, stored in
  `C:\Users\spxph4227\.cloudflared\`
- The domain `soc5outboundops.app` is added to Cloudflare and points to the
  tunnel

## Local env values before tunneling

Start with these values:

```dotenv
# backend/.env
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:5173

# frontend/.env
VITE_API_URL=/api
```

After tunneling, the browser will use `https://soc5outboundops.app` and the API
will remain under `/api`.

## Step 1: Start the backend

From the repository root:

```powershell
.\start-backend.ps1
```

Confirm Laravel is running on `http://127.0.0.1:8000`.

## Step 2: Start the frontend

Open a second terminal in `frontend/`:

```powershell
npm install
npm run dev
```

Confirm Vite is running on `http://localhost:5173`.

## Step 3: Restore or create the tunnel credentials file

The error `tunnel credentials file not found` means the named tunnel exists in
Cloudflare, but this machine does not have the JSON credentials file for it.

You need a file like:

```text
C:\Users\spxph4227\.cloudflared\0f1afc50-0389-4468-9de9-1e49e48a3626.json
```

If that file already exists on another machine, copy it here.

If it does not exist anywhere, create or re-create the tunnel in Cloudflare so
that a new credentials file is issued for this machine.

## Step 4: Create the tunnel config file

Create `C:\Users\spxph4227\.cloudflared\config.yml` with ingress rules for both
local services.

Example:

```yaml
tunnel: 0f1afc50-0389-4468-9de9-1e49e48a3626
credentials-file: C:\Users\spxph4227\.cloudflared\0f1afc50-0389-4468-9de9-1e49e48a3626.json

ingress:
  - hostname: soc5outboundops.app
    service: http://localhost:5173
  - hostname: soc5outboundops.app
    path: /api/*
    service: http://127.0.0.1:8000
  - service: http_status:404
```

Replace the tunnel UUID and credentials path with the values Cloudflare issued
for your new named tunnel.

## Step 5: Start the named tunnel

Run the named tunnel:

```powershell
cloudflared tunnel run 0f1afc50-0389-4468-9de9-1e49e48a3626
```

`cloudflared tunnel run` uses the tunnel UUID and the credentials file in
`C:\Users\spxph4227\.cloudflared\config.yml`.

Vite must allow the Cloudflare frontend hostname. This repo already does that
through `frontend/vite.config.ts` with `server.allowedHosts:
['soc5outboundops.app', '.trycloudflare.com']`.

## Step 6: Update the frontend environment

Edit `frontend/.env` and keep the API path on the same origin:

```dotenv
VITE_API_URL=/api
```

This makes the browser call Laravel through the same public domain.

## Step 7: Update the backend environment

Edit `backend/.env` and point `FRONTEND_URL` to the public frontend URL:

```dotenv
APP_URL=http://127.0.0.1:8000
FRONTEND_URL=https://soc5outboundops.app
```

Keep `APP_URL` on the local Laravel address unless you are also deploying the
backend behind a different public origin.

## Step 8: Restart both services

Restart Laravel and the frontend so the new env values take effect:

```powershell
# backend terminal
.\start-backend.ps1

# frontend terminal
npm run dev
```

If you already had the tunnels open, you do not need to recreate them unless
their URLs changed.

## Step 9: Update Supabase settings

If login or session redirects are part of your flow, update Supabase with the
new public frontend URL:

- Authentication site URL
- Allowed redirect URLs
- Any provider callback URLs that use the frontend origin

Use the public frontend URL, not the backend URL, for browser auth redirects.

## Step 10: Test the split setup

Open the public frontend URL in a browser:

```text
https://soc5outboundops.app
```

Then confirm:

- the app loads
- login works
- API requests go to `https://soc5outboundops.app/api`
- redirects return to `https://soc5outboundops.app`

## Troubleshooting

### Frontend loads but API calls fail

Make sure `frontend/.env` keeps the same-origin API path:

```dotenv
VITE_API_URL=/api
```

### Login redirects to localhost

Update Supabase and `FRONTEND_URL` to `https://soc5outboundops.app`.

### CORS or origin errors appear

Make sure `FRONTEND_URL` in `backend/.env` matches the exact Cloudflare
frontend URL, including `https://`.

### The backend URL opens but the app is blank

That usually means the frontend is still pointing at `/api` or an old local
value. Recheck `frontend/.env` and restart Vite.

### Tunnel only works on the host machine

Confirm each tunnel points to the correct local port:

- `5173` for the frontend
- `8000` for the backend

### `cloudflared tunnel run` says credentials file not found

Make sure the JSON file named after the tunnel UUID exists in
`C:\Users\spxph4227\.cloudflared\`. If it does not exist, recreate the tunnel or
copy the credentials file from the machine that created it.

### I only have `trycloudflare.com` URLs

That means you are using quick tunnels. Quick tunnels are fine for temporary
testing, but they are not the right input for a named tunnel `config.yml`.
For this project, use the managed domain `soc5outboundops.app` and route the API
under `/api`.

## Recommended order

When setting this up from scratch, follow this sequence:

1. Start the backend.
2. Start the frontend.
3. Restore or create the tunnel credentials file.
4. Create `config.yml`.
5. Run the named tunnel.
6. Update `frontend/.env` and `backend/.env`.
7. Restart both apps.
8. Update Supabase URLs.
9. Test login and API requests from the public frontend URL.
