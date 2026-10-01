. (Join-Path $PSScriptRoot '..\cloudflare-tunnel.ps1')

Describe 'Cloudflare token tunnel command' {
    It 'uses the requested token-generation command for the configured tunnel' {
        @(Get-CloudflareTunnelTokenCommand -TunnelId 'test-tunnel') | Should Be @('tunnel', 'token', 'test-tunnel')
    }

    It 'runs the tunnel with the token supplied through the environment' {
        @(Get-CloudflareTunnelRunArguments) | Should Be @('tunnel', '--no-autoupdate', 'run')
    }

    It 'extracts a tunnel token without printing unrelated CLI output' {
        $output = @('Fetching token', ('eyJ' + ('a' * 80)))

        Get-CloudflareTokenFromOutput -Output $output | Should Be $output[1]
    }

    It 'defines the SeaTalk callback on the Cloudflare public hostname' {
        Get-ExpectedSeatalkCallbackUrl | Should Be 'https://soc5outboundops.app/auth/seatalk/callback'
    }

    It 'reads the SeaTalk callback from dotenv content' {
        $content = @('APP_URL=http://127.0.0.1:8000', 'SEATALK_REDIRECT_URI=https://soc5outboundops.app/auth/seatalk/callback')

        Get-DotEnvValue -Content $content -Name 'SEATALK_REDIRECT_URI' | Should Be (Get-ExpectedSeatalkCallbackUrl)
    }
}
