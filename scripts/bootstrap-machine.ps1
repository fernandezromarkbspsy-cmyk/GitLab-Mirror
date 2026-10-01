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

foreach ($package in $packages) {
    winget install `
        --id $package `
        --accept-package-agreements `
        --accept-source-agreements
}

Write-Host "Refresh your PowerShell session so PATH changes take effect."

& (Join-Path $Root "scripts\setup-local.ps1")
& (Join-Path $Root "scripts\check-local.ps1") 