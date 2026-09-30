$ErrorActionPreference = 'Stop'
$env:PHPRC = Join-Path $PSScriptRoot 'tools\php.ini'
# This project uses direct outbound TLS connections; do not inherit a
# machine-level proxy such as the unused local 127.0.0.1:9 proxy.
foreach ($name in 'HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy') {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
}
$env:NO_PROXY = '*'
$env:no_proxy = '*'
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
php artisan serve --no-reload
