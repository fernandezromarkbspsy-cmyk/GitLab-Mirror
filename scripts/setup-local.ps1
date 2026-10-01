param(
    [switch]$SkipEnvFiles
)

$ErrorActionPreference = 'Stop'

$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$ToolsRoot = Join-Path $ProjectRoot 'tools'
$BackendRoot = Join-Path $ProjectRoot 'backend'
$FrontendRoot = Join-Path $ProjectRoot 'frontend'
$LocalPhpIni = Join-Path $ToolsRoot 'php.local.ini'

function Get-ToolPath {
    param([Parameter(Mandatory = $true)][string]$Name)

    $command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $command) { return $null }
    return $command.Source
}

function Ensure-EnvFile {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$Template
    )

    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        Copy-Item -LiteralPath $Template -Destination $Path
        Write-Host "Created $([System.IO.Path]::GetRelativePath($ProjectRoot, $Path))"
    }
}

function Find-CaBundle {
    $candidates = @(
        $env:PHP_CA_BUNDLE,
        (Join-Path $ToolsRoot 'cacert.pem'),
        (Join-Path $env:USERPROFILE '.config\php\cacert.pem'),
        (Join-Path $env:USERPROFILE 'scoop\persist\php\cacert.pem')
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_ -PathType Leaf) }

    return $candidates | Select-Object -First 1
}

if (-not $SkipEnvFiles) {
    Ensure-EnvFile (Join-Path $ProjectRoot '.env') (Join-Path $ProjectRoot '.env.example')
    Ensure-EnvFile (Join-Path $BackendRoot '.env') (Join-Path $BackendRoot '.env.example')
    Ensure-EnvFile (Join-Path $FrontendRoot '.env') (Join-Path $FrontendRoot '.env.example')
}

New-Item -ItemType Directory -Force -Path $ToolsRoot | Out-Null

if (-not (Test-Path -LiteralPath $LocalPhpIni -PathType Leaf)) {
    Copy-Item -LiteralPath (Join-Path $ToolsRoot 'php.ini') -Destination $LocalPhpIni
}

$caBundle = Find-CaBundle
$localPhpContent = Get-Content -LiteralPath $LocalPhpIni -Raw
$phpCommand = Get-ToolPath 'php'
if ($phpCommand) {
    $phpIniInfo = (& $phpCommand --ini 2>&1 | Out-String)
    if ($phpIniInfo -match 'Loaded Configuration File:\s+"(?<path>[^"]+)"') {
        $extensionDir = Join-Path (Split-Path $matches.path -Parent) 'ext'
        if (Test-Path -LiteralPath $extensionDir -PathType Container) {
            $escapedExtensionDir = $extensionDir.Replace('\', '\\').Replace('"', '\"')
            if ($localPhpContent -match '(?m)^\s*;?\s*extension_dir\s*=') {
                $localPhpContent = $localPhpContent -replace '(?m)^\s*;?\s*extension_dir\s*=.*$', ('extension_dir="{0}"' -f $escapedExtensionDir)
            } else {
                $localPhpContent = "$(('extension_dir=""{0}""' -f $escapedExtensionDir))`r`n$localPhpContent"
            }
        }
    }
}
if ($caBundle) {
    $escapedCa = $caBundle.Replace('\', '\\').Replace('"', '\"')
    if ($localPhpContent -match '(?m)^\s*;?\s*curl\.cainfo\s*=') {
        $localPhpContent = $localPhpContent -replace '(?m)^\s*;?\s*curl\.cainfo\s*=.*$', ('curl.cainfo="{0}"' -f $escapedCa)
    } else {
        $localPhpContent += "`r`n$(( 'curl.cainfo="{0}"' -f $escapedCa ))"
    }
    if ($localPhpContent -match '(?m)^\s*;?\s*openssl\.cafile\s*=') {
        $localPhpContent = $localPhpContent -replace '(?m)^\s*;?\s*openssl\.cafile\s*=.*$', ('openssl.cafile="{0}"' -f $escapedCa)
    } else {
        $localPhpContent += "`r`n$(( 'openssl.cafile="{0}"' -f $escapedCa ))"
    }
    Set-Content -LiteralPath $LocalPhpIni -Value $localPhpContent -Encoding UTF8
}

$env:PHPRC = $LocalPhpIni

Write-Host "Project root: $ProjectRoot"
Write-Host "PHP config:   $LocalPhpIni"
Write-Host "CA bundle:    $(if ($caBundle) { $caBundle } else { 'not detected; configure PHP_CA_BUNDLE or tools/cacert.pem' })"
Write-Host ''
Write-Host 'Detected tools:'
foreach ($tool in @('php', 'composer', 'node', 'npm', 'deno', 'cloudflared', 'supabase', 'docker')) {
    $path = Get-ToolPath $tool
    Write-Host ("  {0,-12} {1}" -f $tool, $(if ($path) { $path } else { 'not found' }))
}

Write-Host ''
Write-Host 'Local setup prepared. Run scripts/check-local.ps1 before starting the application.'
