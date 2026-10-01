# SOC5 Outbound Development Prerequisites

This document describes the setup required before developing or running the
SOC5 Outbound project on a new Windows laptop.

The setup is designed to work from any checkout location. Do not assume a
specific Windows username, OneDrive directory, Scoop installation path, or
project path.

## Commands

Run the following commands from the repository root. Use the commands that
apply to the work being done.

```powershell
# Preferred tool installation through Scoop
scoop bucket add extras
scoop install php composer nodejs-lts deno cloudflared supabase
scoop install docker  # optional; use when container development is required

# Prepare the project and validate the machine
.\scripts\setup-local.ps1
.\scripts\check-local.ps1
.\scripts\check-local.ps1 -RequireCloudflare  # when using the tunnel

# Create local environment files if they do not exist
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env

# Configure a local PHP CA bundle, if required
$env:PHP_CA_BUNDLE = "C:\path\to\cacert.pem"
Invoke-WebRequest `
    -Uri "https://curl.se/ca/cacert.pem" `
    -OutFile (Join-Path (Resolve-Path .\tools).Path 'cacert.pem')
.\scripts\setup-local.ps1 -SkipEnvFiles

# Authenticate user-specific services when needed
cloudflared tunnel login
supabase login

# Start development
$env:CLOUDFLARE_TUNNEL_ID = "your-local-tunnel-id"  # optional override
.\start-dev.ps1
```

If Scoop is unavailable, install the required tools manually or use the
winget fallback in the automated bootstrap script below.

## Optional automated bootstrap script

Save this as `scripts/bootstrap-machine.ps1` when tool-installation
automation is approved:

```powershell
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

$packages = @(
    "PHP.PHP",
    "Composer.Composer",
    "OpenJS.NodeJS.LTS",
    "DenoLand.Deno",
    "Docker.DockerDesktop",
    "Cloudflare.cloudflared"
)

if (Get-Command scoop -ErrorAction SilentlyContinue) {
    scoop bucket add extras
    scoop install php composer nodejs-lts deno cloudflared supabase
} else {
    foreach ($package in $packages) {
        winget install `
            --id $package `
            --accept-package-agreements `
            --accept-source-agreements
    }
}

Write-Host "Refresh your PowerShell session so PATH changes take effect."

& (Join-Path $Root "scripts\setup-local.ps1")
& (Join-Path $Root "scripts\check-local.ps1")
```

Run it with:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\bootstrap-machine.ps1
```

## Required tools

Install or make available on `PATH`:

- PHP 8.2 or newer
- Composer
- Node.js and npm
- Git

Optional tools, depending on the work:

- Deno for Supabase Edge Functions
- Docker Desktop for container-based development
- Supabase CLI for local Supabase workflows
- `cloudflared` for the development tunnel
- 1Password CLI (`op`) for approved secret-management workflows

Most development tools are installed through Scoop on the team's Windows
machines. The project scripts detect tools from `PATH`; they do not depend on
Scoop's installation directory or any fixed Windows username.

Run `Set-ExecutionPolicy -Scope Process Bypass` and
`.\scripts\bootstrap-machine.ps1` from the command block at the top. If a
package is already installed, `winget` may report that it is present. Refresh
the PowerShell session after installation so newly installed commands are
visible.

## Project-local setup

Run `scripts/setup-local.ps1` using the command block at the top.

The script:

- Resolves the repository root from `$PSScriptRoot`.
- Creates missing `.env` files from tracked `.env.example` templates.
- Detects PHP, Composer, Node/npm, Deno, Docker, Supabase, and cloudflared.
- Detects the active PHP installation and generates ignored
  `tools/php.local.ini`.
- Uses `tools/cacert.pem` or `PHP_CA_BUNDLE` when available.
- Does not overwrite existing environment files or commit credentials.

Use `scripts/setup-local.ps1 -SkipEnvFiles` when only the PHP configuration
needs to be refreshed.

## Environment files and secrets

Copy the templates using the command block at the top when the local files do
not already exist.

The following remain machine-local and Git-ignored:

- `.env`
- `backend/.env`
- `frontend/.env`
- `tools/php.local.ini`
- `tools/cacert.pem`
- Google service-account files
- Cloudflare certificates and local configuration

Populate secrets from the approved secret manager or deployment system. Never
copy secrets through Git, commit them to `.env.example`, or place them in
frontend source code.

Required credentials may include:

- Supabase URL and keys
- SeaTalk application ID and secret
- Sentry DSN, if monitoring is enabled
- Google Sheets service-account credentials, if synchronization is enabled
- Cloudflare tunnel configuration and credentials

The repository cannot safely generate these credentials automatically.

## PHP CA certificate

If PHP reports TLS or `cURL error 60` failures, place a CA bundle at:

```text
tools/cacert.pem
```

Alternatively set `PHP_CA_BUNDLE`, then rerun
`scripts/setup-local.ps1 -SkipEnvFiles` using the commands at the top.

Do not disable TLS verification.

## Cloudflare and Supabase first-run authentication

Cloudflare authentication is user-specific and should be completed locally
using `cloudflared tunnel login` from the command block at the top.

The default user configuration is normally discovered under:
`%USERPROFILE%\.cloudflared`. A custom location can be supplied with
`CLOUDFLARED_CONFIG`.

For Supabase CLI workflows, use `supabase login` from the command block at the
top.

These commands should be run interactively on each laptop. Their credentials
must not be stored in this repository.

## Pre-development validation

Before starting the application, run the appropriate `check-local.ps1`
command from the command block at the top.

The checker validates:

- Repository structure
- Required environment files
- Required tools
- PHP project configuration and CA bundle
- Default local ports `8000` and `5173`
- Cloudflare and Supabase availability when requested
- Git-ignore protection for local configuration and credentials

## Start development

After validation, run `start-dev.ps1` from the command block at the top.

The backend runs on `http://127.0.0.1:8000`, and the Vite frontend runs on
port `5173`. The Cloudflare tunnel ID can be overridden without editing the
script:

Set `CLOUDFLARE_TUNNEL_ID` before starting if the default tunnel ID does not
apply to the laptop.

## Expected manual setup per laptop

The following steps remain intentionally user-specific:

1. Install or approve the required local tools.
2. Run `scripts/setup-local.ps1`.
3. Add local secrets to ignored environment files.
4. Provide a CA bundle if the PHP installation does not provide one.
5. Authenticate cloudflared and Supabase interactively when needed.
6. Run `scripts/check-local.ps1` before development.

This separation keeps the Git branch portable while preserving credentials,
certificates, and account access controls on each laptop.
