# SeaTalk Approval Center Setup Guide

This guide prepares the SeaTalk and application prerequisites for the dual-approval implementation described in [`FTE_OPS_Dual_Approval_Implementation_Plan.md`](./FTE_OPS_Dual_Approval_Implementation_Plan.md).

The target flow keeps the existing web-checkbox approval and adds SeaTalk Approval Center as a second channel. The application database remains the source of truth.

## Responsibility split

| Owner | Responsibilities |
| --- | --- |
| SeaTalk administrator | Create/configure the Workspace App, permissions, Data Scope, callback signing secret, and test users |
| Application administrator | Provide HTTPS staging/production URLs, queue workers, scheduler, and secret storage |
| Engineer | Implement the client, callbacks, routing, synchronization, migrations, and tests |
| Product owner | Confirm approval/routing rules and sign off staging results |

## 1. Confirm the functional contract

Confirm these values before configuration:

```text
Approval channels: web checkbox + SeaTalk Approval Center
Source of truth: application database
Approval rule: first valid approval wins
Assignment mode: sequential round-robin
Assignment window: 3 minutes
Presence threshold: 60 seconds since last heartbeat
Late action: acknowledged but does not mutate the request
Web approval while routed: closes active SeaTalk assignments
No eligible approver: request remains pending and visible on the web
```

Record any deviation in the implementation plan before coding.

## 2. Create or identify the SeaTalk app

In SeaTalk Open Platform:

1. Create or select the application used by the outbound operations system.
2. Enable the **Workspace App** capability.
3. Record the App ID.
4. Generate or retrieve the App Secret.
5. Configure the app logo and display name used in Approval Center.
6. Confirm the app can open the request detail page from SeaTalk mobile.

Approval Center is a mobile SeaTalk experience. The detail link must therefore be usable from the SeaTalk mobile client, not only from a desktop browser.

