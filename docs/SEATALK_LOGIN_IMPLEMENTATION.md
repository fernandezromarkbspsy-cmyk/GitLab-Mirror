# SeaTalk Login Implementation

## Completed behavior

- The login page initializes the SeaTalk QR widget automatically on load.
- Email OTP, Google, and Backroom login remain available.
- SeaTalk uses `response_type=code`; Laravel exchanges codes server-side.
- OAuth state is generated and validated in the Laravel session.
- Successful SeaTalk login creates an HttpOnly Laravel session.
- Local identity matching uses the user email returned by SeaTalk and the
  `profiles.email` field.
- Unknown or inactive email addresses are rejected.

## Configuration

Set these backend variables and keep `SEATALK_APP_SECRET` server-side only:

```env
SEATALK_APP_ID=
SEATALK_APP_SECRET=
SEATALK_REDIRECT_URI=https://your-domain.example/auth/seatalk/callback
SEATALK_SDK_URL=https://static.cdn.haiserve.com/seatalk/client/shared/sop/auth.js
SEATALK_TOKEN_URL=https://openapi.seatalk.io/auth/app_access_token
SEATALK_USER_URL=https://openapi.seatalk.io/open_login/code2employee
```

Register the exact HTTPS value of `SEATALK_REDIRECT_URI` in SeaTalk Open Platform. The callback first requests an app access token, then exchanges the login code through `SEATALK_USER_URL`. Populate `profiles.email` for each active user who should be allowed to log in.

## Local verification

1. Ensure each allowed SeaTalk user has a matching active `profiles.email` value.
2. Run the backend and frontend through an HTTPS tunnel whose public callback URL is registered in SeaTalk.
3. Open the login page and confirm the QR widget is visible without a QR-login button.
4. Scan the QR code in SeaTalk and confirm the browser returns to the app dashboard.
5. Verify `/api/auth/me` returns the mapped local profile.
6. Block the SDK or SeaTalk API and confirm the visible retry message works.
7. Verify email OTP, Google, and Backroom login still work.
