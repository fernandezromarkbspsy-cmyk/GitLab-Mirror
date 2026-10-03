# Approval Center Dual Approval Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add SeaTalk Approval Center as a second approval channel while preserving the existing FTE OPS web-checkbox workflow, with the backend as the single source of truth.

**Architecture:** Both web and SeaTalk actions call one idempotent approval service. SeaTalk approval items and routing assignments are persisted locally; SeaTalk is treated as a delivery/UI channel, not the authoritative state store. A scheduled expiry worker advances sequential assignments, while callbacks reject stale or duplicate actions.

**Tech Stack:** Laravel 12/PHP 8.3, PostgreSQL/Supabase, React/TypeScript, SeaTalk Open Platform Approval Center server APIs, Laravel scheduler/queue, PHPUnit, Vitest, Playwright.

**Spec:** `docs/seatalk-integration/FTE_OPS_Dual_Approval_Implementation_Plan.md`

## Global Constraints

- Preserve the existing web checkbox approval path.
- First valid approval wins; the backend database remains authoritative.
- A request must remain visible in the FTE OPS table while SeaTalk routing is active.
- SeaTalk approval must update the same request state used by the web checkbox.
- Web approval must close or invalidate outstanding SeaTalk assignments.
- SeaTalk callbacks must be authenticated, replay-safe, and idempotent.
- Do not expose SeaTalk app secrets or callback signing secrets to the frontend.
- Do not route new approvals to inactive FTE OPS users.
- Do not implement provider calls without confirmed app permissions, Data Scope, callback URLs, and exact current API contract.

## Review Focus

- Concurrent web and SeaTalk approvals: exactly one state transition and one audit event.
- Expired or late SeaTalk actions: request remains unchanged and callback is safely acknowledged.
- Duplicate provider callbacks: no duplicate approval, notification, or event.
- Missing/inactive approvers: routing pauses without hiding the request from the web table.
- SeaTalk/API failures: local approval state is not falsely advanced and retry behavior is observable.

### Task 1: Confirm provider contract and integration configuration

**Files:**
- Modify: `backend/.env.example`
- Modify: `backend/config/services.php`
- Create: `docs/seatalk-integration/approval-center-configuration.md`
- Test: `backend/tests/Feature/SeatalkApprovalConfigurationTest.php`

**Interfaces:**
- Produces configuration keys for app ID, app secret, callback signing secret, API base URL, callback URLs, assignment window, and presence threshold.
- Records the required SeaTalk Workspace App capability, Approval Center permissions, Data Scope, and employee-code mapping requirements.

- [ ] Document the exact SeaTalk endpoints and payload limits from the approved provider documentation, including create/update item and callback signature verification.
- [ ] Add server-only configuration entries with safe defaults for non-secret URLs and durations.
- [ ] Add configuration tests proving missing secrets fail closed and callback URLs are not exposed through public config.
- [ ] Obtain/record operator confirmation of SeaTalk app permissions, Data Scope, callback URLs, and mobile detail-page path before enabling provider traffic.

### Task 2: Normalize request approval state and audit fields

**Files:**
- Create: `backend/database/migrations/*_add_approval_metadata_to_requests.php`
- Create: `backend/database/migrations/*_create_seatalk_approval_assignments.php`
- Modify: `backend/app/Features/Requests/RequestStatus.php`
- Modify: `backend/app/Features/Requests/RequestRepository.php`
- Modify: `supabase/migrations/*_approval_center_schema.sql`
- Test: `backend/tests/Feature/ApprovalSchemaTest.php`

**Interfaces:**
- `requests`: canonical approval status/source/actor/timestamp and a version or equivalent optimistic-concurrency guard.
- `seatalk_approval_items`: one local record per request/provider item.
- `seatalk_approval_assignments`: request/item/employee assignment, status, sent/expiry/action timestamps, provider response IDs, and unique active-assignment constraints.

- [ ] Reconcile legacy Supabase enum values with the current Laravel workflow statuses before adding integration fields.
- [ ] Add indexes for pending requests, active assignments, expiry scans, and employee routing.
- [ ] Add foreign keys and unique constraints preventing multiple active assignments for one request.
- [ ] Add migration rollback behavior that does not destroy existing request history.
- [ ] Test schema constraints, status transitions, and assignment uniqueness against PostgreSQL.

### Task 3: Extract the shared approval service

**Files:**
- Create: `backend/app/Features/Approvals/ApprovalService.php`
- Create: `backend/app/Features/Approvals/ApprovalResult.php`
- Modify: `backend/app/Features/Requests/RequestService.php`
- Modify: `backend/app/Features/Requests/RequestAuthorizer.php`
- Modify: `backend/app/Features/Requests/RequestController.php`
- Test: `backend/tests/Feature/ApprovalServiceTest.php`
- Test: `backend/tests/Feature/RequestWorkflowTest.php`

**Interfaces:**
- `approve(string $requestId, ApprovalActor $actor, ApprovalSource $source, ?string $assignmentId): ApprovalResult`
- `reject(string $requestId, ApprovalActor $actor, ApprovalSource $source, ?string $assignmentId, string $reason): ApprovalResult`
- `closeAssignments(string $requestId, string $reason): void`

