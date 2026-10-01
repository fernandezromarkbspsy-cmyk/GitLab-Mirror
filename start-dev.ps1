$ErrorActionPreference = 'Stop'
$root = (Resolve-Path $PSScriptRoot).Path
$TunnelId = 'aebf91e4-acf5-4eb4-aaae-8b56a58e8035'
$cloudflareTunnelScript = Join-Path $root 'scripts\cloudflare-tunnel.ps1'
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
    . $using:cloudflareTunnelScript
    Start-CloudflareTokenTunnel -TunnelId $using:TunnelId
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
                $jobErrors = @(
                    $job.ChildJobs |
                        ForEach-Object { $_.Error } |
                        ForEach-Object { $_.ToString().Trim() } |
                        Where-Object { $_ }
                )
                if ($jobErrors.Count -gt 0) {
                    $reason = ($jobErrors | Select-Object -Last 12) -join [Environment]::NewLine
                } elseif ($job.ChildJobs[0].JobStateInfo.Reason) {
                    $reason = $job.ChildJobs[0].JobStateInfo.Reason.Message
                } else {
                    $reason = "Job ended with state $($job.State)."
                }
                Set-ServiceState -Name $job.Name -State 'FAILED'
                throw "$($job.Name) failed:`n$reason"
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
    foreach ($name in @($serviceStates.Keys)) {
        $serviceStates[$name] = 'STOPPED'
    }
    Write-Host 'Development stack stopped.' -ForegroundColor Green
}
