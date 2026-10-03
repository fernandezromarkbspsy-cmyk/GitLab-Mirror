$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
& (Join-Path $projectRoot 'scripts\setup-local.ps1') -SkipEnvFiles
if ($LASTEXITCODE -ne 0) { throw 'Local environment setup failed.' }
$env:PHPRC = Join-Path $projectRoot 'tools\php.local.ini'
# Keep setup and all project-launched PHP commands off the machine proxy.
foreach ($name in 'HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy') {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
}
$env:NO_PROXY = '*'
$env:no_proxy = '*'
Set-Location (Join-Path $projectRoot 'backend')

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
