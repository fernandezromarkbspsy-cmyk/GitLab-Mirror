# SeaTalk Login Setup Guide

## Prerequisites

- A SeaTalk Open Platform application with Login With SeaTalk enabled.
- A publicly reachable HTTPS callback host.
- The local Cloudflare tunnel running with the `seatalk-dev.soc5outboundops.app` ingress configuration when developing locally.

## Configure SeaTalk

In the SeaTalk application settings, register the callback URI exactly as it appears in `backend/.env`:

```text
https://seatalk-dev.soc5outboundops.app/api/auth/seatalk/callback
```

SeaTalk must preserve the `state` query parameter when it redirects to this URI. The application uses that value to bind the authorizing device to the browser that created the QR code.

## Configure Laravel

Set these values in `backend/.env`:

```dotenv
SEATALK_APP_ID=your_app_id
SEATALK_APP_SECRET=your_app_secret
SEATALK_REDIRECT_URI=https://seatalk-dev.soc5outboundops.app/api/auth/seatalk/callback
```

Do not put the app secret in a frontend environment file. If Laravel configuration is cached in a deployment, clear and rebuild the configuration cache after changing these values.

## Verify

Create a QR transaction through the public host:

```powershell
Invoke-RestMethod -Method Post https://seatalk-dev.soc5outboundops.app/api/auth/seatalk/transactions
```

The response should contain `login_url`, `transaction_id`, and `transaction_token`. Treat the transaction token as sensitive and do not log it. Open the login page, scan the generated QR code, authorize in SeaTalk, and confirm that the desktop moves to the existing email OTP form.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| QR does not appear | Confirm the transaction request returns `200`, and check all three `SEATALK_*` values in the Laravel environment. |
| SeaTalk reports an invalid redirect | The registered callback URI and `SEATALK_REDIRECT_URI` must match exactly. |
| QR scan completes but desktop remains pending | Confirm SeaTalk returns both `code` and the original `state`; inspect Laravel logs for the transaction ID only. |
| Callback fails to exchange | Verify the server can reach `openapi.seatalk.io`, and rotate an invalid app secret in SeaTalk and Laravel together. |
| User cannot finish sign-in | SeaTalk must return an `@spxexpress.com` email that is eligible for the established Supabase FTE provisioning flow. |
