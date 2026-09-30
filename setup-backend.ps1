$ErrorActionPreference = 'Stop'
$env:PHPRC = Join-Path $PSScriptRoot 'tools\php.ini'
# Keep setup and all project-launched PHP commands off the machine proxy.
foreach ($name in 'HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy') {
    Remove-Item "Env:$name" -ErrorAction SilentlyContinue
}
$env:NO_PROXY = '*'
$env:no_proxy = '*'
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

# C:\Users\phlspxuser\OneDrive\development\setup-backend.ps1

$phpIni = (php --ini | Select-String "Loaded Configuration File").ToString().Split(":", 2)[1].Trim().Trim('"')
$caPath = "$HOME\scoop\persist\php\cacert.pem"

if (-not (Test-Path $caPath)) {
    New-Item -ItemType Directory -Force -Path (Split-Path $caPath) | Out-Null

    Invoke-WebRequest `
        -Uri "https://curl.se/ca/cacert.pem" `
        -OutFile $caPath
}

$phpIniContent = Get-Content $phpIni -Raw

$curlLine = "curl.cainfo=`"$caPath`""
$opensslLine = "openssl.cafile=`"$caPath`""

if ($phpIniContent -match "(?m)^\s*;?\s*curl\.cainfo\s*=.*$") {
    $phpIniContent = $phpIniContent -replace "(?m)^\s*;?\s*curl\.cainfo\s*=.*$", $curlLine
}
else {
    $phpIniContent += "`r`n$curlLine"
}

if ($phpIniContent -match "(?m)^\s*;?\s*openssl\.cafile\s*=.*$") {
    $phpIniContent = $phpIniContent -replace "(?m)^\s*;?\s*openssl\.cafile\s*=.*$", $opensslLine
}
else {
    $phpIniContent += "`r`n$opensslLine"
}

Set-Content -Path $phpIni -Value $phpIniContent -Encoding UTF8

Write-Host "PHP CA certificate configured:"
Write-Host $caPath