Reference: [SeaTalk Approval Center overview](https://open.seatalk.io/docs/overview-of-approval-center).

## 3. Request permissions and Data Scope

In the app's permission configuration:

1. Select the Approval Center integration permissions exposed by the portal.
2. Request the permission to create approval items.
3. Request the permission to update approval items if the portal separates it.
4. Request the callback/event permission required for approve and reject actions.
5. Submit the permission request for organization-admin approval.
6. Configure Data Scope to include every employee that can appear in:
   - `approval_chain`
   - `pending_list`
   - `approved_list`
   - `rejected_list`
7. Save screenshots or exported settings as deployment evidence.

The Data Scope must include all eligible FTE OPS approvers and any applicant/employee identity represented in an approval item. An incomplete scope can cause valid items or employee details to fail at the provider boundary.

Reference: [`create_approval_item.md`](./seatalk-approval/create_approval_item.md).

## 4. Configure callback URLs

Use separate staging and production URLs. They must be publicly reachable over HTTPS.

Example:

```text
Staging approve:
https://staging.example.com/api/v1/integrations/seatalk/approval/approve

Staging reject:
https://staging.example.com/api/v1/integrations/seatalk/approval/reject

Production approve:
https://app.example.com/api/v1/integrations/seatalk/approval/approve

Production reject:
https://app.example.com/api/v1/integrations/seatalk/approval/reject
```

Requirements:

- DNS resolves publicly.
- TLS certificate is valid.
- Requests reach the Laravel application without frontend routing interference.
- The endpoints respond within SeaTalk's callback timeout.
- The application verifies the SeaTalk signature against the raw request body.
- Callback bodies and secrets are not written to ordinary application logs.

Do not enable production callbacks until the application endpoints exist and signature verification has been tested.

## 5. Store backend configuration

Add the following values to the backend secret store or deployment environment. Do not commit real values and do not place them in frontend variables.

```env
SEATALK_APP_ID=<workspace-app-id>
SEATALK_APP_SECRET=<workspace-app-secret>
SEATALK_CALLBACK_SIGNING_SECRET=<callback-signing-secret>
SEATALK_APPROVAL_BASE_URL=https://openapi.seatalk.io

SEATALK_APPROVE_CALLBACK_URL=https://staging.example.com/api/v1/integrations/seatalk/approval/approve
SEATALK_REJECT_CALLBACK_URL=https://staging.example.com/api/v1/integrations/seatalk/approval/reject

SEATALK_APPROVAL_ASSIGNMENT_SECONDS=180
SEATALK_PRESENCE_ACTIVE_SECONDS=60
SEATALK_HTTP_CONNECT_TIMEOUT=5
SEATALK_HTTP_TIMEOUT=10
```

The implementation should fail closed when `SEATALK_APP_ID`, `SEATALK_APP_SECRET`, or `SEATALK_CALLBACK_SIGNING_SECRET` is missing.

After setting values:

1. Confirm they are available only to the backend process.
2. Confirm secrets are redacted from logs and error pages.
3. Restart workers after changing secrets.
4. Record the secret rotation owner and rotation procedure.

## 6. Prepare employee identity mapping

For every FTE OPS approver, collect:

| Local field | Required value |
| --- | --- |
| Local profile ID | Existing application user ID |
| Name | Display name |
| Email | Active work email |
| Role | `fte_ops` |
| SeaTalk employee code | Exact provider employee code |
| Active | Whether the user can receive new assignments |

Verify each SeaTalk employee code through the SeaTalk employee directory or the available SeaTalk MCP employee lookup. Do not route by display name alone.

Recommended validation:

1. Every active `fte_ops` profile has a SeaTalk employee code.
2. Every mapped SeaTalk employee exists in the organization.
3. Disabled local users are excluded from routing.
4. A user who logs out or stops heartbeats becomes ineligible after the configured threshold.
5. Mapping changes are audited.

## 7. Prepare the application runtime

The integration requires reliable background execution.

### Queue worker

Run a production-equivalent worker for:

- Approval Center item creation/update
- Failed provider-call retries
- Assignment expiry
- Next-approver routing
- State reconciliation

The worker must be restartable and must not execute the same assignment-expiry job concurrently without the application's locking safeguards.

### Scheduler

Schedule:

- assignment expiry at least once per minute;
- failed provider delivery retry with bounded backoff;
- reconciliation at a lower frequency, such as every five minutes;
- cleanup of old callback replay records according to the retention policy.

### Database

Ensure staging and production support:

- transactions and row locks;
- unique constraints for active assignments;
- indexed expiry scans;
- durable request-event and callback-event history.

## 8. Configure the mobile detail path

Each Approval Center item needs a detail destination when using the “View Details” action.

Confirm the final SeaTalk app path format and item identifier convention with the SeaTalk app configuration. The existing provider documentation uses a format similar to:

```text
seatalk://application/sop/<app-path>?itemId=<item-id>
```

The detail destination must:

- open the correct request;
- require normal application authentication;
- reject access to requests outside the user's authorization scope;
- remain safe when the item is already approved, rejected, expired, or cancelled.

## 9. Create a staging test setup

Before production enablement, prepare:

- a staging SeaTalk app or isolated test configuration;
- at least three test FTE OPS users;
- one OPS PIC test user;
- one user with no active heartbeat;
- staging callback URLs;
- staging database and queue worker;
- a controlled way to create and cancel test requests;
- access to backend logs and request-event history.

Use test identities that can be safely approved, rejected, disabled, and remapped.

## 10. Execute the readiness checks

### SeaTalk checks

- [ ] Workspace App capability enabled.
- [ ] Approval Center permissions approved.
- [ ] Data Scope covers all test approvers and applicants.
- [ ] App ID and secret stored in backend secret storage.
- [ ] Callback signing secret configured.
- [ ] Staging callback URLs registered.
- [ ] Mobile detail path opens the staging request.

### Application checks

- [ ] HTTPS callback endpoints are reachable externally.
- [ ] Queue worker is running.
- [ ] Scheduler is running.
- [ ] Presence heartbeat endpoint is available.
- [ ] Test users have valid employee-code mappings.
- [ ] Database migrations are applied in staging.
- [ ] Provider calls use a staging app/configuration.
- [ ] Secrets are absent from frontend bundles and logs.

### Behavioral checks

- [ ] Request appears in the web table immediately after creation.
- [ ] SeaTalk item is created with the correct pending approver.
- [ ] Web approval changes the canonical request and closes SeaTalk routing.
- [ ] SeaTalk approval changes the canonical request and updates the web table.
- [ ] SeaTalk rejection records the reason.
- [ ] A three-minute timeout routes to the next eligible user.
- [ ] An inactive user is skipped.
- [ ] A late callback cannot approve the request.
- [ ] Duplicate callbacks do not create duplicate transitions.
- [ ] Simultaneous web and SeaTalk approvals produce one winner.
- [ ] Provider outage does not falsely approve or hide the request.

## 11. Production enablement

Enable in this order:

1. Deploy database schema and backend code with SeaTalk interactive actions disabled.
2. Verify queue, scheduler, callback reachability, and employee mappings.
3. Enable presence heartbeat and observe active-user data.
4. Enable SeaTalk item provisioning for a small allowlist.
5. Run the full behavioral test matrix.
6. Enable callbacks and interactive actions.
7. Expand to all eligible FTE OPS users after monitoring the first production requests.

Keep a feature flag or configuration kill switch that stops new SeaTalk routing while preserving the existing web checkbox approval.

## 12. Evidence to retain

Keep the following with the deployment record:

- SeaTalk app ID and environment name, but not the secret;
- permission approval record;
- Data Scope record;
- callback URL configuration;
- test employee-code mapping;
- staging test results;
- migration and deployment identifiers;
- queue/scheduler health evidence;
- feature-flag state;
- rollback and secret-rotation owner.

## Source documents

- [`FTE_OPS_Dual_Approval_Implementation_Plan.md`](./FTE_OPS_Dual_Approval_Implementation_Plan.md)
- [`overview_of_approval_center.md`](./seatalk-approval/overview_of_approval_center.md)
- [`create_approval_item.md`](./seatalk-approval/create_approval_item.md)
- [`approval_center_definition_explanations.md`](./seatalk-approval/approval_center_definition_explanations.md)
- [SeaTalk Open Platform](https://open.seatalk.io/)
