param(
    [Parameter(Mandatory = $true)]
    [string]$EnvFile,

    [Parameter(Mandatory = $true)]
    [string]$Item
)

$ErrorActionPreference = "Stop"

$Vault = "SOC5 Outbound"
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$FullEnvFile = Join-Path $ProjectRoot $EnvFile

if (-not (Test-Path $FullEnvFile)) {
    throw "Environment file not found: $FullEnvFile"
}

$fields = @()

Get-Content $FullEnvFile | ForEach-Object {
    $line = $_.Trim()

    if ($line -eq "" -or $line.StartsWith("#")) {
        return
    }

    if ($line -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2]

        $fields += "$name=$value"
    }
}

if ($fields.Count -eq 0) {
    throw "No environment variables found in $FullEnvFile"
}

op item edit $Item --vault $Vault $fields

Write-Host "Synced $EnvFile -> $Item"