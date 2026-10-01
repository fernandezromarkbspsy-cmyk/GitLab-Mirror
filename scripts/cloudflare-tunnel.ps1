function Get-CloudflareTunnelTokenCommand {
    param([Parameter(Mandatory)][string]$TunnelId)

    return @('tunnel', 'token', $TunnelId)
}

function Get-CloudflareTunnelRunArguments {
    return @('tunnel', '--no-autoupdate', 'run')
}

function Get-ExpectedSeatalkCallbackUrl {
    return 'https://soc5outboundops.app/auth/seatalk/callback'
}

function Get-DotEnvValue {
    param(
        [AllowEmptyString()][AllowEmptyCollection()][string[]]$Content,
        [Parameter(Mandatory)][string]$Name
    )

    $line = $Content | Where-Object { $_ -match "^\s*$([regex]::Escape($Name))\s*=\s*(.*)\s*$" } | Select-Object -First 1
    if (-not $line) { return $null }

    $value = ([regex]::Match($line, "^\s*$([regex]::Escape($Name))\s*=\s*(.*)\s*$")).Groups[1].Value.Trim()
    return $value.Trim('"').Trim("'")
}

function Get-CloudflareTokenFromOutput {
    param([Parameter(Mandatory)][string[]]$Output)

    $token = $Output |
        ForEach-Object { $_.Trim() } |
        Where-Object { $_ -match '^eyJ[A-Za-z0-9+/=_-]{40,}$' } |
        Select-Object -Last 1

    if (-not $token) {
        throw 'cloudflared did not return a tunnel token. Authenticate with cloudflared tunnel login and retry.'
    }

    return $token
}

function Start-CloudflareTokenTunnel {
    param(
        [Parameter(Mandatory)][string]$TunnelId,
        [string]$CloudflaredCommand = 'cloudflared'
    )

    $tokenOutput = & $CloudflaredCommand @(Get-CloudflareTunnelTokenCommand -TunnelId $TunnelId) 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "cloudflared tunnel token failed for tunnel $TunnelId."
    }

    $env:TUNNEL_TOKEN = Get-CloudflareTokenFromOutput -Output ([string[]]$tokenOutput)
    & $CloudflaredCommand @(Get-CloudflareTunnelRunArguments)
}
