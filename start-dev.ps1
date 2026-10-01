param(
    [string]$TunnelId = $(if ($env:CLOUDFLARE_TUNNEL_ID) { $env:CLOUDFLARE_TUNNEL_ID } else { '3aa6fc44-e074-4e89-866e-89e0b6e75926' })
)

$ErrorActionPreference = 'Stop'
$root = (Resolve-Path $PSScriptRoot).Path
$jobs = @()
$serviceStates = @{}
$allServicesReported = $false

if (-not (Get-Command cloudflared -ErrorAction SilentlyContinue)) {
    throw 'cloudflared was not found on PATH.'
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    throw 'npm was not found on PATH.'
}

function Start-DevJob {
    param(
        [string]$Name,
        [scriptblock]$Command
    )

    $job = Start-Job -Name $Name -ScriptBlock $Command
    $script:jobs += $job
    $serviceStates[$Name] = 'STARTING'
    Write-Host "[$Name] STARTING (job $($job.Id))" -ForegroundColor Yellow
    return $job
}

function Set-ServiceState {
    param(
        [string]$Name,
        [ValidateSet('STARTING', 'RUNNING', 'FAILED', 'STOPPED')]
        [string]$State
    )

    if ($serviceStates[$Name] -eq $State) { return }
    $serviceStates[$Name] = $State
    $color = switch ($State) {
        'RUNNING' { 'Green' }
        'FAILED' { 'Red' }
        'STOPPED' { 'DarkYellow' }
        default { 'Yellow' }
    }
    Write-Host "[$Name] $State" -ForegroundColor $color
}

$null = Start-DevJob -Name 'soc5-backend' -Command {
    Set-Location $using:root
    & (Join-Path $using:root 'start-backend.ps1')
}

$null = Start-DevJob -Name 'soc5-frontend' -Command {
    Set-Location (Join-Path $using:root 'frontend')
    npm run dev
}

$null = Start-DevJob -Name 'soc5-cloudflared' -Command {
    Set-Location $using:root
    cloudflared tunnel run $using:TunnelId
}

Write-Host ''
Write-Host 'SOC 5 development stack is starting.' -ForegroundColor Cyan
Write-Host 'Press Ctrl+C to stop the backend, frontend, and Cloudflare tunnel.' -ForegroundColor Yellow
Write-Host ''

try {
    while ($true) {
        foreach ($job in $jobs) {
            if ($job.State -eq 'Running') {
                Set-ServiceState -Name $job.Name -State 'RUNNING'
            }

            Receive-Job -Job $job | ForEach-Object {
                $line = ($_ | Out-String).TrimEnd()
                if ($line) {
                    Write-Host "[$($job.Name)] $line"
                }
            }

            if ($job.State -in @('Failed', 'Stopped', 'Completed')) {
                $reason = if ($job.ChildJobs[0].JobStateInfo.Reason) {
                    $job.ChildJobs[0].JobStateInfo.Reason.Message
                } else {
                    "Job ended with state $($job.State)."
                }
                Set-ServiceState -Name $job.Name -State 'FAILED'
                throw "$($job.Name): $reason"
            }
        }

        if (-not $allServicesReported -and ($serviceStates.Values | Where-Object { $_ -eq 'RUNNING' }).Count -eq 3) {
            $allServicesReported = $true
            Write-Host ''
            Write-Host 'ALL SERVICES RUNNING' -ForegroundColor Green
            Write-Host ''
            $serviceStates.Keys | Sort-Object | ForEach-Object {
                Write-Host "[$_] $($serviceStates[$_])" -ForegroundColor Green
            }
            Write-Host ''
        }

        Start-Sleep -Milliseconds 500
    }
}
finally {
    Write-Host ''
    Write-Host 'Stopping SOC 5 development stack...' -ForegroundColor Yellow
    $jobs | Stop-Job -ErrorAction SilentlyContinue
    $jobs | Remove-Job -Force -ErrorAction SilentlyContinue
    $serviceStates.Keys | ForEach-Object { $serviceStates[$_] = 'STOPPED' }
    Write-Host 'Development stack stopped.' -ForegroundColor Green
}
