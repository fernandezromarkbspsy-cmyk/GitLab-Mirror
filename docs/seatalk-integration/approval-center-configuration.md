# SeaTalk Approval Center Configuration

This document records the backend-only configuration and the provider contract
that must be confirmed before Approval Center traffic is enabled. The existing
FTE OPS web-checkbox workflow remains the authoritative approval path until the
SeaTalk app, permissions, Data Scope, callbacks, and employee mappings are
verified in a test environment.

## Rollout gate

Approval Center is disabled unless all of the following are true:

- `SEATALK_APPROVAL_ENABLED=true` is deliberately set in the backend runtime;
- `SEATALK_APP_ID` is present;
- `SEATALK_APP_SECRET` is present;
- `SEATALK_CALLBACK_SIGNING_SECRET` is present;
- `SEATALK_APPROVE_CALLBACK_URL` is present; and
- `SEATALK_REJECT_CALLBACK_URL` is present.

The configuration gate is server-side. Secrets and callback URLs must never be
copied into frontend environment variables, public configuration responses,
source control, screenshots, or ordinary request logs.

## Backend environment

The names below are defined in `backend/.env.example`. Empty values are
intentional placeholders; no real credential belongs in that file.

| Environment variable | Purpose | Default |
| --- | --- | --- |
| `SEATALK_APPROVAL_ENABLED` | Explicit rollout gate | `false` |
| `SEATALK_APP_ID` | SeaTalk Workspace App ID | empty |
| `SEATALK_APP_SECRET` | Workspace App secret | empty |
| `SEATALK_CALLBACK_SIGNING_SECRET` | Secret used to verify Approval Center callbacks | empty |
| `SEATALK_APPROVAL_BASE_URL` | SeaTalk Approval Center API host | `https://openapi.seatalk.io` |
| `SEATALK_APPROVE_CALLBACK_URL` | Backend approve callback URL | empty |
| `SEATALK_REJECT_CALLBACK_URL` | Backend reject callback URL | empty |
| `SEATALK_APPROVAL_ASSIGNMENT_SECONDS` | Sequential assignment window | `180` |
| `SEATALK_PRESENCE_ACTIVE_SECONDS` | Heartbeat freshness threshold | `60` |
| `SEATALK_HTTP_CONNECT_TIMEOUT` | Provider connection timeout | `5` seconds |
| `SEATALK_HTTP_TIMEOUT` | Provider request timeout | `10` seconds |

The corresponding runtime values are under `services.seatalk.approval` in
`backend/config/services.php`. The `app_secret`, callback signing secret, and
callback URLs are server-only values; the existing SeaTalk login endpoint must
continue to return only its established OAuth fields.

## External provider-contract prerequisite

The exact current provider contract is an external prerequisite before
`SEATALK_APPROVAL_ENABLED=true` may be used. It is **not confirmed in this
repository**. The deployment owner must obtain and retain current SeaTalk
provider or administrator confirmation for all of the following:

| Operation | Must be externally confirmed before activation | Repository status |
| --- | --- | --- |
| Create approval item | Exact HTTP method, endpoint path, request/response schema, permissions, Data Scope, and retry behavior | Not confirmed; no endpoint path is inferred here. |
| Update approval item | Exact HTTP method, endpoint path, request/response schema, permissions, and retry behavior | Not confirmed; do not guess or enable an update call. |
| Approve/reject callbacks | Registered callback URLs, payload fields, signature requirements, HTTP status, acknowledgement body, response deadline, and retry behavior | Not confirmed; do not claim provider-compatible acknowledgements yet. |

The existing SeaTalk login token endpoint is configured separately under
`SEATALK_TOKEN_URL`; its presence does not confirm the Approval Center create
or update contract. Provider traffic must remain disabled until the exact
create/update endpoints and callback acknowledgement contract are recorded in
this document from an external confirmation.

## Create-item payload limits

