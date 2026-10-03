[CmdletBinding()]
param(
  [ValidateSet(10,25,50,100,200,300)]
  [int]$Users = 10,
  [string]$BaseUrl = 'http://localhost:5173',
  [string]$BackendBaseUrl = 'http://127.0.0.1:8000',
  [string]$ApiBaseUrl = '',
  [switch]$ApiOnly,
  [switch]$AllowProduction
)

$ErrorActionPreference = 'Stop'
if (-not $ApiBaseUrl) { $ApiBaseUrl = "$BaseUrl/api/v1" }
if (-not $AllowProduction -and ($BaseUrl -match 'soc5outboundops\.app|production' -or $BackendBaseUrl -match 'soc5outboundops\.app|production' -or $ApiBaseUrl -match 'soc5outboundops\.app|production')) {
  throw 'Refusing a production-looking target. Re-run with -AllowProduction only after explicit approval.'
}

$env:K6_BASE_URL = $BaseUrl
$env:K6_BACKEND_BASE_URL = $BackendBaseUrl
$env:K6_API_BASE_URL = $ApiBaseUrl
if ($AllowProduction) { $env:K6_ALLOW_PRODUCTION = 'true' }

if ($ApiOnly) {
  k6 run (Join-Path $PSScriptRoot 'api-load.js')
} else {
  $env:K6_MAX_USERS = [string]$Users
  k6 run (Join-Path $PSScriptRoot 'load.js')
}