- [ ] Move the existing web approval transition into the shared service without changing its authorization or response contract.
- [ ] Enforce request-pending and assignment-active checks under a row lock/transaction.
- [ ] Record source, actor, timestamps, correlation ID, and transition metadata once per accepted action.
- [ ] Close active SeaTalk assignments after web approval, rejection, cancellation, or other terminal state.
- [ ] Preserve existing idempotency middleware and make repeated actions return the already-established result.
- [ ] Add tests for web approval parity, unauthorized actors, terminal requests, duplicate actions, and concurrent approval attempts.

### Task 4: Add SeaTalk API client and access-token provider

**Files:**
- Create: `backend/app/Integrations/SeaTalk/SeaTalkClient.php`
- Create: `backend/app/Integrations/SeaTalk/SeaTalkTokenProvider.php`
- Create: `backend/app/Integrations/SeaTalk/SeaTalkApprovalCenterAdapter.php`
- Create: `backend/app/Integrations/SeaTalk/SeaTalkProviderException.php`
- Test: `backend/tests/Unit/SeaTalkTokenProviderTest.php`
- Test: `backend/tests/Unit/SeaTalkApprovalCenterAdapterTest.php`

**Interfaces:**
- `SeaTalkClient::request(string $method, string $path, array $payload): SeaTalkResponse`
- `SeaTalkApprovalCenterAdapter::createItem(ApprovalItemPayload $payload): ProviderItemResult`
- `SeaTalkApprovalCenterAdapter::updateItem(string $providerItemId, ApprovalItemPayload $payload): void`

- [ ] Implement app-access-token caching with expiry skew, timeout limits, and redacted logs.
- [ ] Implement provider request validation and typed errors for authentication, permission, validation, rate-limit, and transient failures.
- [ ] Map the local approval item to SeaTalk fields: item ID, applicant, timestamps, status, approval chain, pending/approved/rejected lists, action URLs, and app path.
- [ ] Do not mark local delivery successful until the provider response is accepted.
- [ ] Unit-test payload mapping, localization fallback, token refresh, timeout handling, and error classification using HTTP fakes.

### Task 5: Create approval items when requests are submitted

**Files:**
- Create: `backend/app/Features/Approvals/ApprovalItemProvisioner.php`
- Modify: `backend/app/Features/Requests/RequestService.php`
- Modify: `backend/app/Features/Requests/RequestRepository.php`
- Test: `backend/tests/Feature/ApprovalItemProvisioningTest.php`

**Interfaces:**
- `ApprovalItemProvisioner::provisionForRequest(object $request): ProvisioningResult`
- `ApprovalItemProvisioner::sync(string $requestId): void`

- [ ] Persist the request before attempting provider delivery so web visibility is immediate.
- [ ] Provision or enqueue SeaTalk item creation after commit; never hold the request transaction on a remote API call.
- [ ] Generate stable, provider-safe item IDs from the local request ID.
- [ ] Populate current pending approvers and use the configured detail-page path.
- [ ] Record provider failures for retry without changing canonical approval state.
- [ ] Test request visibility, retryable failure, non-retryable failure, and stable item identity.

### Task 6: Implement presence and routing

**Files:**
- Create: `backend/database/migrations/*_add_presence_to_profiles.php`
- Create: `backend/app/Features/Presence/PresenceController.php`
- Create: `backend/app/Features/Approvals/ApprovalRouter.php`
- Create: `backend/app/Jobs/ExpireSeaTalkAssignments.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/PresenceTest.php`
- Test: `backend/tests/Feature/ApprovalRoutingTest.php`
- Test: `backend/tests/Feature/ExpireSeaTalkAssignmentsTest.php`

**Interfaces:**
- `POST /api/v1/presence/heartbeat`
- `ApprovalRouter::assignNext(string $requestId): RoutingResult`
- `ExpireSeaTalkAssignments::handle(): void`

- [ ] Track `last_seen_at` for active authenticated FTE OPS users; deduplicate multiple tabs by user ID.
- [ ] Define active eligibility as the configured heartbeat threshold and active profile status.
- [ ] Select the next eligible user with a persisted round-robin cursor and row locking.
- [ ] Create an assignment with a three-minute expiry, then send the SeaTalk item/update outside the database lock.
- [ ] Expire assignments idempotently and route to the next eligible user.
- [ ] Leave the request pending and visible when no eligible user exists.
- [ ] Test round-robin order, inactive users, simultaneous routing, expiry, retry, and no-candidate behavior.

### Task 7: Add authenticated SeaTalk callbacks

**Files:**
- Create: `backend/app/Features/Approvals/SeaTalkApprovalCallbackController.php`
- Create: `backend/app/Features/Approvals/SeaTalkCallbackSignature.php`
- Create: `backend/app/Http/Middleware/VerifySeaTalkCallback.php`
- Modify: `backend/routes/api.php`
- Test: `backend/tests/Feature/SeaTalkApprovalCallbackTest.php`

