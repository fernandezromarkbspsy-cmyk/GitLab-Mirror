# SeaTalk Login Implementation

## Completed behavior

- The login page initializes the SeaTalk QR widget automatically on load.
- Email OTP, Google, and Backroom login remain available.
- SeaTalk uses `response_type=code`; Laravel exchanges codes server-side.
- OAuth state is generated and validated in the Laravel session.
- Successful SeaTalk login creates an HttpOnly Laravel session.
- Local identity matching uses the unique `profiles.seatalk_employee_code` field.
- Unknown or inactive employee codes are rejected.

## Configuration

Set these backend variables and keep `SEATALK_APP_SECRET` server-side only:

```env
SEATALK_APP_ID=
SEATALK_APP_SECRET=
SEATALK_REDIRECT_URI=https://your-domain.example/auth/seatalk/callback
SEATALK_SDK_URL=
SEATALK_TOKEN_URL=
SEATALK_USER_URL=
```

Register the exact HTTPS value of `SEATALK_REDIRECT_URI` in SeaTalk Open Platform. Populate `profiles.seatalk_employee_code` for each active user who should be allowed to log in.

## Local verification

1. Apply `supabase/migrations/020_seatalk_employee_identity.sql`.
2. Run the backend and frontend through an HTTPS tunnel whose public callback URL is registered in SeaTalk.
3. Open the login page and confirm the QR widget is visible without a QR-login button.
4. Scan the QR code in SeaTalk and confirm the browser returns to the app dashboard.
5. Verify `/api/auth/me` returns the mapped local profile.
6. Block the SDK or SeaTalk API and confirm the visible retry message works.
7. Verify email OTP, Google, and Backroom login still work.