These limits are provider limits, not local database limits. Validate or trim
local values before a future provider adapter sends them.

| Field | Limit |
| --- | --- |
| `item_id` | 30 characters |
| `applicant_name` | 50 characters |
| `item_name` | 50 characters per language |
| `item_state` | 20 characters per language |
| `title` | 100 characters per language |
| `subtitle` | 100 characters per language |
| `description` | 500 characters |
| `approval_chain` | 65,535 bytes; `approvers` maximum 100 |
| `status.text` | 50 characters per language |
| `app_path` | 500 characters; required when `action_button` is `2` |
| `approve_url` / `reject_url` | 500 characters each |
| `pending_list` / `approved_list` / `rejected_list` | Empty or maximum 100 users each |
| Approver `name` | 50 characters |
| Approver `avatar` | 200 characters |
| Approver `comment` | 500 characters |
| `TextStructure` languages | `en`, `vi`, `zh-hans`, `zh-hant`, `th`, `id`; 50 characters per language |

The provider requires `item_id`, `created_at`, `updated_at`, `applicant_name`,
`title`, `status`, `approve_url`, `reject_url`, and all three approval lists.
Timestamps are GMT+0 Unix timestamps. `employee_code` is the stable identity
for approver routing and must not be replaced by a display name or email.

## Callback signature verification

Approval Center callback requests must be verified against the raw request
body before JSON parsing or state mutation:

```text
signature = lowercase_hex_sha256(raw_request_body + callback_signing_secret)
```

SeaTalk sends the result in the `Signature` HTTP header. Comparison must be
constant-time. Missing, malformed, or mismatched signatures are rejected. The
callback handler must be replay-safe and idempotent; a late or duplicate
callback is acknowledged according to the confirmed provider contract without
changing the canonical request state.

The general SeaTalk event-callback documentation requires an HTTP 200 response
within 5 seconds and says it retries up to 3 times when no response is received.
The checked-in Approval Center create-item documentation does not specify the
exact acknowledgement body or retry contract for approve/reject callbacks.
That callback-specific response contract remains an operator-confirmation item.

## Permissions, Data Scope, and identity mapping

Before setting `SEATALK_APPROVAL_ENABLED=true`, the SeaTalk administrator must
confirm and retain deployment evidence for:

- Workspace App capability enabled;
- Approval Center Create Approval Item permission;
- Approval Center update permission, if the portal exposes it separately;
- the callback/event permission required for approve and reject actions;
- Data Scope covering every employee in `approval_chain`, `pending_list`,
  `approved_list`, and `rejected_list`; and
- the mobile detail-page `app_path` format and final item-ID convention.

Every active FTE OPS approver must have an exact SeaTalk `employee_code` mapped
to the local profile. Inactive profiles, missing mappings, and stale heartbeats
must not receive new assignments.

## Operator confirmation record

Complete these items before enabling provider traffic:

- [ ] SeaTalk administrator confirmed the Workspace App and App ID.
- [ ] App Secret and callback signing secret are stored only in backend secret storage.
- [ ] Approval Center permissions and Data Scope were approved.
- [ ] Staging approve and reject callback URLs were registered and verified.
- [ ] Production callback URLs were registered only after staging verification.
- [ ] The update-item endpoint and callback acknowledgement contract were confirmed.
- [ ] Mobile detail-page path and item-ID convention were confirmed.
- [ ] Employee-code mappings for eligible FTE OPS users were audited.
- [ ] Callback signature, duplicate callback, late callback, and web-wins behavior passed staging tests.

## Sources

- [SeaTalk Create Approval Item](https://open.seatalk.io/docs/create-approval-item)
- [SeaTalk Approval Center definitions](https://open.seatalk.io/docs/approval-center-definition-explanations)
- [SeaTalk Server API Event Callback](https://open.seatalk.io/docs/server-apis-event-callback)
- [`approval-center-setup-guide.md`](./approval-center-setup-guide.md)
