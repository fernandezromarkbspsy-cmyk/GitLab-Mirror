# SeaTalk QR Login Integration

SeaTalk QR sign-in is a short-lived transaction shared between the browser showing the QR code and the device completing SeaTalk authorization. The application retains its existing Supabase email OTP as the final session and allowlist check.

## Flow

1. The browser creates a transaction with `POST /api/auth/seatalk/transactions`.
2. The returned SeaTalk URL, including an opaque `state`, is rendered as a QR code.
3. SeaTalk redirects the authorizing device to `GET /api/auth/seatalk/callback?code=...&state=...`.
4. Laravel validates and consumes `state`, exchanges the code server-side, and stores the result only for the transaction owner.
5. The initiating browser polls its transaction using its separate transaction credential. The callback also sends a same-origin popup notification to reduce latency.
6. The browser starts the existing Supabase email OTP flow for the returned, allowlisted FTE email.

## Configuration

Set these values in `backend/.env` and register the exact callback URL in the SeaTalk Open Platform application:

```dotenv
SEATALK_APP_ID=your_app_id
SEATALK_APP_SECRET=your_app_secret
SEATALK_REDIRECT_URI=https://your-public-host/api/auth/seatalk/callback
```

The callback host must be the same public origin serving the frontend. The local Cloudflare tunnel routes `/api/*` to Laravel and all other paths to Vite, so `https://seatalk-dev.soc5outboundops.app/api/auth/seatalk/callback` is suitable for that environment.

## Security Controls

- `state` and the browser polling credential are independently random and expire after 10 minutes.
- The SeaTalk authorization code is exchanged only on the server and is never logged.
- SeaTalk app access tokens are cached until shortly before their reported expiry.
- Transaction creation, polling, and callback routes are rate limited.
- Only `@spxexpress.com` SeaTalk identities proceed to the established Supabase FTE provisioning and OTP flow.

## Test

```powershell
Set-Location backend
php artisan test --filter=SeatalkLoginTest
```

For manual testing, open the login page on the public host, scan the QR with SeaTalk, complete authorization, then verify the desktop presents the existing OTP screen. Test both the mobile QR and click-to-open-popup paths.
