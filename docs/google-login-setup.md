# Google Login Setup — SOC 5 Outbound

This guide configures Google OAuth for the hosted Supabase project used by SOC
5 Outbound. It follows the Google Auth Platform and Supabase Dashboard UI as of
June 2026.

Google login is available only on the **FTE** login tab. Authentication with a
Google account does not grant application access by itself. The account email
must also be an active `fte_ops` or `fte_mm` entry in `public.user_imports`.

## 1. Values used by this project

Replace the production origin only if the deployment uses another hostname.

| Setting | Value |
| --- | --- |
| Local application origin | `http://localhost:5173` |
| Production application origin | `https://soc5outboundops.app` |
| Supabase project URL | `https://jbbqdthptwnlhetwhfng.supabase.co` |
| Google authorized redirect URI | `https://jbbqdthptwnlhetwhfng.supabase.co/auth/v1/callback` |

The Google authorized redirect URI is the **Supabase Auth callback**, not the
frontend URL. Google redirects to Supabase first; Supabase then redirects to an
allowed application URL.

## 2. Prerequisites

You need:

- permission to create OAuth clients in a Google Cloud project;
- Supabase project Owner or Administrator access;
- control of the production domain if Google asks for domain verification;
- migrations `001` through `005` and `docs/outbound/users-seed.sql` applied;
- at least one active FTE allowlist row for testing.

Never commit the Google client secret. It belongs only in the hosted Supabase
Google provider configuration. It is not a frontend or Laravel environment
variable.

## 3. Select or create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Use the project selector in the top bar.
3. Select the organization-approved project, or choose **New Project**.
4. Enter a recognizable name such as `SOC 5 Outbound Auth`.
5. Select the correct organization and billing location when required, then
   choose **Create**.
6. Confirm the intended project is selected before continuing. OAuth clients
   are project-specific.

No Google data API needs to be enabled for basic sign-in.

## 4. Initialize Google Auth Platform

