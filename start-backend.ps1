$ErrorActionPreference = 'Stop'
$env:PHPRC = Join-Path $PSScriptRoot 'tools'
Set-Location (Join-Path $PSScriptRoot 'backend')

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
}

if (-not (Test-Path 'vendor')) {
    composer install
    if ($LASTEXITCODE -ne 0) { throw 'Composer dependency installation failed.' }
}

if (-not (Select-String -Path '.env' -Pattern '^APP_KEY=base64:' -Quiet)) {
    php artisan key:generate --force
    if ($LASTEXITCODE -ne 0) { throw 'Laravel key generation failed.' }
}
php artisan serve
