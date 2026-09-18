$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path $PSScriptRoot -Parent
$SyncScript = Join-Path $PSScriptRoot "sync-env-to-1password.ps1"

$files = @{
    ".env"          = "SOC5 Outbound Environment"
    "backend\.env"  = "SOC5 Outbound Backend Environment"
    "frontend\.env" = "SOC5 Outbound Frontend Environment"
}

$watchers = @()

foreach ($entry in $files.GetEnumerator()) {

    $relativePath = $entry.Key
    $targetItem = $entry.Value

    $fullPath = Join-Path $ProjectRoot $relativePath
    $directory = Split-Path $fullPath
    $fileName = Split-Path $fullPath -Leaf

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $directory
    $watcher.Filter = $fileName
    $watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite

    $state = @{
        LastSync = [datetime]::MinValue
    }

    $action = {
        $path = $Event.SourceEventArgs.FullPath
        $now = Get-Date

        if (($now - $state.LastSync).TotalSeconds -lt 2) {
            return
        }

        $state.LastSync = $now

        Start-Sleep -Milliseconds 750

        Write-Host "Detected change: $relativePath"

        try {
            & $SyncScript `
                -EnvFile $relativePath `
                -Item $targetItem

            Write-Host "1Password sync completed."
        }
        catch {
            Write-Host "SYNC ERROR: $($_.Exception.Message)"
        }
    }.GetNewClosure()

    Register-ObjectEvent `
        -InputObject $watcher `
        -EventName Changed `
        -Action $action | Out-Null

    $watchers += $watcher
}

Write-Host ""
Write-Host "SOC5 Outbound .env watcher is running."
Write-Host ""
Write-Host "Watching:"
$files.Keys | ForEach-Object {
    Write-Host " - $_"
}
Write-Host ""
Write-Host "Press Ctrl+C to stop."
Write-Host ""

while ($true) {
    Wait-Event -Timeout 5 | Out-Null
}