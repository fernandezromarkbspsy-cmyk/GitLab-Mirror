# SeaTalk Approval Center: next steps

The application implementation is complete through the operational safeguards.
The remaining work is SeaTalk tenant/app configuration and a provider-backed
test run. Approval Center delivery is intentionally disabled until these steps
are complete.

## 1. Confirm the SeaTalk API contract

Ask the SeaTalk app administrator or provider support to confirm, for the test
tenant:

- Create Approval Item endpoint and required permission.
- Update Approval Item endpoint and required permission.
- Get Approval Item endpoint and permission. The documented endpoint currently
  is `GET /approval_center/v2/get` with `item_id`.
- App access-token endpoint and token lifetime.
- Callback signature algorithm, header name, timestamp/replay requirements,
  and callback retry behavior.
- Whether callback URLs must be public HTTPS URLs and whether redirects are
  allowed.

The documented create path is `/approval_center/v2/create`. The get path is
`/approval_center/v2/get`. Do not guess the update path; the adapter fails
closed when that path is empty.

## 2. Create and configure a test SeaTalk app

Record these values in the deployment secret store, never in Git or frontend
configuration:

```dotenv
SEATALK_APP_ID=<test-app-id>
SEATALK_APP_SECRET=<test-app-secret>
SEATALK_CALLBACK_SIGNING_SECRET=<random-secret>
SEATALK_APPROVAL_BASE_URL=https://openapi.seatalk.io
SEATALK_APPROVAL_CREATE_PATH=/approval_center/v2/create
SEATALK_APPROVAL_UPDATE_PATH=<confirmed-update-path>
SEATALK_APPROVAL_DETAIL_PATH=/approval_center/v2/get
SEATALK_APPROVAL_APP_PATH=seatalk://application/sop/<app-path>/?itemId={itemId}
```

Grant only the permissions required for approval-item creation/update,
approval-item retrieval, employee identity lookup, and callback delivery.
Configure the Data Scope to include the intended FTE OPS test users and verify
that their SeaTalk employee codes match `profiles.seatalk_employee_code`.

## 3. Configure callback URLs

Use the public HTTPS API hostname for both the versioned and legacy-compatible
routes. Prefer the versioned route:

```text
https://<api-host>/api/v1/integrations/seatalk/approval/approve
https://<api-host>/api/v1/integrations/seatalk/approval/reject
```

Set:

```dotenv
SEATALK_APPROVE_CALLBACK_URL=https://<api-host>/api/v1/integrations/seatalk/approval/approve
SEATALK_REJECT_CALLBACK_URL=https://<api-host>/api/v1/integrations/seatalk/approval/reject
```

Confirm that SeaTalk sends `item_id`, `event_id`, `timestamp`,
`employee.employee_code`, and `reason` for rejection callbacks. Confirm that
the callback signature is calculated over the raw request body.

## 4. Validate identity and local readiness

Before enabling delivery:

1. Apply the backend and Supabase migrations.
2. Verify every test FTE OPS profile has a unique active
   `seatalk_employee_code`.
3. Verify the application can reach `openapi.seatalk.io` over direct TLS.
4. Run the local reconciliation report:

   ```sh
   php artisan seatalk:reconcile-approvals
   ```

5. Confirm callback signing secret, URLs, and provider paths are present in
   runtime configuration without printing secret values.

## 5. Run the provider-backed test matrix

Enable the test app only:

```dotenv
SEATALK_APPROVAL_ENABLED=true
```

Execute and record evidence for:

- Request creation creates one stable Approval Center item.
- Pending item appears for the intended FTE OPS users.
- SeaTalk approve callback changes the local request once.
- SeaTalk reject callback requires and stores a reason.
- Web approval wins against a later SeaTalk callback.
- Duplicate callbacks are acknowledged without duplicate state changes.
- Wrong employee, expired assignment, and late callback are ignored safely.
- Provider outage leaves local approval committed and marks delivery failed.
- `php artisan seatalk:reconcile-approvals --repair` retries delivery.
- Cancellation closes the item and invalidates active assignments.
- Rerouting updates pending approvers and remains visible in the web table.

The canonical local fields are `requests.approval_status`, approval actor/source,
and approval version. A provider response must never overwrite those fields
without passing through the shared approval service.

## 6. Production rollout gate

Do not enable production until all items below are checked:

- [ ] SeaTalk create/update/get contracts are confirmed and documented.
- [ ] Test app permissions and Data Scope are approved.
- [ ] Test employee-code mappings are verified.
- [ ] Callback signature and replay behavior are verified.
- [ ] Provider-backed matrix passes.
- [ ] Scheduler and queue worker are running with monitoring.
- [ ] Logs/alerts cover callback failures, provider errors, expiry, retries,
      and approval latency.
- [ ] Kill switch procedure is tested: set
      `SEATALK_APPROVAL_ENABLED=false`.
- [ ] Secret rotation and callback replay investigation procedures are handed
      to operations.

Only after this gate should the feature flag be enabled for a small production
allowlist, followed by gradual expansion.

## Useful commands

```sh
# Inspect without changing provider or canonical local state
php artisan seatalk:reconcile-approvals

# Retry failed/pending provider synchronization after remediation
php artisan seatalk:reconcile-approvals --repair

# Confirm scheduler entries
php artisan schedule:list
```
