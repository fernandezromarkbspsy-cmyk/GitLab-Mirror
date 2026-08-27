$ErrorActionPreference = 'Stop'
$env:PHPRC = Join-Path $PSScriptRoot 'tools'
Set-Location (Join-Path $PSScriptRoot 'backend')

php --version
if ($LASTEXITCODE -ne 0) { throw 'PHP failed to start.' }
composer --version
if ($LASTEXITCODE -ne 0) { throw 'Composer failed to start.' }
composer install --no-interaction --prefer-dist
if ($LASTEXITCODE -ne 0) { throw 'Composer dependency installation failed.' }

if (-not (Test-Path '.env')) {
    Copy-Item '.env.example' '.env'
}

php artisan key:generate --force
if ($LASTEXITCODE -ne 0) { throw 'Laravel key generation failed.' }
php artisan about
if ($LASTEXITCODE -ne 0) { throw 'Laravel failed to boot.' }