**Interfaces:**
- `POST /api/v1/integrations/seatalk/approval/approve`
- `POST /api/v1/integrations/seatalk/approval/reject`
- Callback payloads must include provider item ID, local item ID, employee identity, reason where applicable, timestamp, and provider event/correlation ID.

- [ ] Verify the provider signature against the raw request body and reject missing, malformed, or mismatched signatures.
- [ ] Resolve employee identity by SeaTalk employee code, not by untrusted display name or email alone.
- [ ] Resolve the active assignment and invoke the shared approval service.
- [ ] Reject expired, closed, cancelled, duplicate, or unauthorized callbacks without mutating request state.
- [ ] Store callback event IDs for replay protection and return provider-compatible acknowledgements.
- [ ] Test valid callbacks, invalid signatures, wrong employee, late approval, duplicate callback, concurrent callback, and rejection reason validation.

### Task 8: Synchronize Approval Center item state

**Files:**
- Create: `backend/app/Features/Approvals/ApprovalItemSynchronizer.php`
- Modify: `backend/app/Features/Approvals/ApprovalService.php`
- Modify: `backend/app/Features/Approvals/ApprovalRouter.php`
- Test: `backend/tests/Feature/ApprovalItemSynchronizationTest.php`

- [ ] Update pending/approved/rejected lists and approval-chain action data after every accepted state change.
- [ ] Close or invalidate active assignments when the web channel wins.
- [ ] Ensure provider synchronization failure is retried and does not roll back an already-committed local approval.
- [ ] Test approved, rejected, rerouted, cancelled, and provider-outage states.

### Task 9: Update the web UI and SeaTalk detail flow

**Files:**
- Modify: `frontend/src/hooks/useOutboundRequests.ts`
- Modify: `frontend/src/pages/OutboundRequests.tsx`
- Modify: `frontend/src/lib/routes.ts`
- Create/modify: `frontend/src/components/approval/*`
- Test: `frontend/src/pages/OutboundRequests.test.tsx`
- Test: `frontend/e2e/approval-center.spec.ts`

- [ ] Keep the existing approval checkbox behavior and make its checked/disabled state derive from backend status.
- [ ] Display pending/routing/approved/rejected state without hiding requests during SeaTalk routing.
- [ ] Refresh or subscribe to backend changes so SeaTalk approval appears in the table without manual reload where supported.
- [ ] Show safe retry/error feedback without exposing provider credentials or callback details.
- [ ] Test web approval, SeaTalk-driven state refresh, stale UI action, and request visibility during routing.

### Task 10: Operational safeguards and end-to-end verification

**Files:**
- Modify: `backend/routes/console.php` or scheduler registration
- Create: `backend/app/Console/Commands/ReconcileSeaTalkApprovals.php`
- Create: `backend/tests/Feature/ApprovalReconciliationTest.php`
- Create: `docs/seatalk-integration/approval-center-runbook.md`
- Modify: `docs/seatalk-integration/FTE_OPS_Dual_Approval_Implementation_Plan.md` only if implementation decisions need recording

- [ ] Schedule assignment expiry, failed-delivery retry, and reconciliation jobs.
- [ ] Add metrics/logging for callback success, invalid signatures, provider errors, assignment expiry, and approval latency.
- [ ] Add a reconciliation command that compares local pending items and provider state without changing canonical state blindly.
- [ ] Document secret rotation, permission changes, callback replay investigation, and rollback/disable procedure.
- [ ] Run focused backend tests, frontend tests, static checks, build, and end-to-end tests against a configured SeaTalk-compatible test environment.
- [ ] Validate the full matrix: web wins, SeaTalk wins, reject, timeout/reroute, no active approver, duplicate callback, simultaneous actions, cancellation, and provider outage.

## Dependency Order

```text
1 Config/contract ──> 2 Schema ──> 3 Shared approval service
                                      ├──> 4 SeaTalk client
                                      ├──> 5 Item provisioning
                                      ├──> 6 Presence/routing
                                      └──> 7 Callback handling
                                                └──> 8 Item synchronization
3 + 8 ──> 9 Web/detail UX ──> 10 Operations and end-to-end verification
```

## Release Strategy

1. Deploy schema and shared-service changes with SeaTalk delivery disabled.
2. Enable presence and shadow routing without interactive approval actions.
3. Enable a test SeaTalk app/Data Scope for a small allowlist of FTE OPS users.
4. Verify callback signatures, late-action protection, and web synchronization.
5. Enable production routing behind a feature flag with an immediate kill switch.
6. Monitor delivery failures, expired assignments, duplicate callbacks, and approval latency before broadening access.

## Self-Review

- The existing web path is preserved in Tasks 3 and 9.
- Backend authority and first-valid-wins behavior are covered by Tasks 3, 7, and 8.
- Routing, presence, expiry, and no-candidate behavior are covered by Task 6.
- Provider authentication, signatures, replay protection, and payload mapping are covered by Tasks 1, 4, and 7.
- UI synchronization and request visibility are covered by Tasks 5, 8, and 9.
- Operational recovery and release controls are covered by Task 10.
- No task authorizes production activation before SeaTalk permissions, Data Scope, callback configuration, and end-to-end verification are complete.