1. Open [Google Auth Platform](https://console.cloud.google.com/auth/overview).
2. If the page shows **Get started**, select it.
3. Supply the initial application information requested by the wizard:
   - **App name:** `SOC 5 Outbound`
   - **User support email:** an actively monitored company address
   - **Audience:** use the decision in section 5
   - **Contact information:** an actively monitored technical-owner address
4. Accept the Google API Services user data policy acknowledgement when shown.
5. Choose **Create** or **Continue**.

After initialization, the left navigation should contain **Overview**,
**Branding**, **Audience**, **Clients**, and **Data Access**.

## 5. Configure Audience

Open **Google Auth Platform > Audience**.

### Preferred: Internal

Select **Internal** only when the Google Cloud project belongs to the Google
Workspace organization that owns the FTE accounts. Internal mode limits sign-in
to organization members and normally avoids the external-app publishing flow.

### Otherwise: External

Use **External** when Internal is unavailable. During development:

1. Keep **Publishing status** set to **Testing**.
2. Under **Test users**, choose **Add users**.
3. Add each allowlisted FTE Google address that will test the application.
4. Save.

Only listed test users can complete an External app's OAuth flow while it is in
Testing. Before production, select **Publish app** and complete any confirmation
or verification Google requests. Do not publish merely to bypass a missing test
user; first confirm the audience choice with the Workspace administrator.

## 6. Configure Branding

Open **Google Auth Platform > Branding**, then configure the fields available to
the selected audience:

- **App name:** `SOC 5 Outbound`
- **User support email:** monitored company support address
- **App logo:** optional during testing; use the approved production logo
- **Application home page:** `https://soc5outboundops.app/about.html`
- **Privacy policy:** `https://soc5outboundops.app/privacy.html`
- **Terms of service:** `https://soc5outboundops.app/terms.html`
- **Authorized domains:** `soc5outboundops.app`
- **Developer contact information:** monitored technical-owner addresses

Use only HTTPS URLs in production. Google can require proof of domain ownership
and brand verification for an External app. The displayed app name, domain, and
logo should match the deployed application. Save all changes.

These public pages are provided by `frontend/public`. Review their organization-
specific legal, retention, contact, and privacy statements before deployment.
After deploying, open all three URLs in a private browser window and confirm
they load without authentication. The OAuth consent screen Privacy Policy URL
must exactly match the policy linked from the application-information page.

Do not add `supabase.co` as an authorized domain unless Google explicitly asks
for it and the field accepts it; the Supabase callback is configured on the
OAuth client instead.

## 7. Configure Data Access

1. Open **Google Auth Platform > Data Access**.
2. Choose **Add or remove scopes**.
3. Keep only the scopes required by Supabase Google login:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
4. If `openid` is not listed, use **Manually add scopes** and enter `openid`.
5. Choose **Update**, then **Save**.

Do not add Gmail, Drive, Calendar, or other Google API scopes. This application
uses Google only to establish identity, and extra sensitive scopes can trigger
additional verification requirements.

## 8. Create the Web OAuth client

1. Open **Google Auth Platform > Clients**.
2. Choose **Create client**.
3. Set **Application type** to **Web application**.
4. Set **Name** to `SOC 5 Outbound Web`.
5. Under **Authorized JavaScript origins**, add these as separate entries:

   ```text
   http://localhost:5173
   https://soc5outboundops.app
   ```

6. Under **Authorized redirect URIs**, add exactly:

   ```text
   https://jbbqdthptwnlhetwhfng.supabase.co/auth/v1/callback
   ```

7. Choose **Create**.
8. Copy the **Client ID** and **Client secret** immediately and store them in an
   approved secret manager until they are entered into Supabase.

Origins contain only scheme, host, and port—no path or trailing slash. Redirect
URIs include the full `/auth/v1/callback` path and must match exactly. Do not add
`http://localhost:5173` as a Google redirect URI for this hosted-Supabase flow.

## 9. Enable Google in Supabase

1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select project `jbbqdthptwnlhetwhfng`.
3. Open **Authentication > Sign In / Providers**. In some Dashboard versions,
   this appears under **Authentication > Configuration > Providers**.
4. Expand **Google**.
5. Confirm the displayed callback URL is:

   ```text
   https://jbbqdthptwnlhetwhfng.supabase.co/auth/v1/callback
   ```

6. Turn on **Enable Sign in with Google**.
7. Paste the Google **Client ID** and **Client secret**.
8. Leave nonce checking at its secure default if that setting is shown.
9. Choose **Save**.

The client secret is stored by Supabase. Do not add it to `frontend/.env`,
`backend/.env`, GitHub variables, or browser code.

## 10. Configure Supabase application redirects

1. Open **Authentication > URL Configuration**.
2. Set **Site URL** to the primary deployed application URL:

   ```text
   https://soc5outboundops.app
   ```

3. Under **Redirect URLs**, add:

   ```text
   http://localhost:5173/**
   https://soc5outboundops.app/**
   ```

4. Save.

The frontend passes `window.location.origin` as `redirectTo`. Supabase must
allow both origins. Use the production origin as Site URL; the local wildcard
exists only in Redirect URLs.

## 11. Apply and verify the FTE authorization gate

Run these files in the Supabase SQL Editor in repository order if they have not
already been applied:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_cluster_import_compatibility.sql
supabase/migrations/003_auth_flows.sql
supabase/migrations/004_google_fte_auth.sql
docs/outbound/users-seed.sql
supabase/migrations/005_repair_existing_fte_profiles.sql
```

Verify the intended test user:

```sql
select name, role, email, is_active, auth_user_id
from public.user_imports
where lower(email) = lower('USER@spxexpress.com');
```

The row must use `fte_ops` or `fte_mm` and have `is_active = true`. The Google
`hd=spxexpress.com` request parameter only influences Google's account chooser;
it is not authorization. Migration 004 and Laravel's active-profile lookup are
the enforcement points.

## 12. Test before production

### Allowed FTE

1. Start Laravel and Vite.
2. Open `http://localhost:5173` in a private browser window.
3. Select **FTE > Continue with Google**.
4. Select an active allowlisted FTE account.
5. Confirm Google returns to the application and the dashboard loads.
6. Confirm `/api/auth/me` returns `200` in browser developer tools.
7. Verify the database link:

   ```sql
   select u.id, u.email, p.role, p.is_active, i.auth_user_id
   from auth.users u
   join public.profiles p on p.id = u.id
   join public.user_imports i on i.auth_user_id = u.id
   where lower(u.email) = lower('USER@spxexpress.com');
   ```

The UUIDs must match.

### Rejected accounts

Repeat the flow with both:

- a Google account absent from `user_imports`; and
- an FTE row with `is_active = false`.

Neither account may receive an application profile or access `/api/auth/me`.
Also confirm the Google button is absent from the **Backroom** tab.

## 13. Production checklist

- [ ] Correct Google Cloud project and organization selected.
- [ ] Audience is Internal, or External is published and approved.
- [ ] Branding and developer contacts are current.
- [ ] Only `openid`, email, and profile scopes are requested.
- [ ] Production and local origins are separate Google origin entries.
- [ ] The only hosted callback is the exact Supabase callback URL.
- [ ] Google client ID and secret are saved in Supabase.
- [ ] Supabase Site URL and Redirect URLs are correct.
- [ ] Migration 004 and the latest FTE seed are applied.
- [ ] Allowed and rejected-account tests both pass.
- [ ] No Google client secret exists in source control or application `.env`.

## 14. Troubleshooting

### `Error 400: redirect_uri_mismatch`

Compare the URI shown in Google's error details with the entry under **Google
Auth Platform > Clients > SOC 5 Outbound Web > Authorized redirect URIs**. It
must be exactly:

```text
https://jbbqdthptwnlhetwhfng.supabase.co/auth/v1/callback
```

Check scheme, project reference, path, trailing slash, and accidental spaces.
Google configuration changes can take several minutes to propagate.

### `Error 403: access_denied` or app restricted to test users

For an External app in Testing, add the address under **Audience > Test users**.
For an Internal app, confirm the account belongs to the same Workspace
organization as the Google Cloud project.

### Google says the app is not verified

Confirm Branding fields and authorized domains, publish the External app, and
complete Google's requested brand or domain verification. Avoid adding scopes
beyond `openid`, email, and profile.

### Supabase says the provider is not enabled

Open **Authentication > Sign In / Providers > Google**, enable it, confirm the
client credentials, and save again. Make sure the credentials belong to the
same Google OAuth client whose redirect URI was configured.

### Login returns to the application but immediately signs out

The Google authentication probably succeeded but application authorization
failed. Confirm the normalized email exists in `public.user_imports`, its role
is `fte_ops` or `fte_mm`, it is active, and migration 004 was applied. Then
inspect Supabase Auth and Postgres logs for the provisioning-trigger error.

### Local login redirects to production

Confirm `http://localhost:5173/**` exists in Supabase Redirect URLs and that the
app was opened with that exact origin. Restart Vite after environment changes.

## Official references

- [Supabase: Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase: Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Google Cloud: Manage OAuth clients](https://support.google.com/cloud/answer/15549257)
- [Google OAuth 2.0 for web applications](https://developers.google.com/identity/protocols/oauth2/web-server)
