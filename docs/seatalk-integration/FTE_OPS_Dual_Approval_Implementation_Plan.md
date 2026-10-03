# FTE OPS Dual Approval Flow — Final Implementation Plan

## 1. Objective

Introduce a second approval channel using SeaTalk while preserving the current request-table approval flow.

A request submitted by an OPS PIC must:

1. Be saved immediately.
2. Appear immediately in the FTE OPS request table.
3. Remain visible in the request table throughout the approval process.
4. Be approvable through either:
   - the existing request-table checkbox; or
   - SeaTalk interactive approval.
5. Automatically synchronize the request-table checkbox if approval happens through SeaTalk.

The backend database remains the single source of truth.

---

## 2. Final Approval Model

### Approval Channel A — Request Table

Default/current behavior:

1. OPS PIC submits a request.
2. The request appears in the FTE OPS request table.
3. Any authorized FTE OPS user can tick the approval checkbox.
4. Backend marks the request as approved.
5. Any active SeaTalk routing for the request becomes closed/invalid.

### Approval Channel B — SeaTalk

1. OPS PIC submits a request.
2. Request is saved and appears immediately in the FTE OPS request table.
3. Backend identifies FTE OPS users currently active in the web app.
4. Backend selects the first eligible FTE OPS according to the routing rule.
5. SeaTalk sends that FTE OPS an interactive approval message.
6. The FTE OPS receives a 3-minute approval window.
7. If approved:
   - backend marks the request as approved;
   - routing stops;
   - the request-table checkbox is automatically checked.
8. If no action within 3 minutes:
   - current assignment expires;
   - request is routed to the next active eligible FTE OPS.
9. If all eligible active FTE OPS users time out:
   - request remains visible in the request table;
   - request stays pending;
   - routing waits for another eligible FTE OPS.

---

## 3. Core Rule

First valid approval wins.

Both approval channels must call the same backend approval service.

```text
Request Table Checkbox ─┐
                        ├──> Backend Approval Service
SeaTalk Approval ───────┘
                              ↓
                      approval_status = APPROVED
                              ↓
                       Request Table Sync
                              ↓
                              ☑
```

The checkbox must reflect backend state.

The checkbox itself must not be the source of truth.

---

## 4. Request Visibility Rule

The request must never disappear from the FTE OPS request table because of SeaTalk routing.

Expected lifecycle:

```text
OPS PIC submits
        ↓
Request saved
        ↓
Request appears in FTE Request Table
        ↓
approval_status = PENDING
        ↓
SeaTalk routing starts in parallel
        ↓
Request remains visible
```

Recommended UI display:

```text
Pending Approval   ☐
Approved           ☑
Rejected           ✕
Waiting for FTE    ☐
```

---

## 5. Recommended Request Statuses

### Request approval status

```text
PENDING
APPROVED
REJECTED
CANCELLED
```

Optional operational state:

```text
WAITING_FOR_FTE
```

`WAITING_FOR_FTE` may also be represented as a routing state instead of a request approval state.

---

## 6. SeaTalk Routing Statuses

Each SeaTalk assignment should have its own status.

```text
PENDING
SENT
EXPIRED
APPROVED
REJECTED
CLOSED
FAILED
SKIPPED
```

---

## 7. Active FTE OPS Detection

Do not treat a valid login session alone as proof that the user is currently available.

Use a frontend heartbeat.

Recommended behavior:

```text
FTE OPS browser
      ↓ every ~30 seconds
POST /api/presence/heartbeat
      ↓
Backend updates last_seen_at
```

Recommended active rule:

```text
role = FTE_OPS
AND last_seen_at >= NOW() - 60 seconds
```

Important rules:

- multiple tabs must count as one user;
- logging out removes the user from future routing;
- closing the browser eventually makes the user inactive;
- inactive users must not receive new SeaTalk approvals.

---

## 8. SeaTalk Routing Strategy

Use round-robin routing among currently active FTE OPS users.

Example:

```text
Active FTE OPS:
FTE A
FTE B
FTE C
FTE D
FTE E
```

Request 1:

```text
FTE A → FTE B → FTE C → FTE D → FTE E
```

Request 2:

```text
FTE B → FTE C → FTE D → FTE E → FTE A
```

This prevents one FTE OPS user from receiving all approval requests.

---

## 9. Three-Minute Routing Window

Example:

```text
14:00 → Sent to FTE A
14:03 → No response → FTE A assignment expires
14:03 → Sent to FTE B
14:06 → No response → FTE B assignment expires
14:06 → Sent to FTE C
14:08 → FTE C approves
```

Result:

```text
approval_status = APPROVED
approved_by = FTE C
approved_at = 14:08
approval_source = SEATALK
```

Routing stops immediately after approval.

---

## 10. Late Approval Protection

Example:

```text
14:00 → FTE A receives approval
14:03 → FTE A expires
14:03 → FTE B receives approval
14:04 → FTE A presses Approve
```

FTE A's action must not approve the request.

Backend response should behave like:

```text
This approval request is no longer active.
```

Validation must check that:

- request is still pending;
- routing assignment is still active;
- assignment has not expired;
- SeaTalk user matches the assigned FTE OPS;
- secure approval token matches;
- request has not already been approved through the web table.

---

## 11. Manual Checkbox vs SeaTalk Conflict

### Checkbox happens first

```text
FTE A has active SeaTalk assignment
        ↓
FTE B ticks request-table checkbox
        ↓
Backend approves request
        ↓
SeaTalk assignment becomes CLOSED
        ↓
FTE A's old SeaTalk button becomes invalid
```

### SeaTalk happens first

```text
FTE A approves in SeaTalk
        ↓
Backend approves request
        ↓
Frontend syncs
        ↓
Checkbox becomes ☑ automatically
```

Both paths must be idempotent.

---

## 12. Recommended Database Changes

### Existing request table

Add fields similar to:

```text
approval_status
approved_by
approved_at
approval_source
rejected_by
rejected_at
```

Recommended `approval_source` values:

```text
WEB
SEATALK
```

### Presence

Possible structure:

```text
user_presence

user_id
last_seen_at
updated_at
```

Alternatively, presence may be stored in Redis or another short-lived store later.

### Approval routing table

Recommended table:

```text
request_approval_routes

id
request_id
fte_user_id
sequence
status
sent_at
expires_at
responded_at
seatalk_message_id
approval_token
failure_reason
created_at
updated_at
```

This table provides the complete routing and audit history.

---

## 13. Backend Components

Recommended responsibilities:

### Approval Service

Single service responsible for approving a request regardless of source.

Conceptually:

```text
approveRequest(
    request,
    approver,
    source
)
```

Responsibilities:

- confirm request is still pending;
- authorize approver;
- update approval fields;
- close remaining active SeaTalk routes;
- write audit history;
- trigger frontend synchronization.

### Presence Service

Responsibilities:

- receive heartbeat;
- determine active FTE OPS users;
- return each eligible user once even with multiple tabs.

### Approval Routing Service

Responsibilities:

- find active FTE OPS users;
- select next round-robin approver;
- create routing assignment;
- assign 3-minute expiry;
- send SeaTalk interactive message;
- move to next eligible user after timeout.

### SeaTalk Callback Handler

Responsibilities:

- validate SeaTalk callback;
- validate approval token;
- validate assigned FTE OPS;
- validate assignment expiry;
- call shared Approval Service;
- reject duplicate/late actions.

### Timeout Worker

Responsibilities:

- find expired active assignments;
- mark them EXPIRED;
- select the next eligible FTE OPS;
- send the next SeaTalk approval;
- avoid duplicate routing.

---

## 14. Suggested API Endpoints

Exact names may be adjusted to match the project's current API conventions.

```text
POST /api/presence/heartbeat

POST /api/requests/{request}/approve

POST /api/seatalk/approval/callback
```

Internal/server-side routing may use jobs/services rather than a public endpoint.

---

## 15. SeaTalk Interactive Message

Recommended information:

```text
Truck Request #REQ-123

Submitted by: OPS PIC
Cluster: ...
Truck Type: ...
Required Time: ...
Destination: ...

[ Approve ] [ Reject ]
```

Each action must contain a backend-generated secure reference or token.

Never trust request IDs or SeaTalk button values alone.

---

## 16. Rejection Rule

Recommended behavior:

```text
Approve → APPROVED
Reject → REJECTED
Timeout → Next eligible FTE OPS
```

A rejection is a deliberate decision.

It should not automatically move to the next FTE OPS unless the business explicitly changes this rule later.

---

## 17. No Active FTE OPS

If no FTE OPS is currently active:

```text
Request remains visible in request table
approval_status = PENDING
routing state = WAITING_FOR_FTE
```

The request must not fail or disappear.

When an eligible FTE OPS becomes active, the backend can resume SeaTalk routing.

Manual checkbox approval must remain available according to the existing authorization rules.

---

## 18. SeaTalk Failure Handling

If sending the SeaTalk message fails:

1. keep request pending;
2. store the failure;
3. do not mark request rejected;
4. retry according to a controlled retry rule or move to the next eligible FTE OPS;
5. keep the request visible in the request table.

SeaTalk is an approval channel, not the source of truth.

---

## 19. Frontend Synchronization

When approval occurs through SeaTalk, the UI must automatically reflect it.

Possible implementation options:

1. Supabase Realtime / existing realtime mechanism.
2. Short polling.
3. Laravel broadcasting/WebSocket if already available.

Target behavior:

```text
SeaTalk approval
      ↓
Backend updates database
      ↓
Frontend receives updated request
      ↓
Checkbox becomes checked automatically
```

Do not directly manipulate the checkbox from SeaTalk.

The frontend should re-render from backend state.

---

## 20. Audit Requirements

Store at minimum:

```text
request_id
approval_status
approved_by
approved_at
approval_source
routing_attempts
fte_user_id per attempt
sent_at
expires_at
responded_at
result
seatalk_message_id
```

This allows investigation of:

- who received the request;
- who approved;
- which channel was used;
- how long approval took;
- which FTE users timed out;
- whether SeaTalk delivery failed.

---

## 21. Main Edge Cases

The implementation must validate these scenarios:

1. One active FTE OPS.
2. Five active FTE OPS users.
3. No active FTE OPS.
4. FTE approves through checkbox.
5. FTE approves through SeaTalk.
6. FTE rejects through SeaTalk.
7. FTE does nothing for 3 minutes.
8. FTE logs out during the 3-minute window.
9. FTE browser closes during the window.
10. FTE becomes inactive.
11. Previous FTE approves after timeout.
12. Checkbox approval occurs while SeaTalk assignment is active.
13. SeaTalk approval occurs while another FTE has the table open.
14. Two approvals arrive nearly simultaneously.
15. SeaTalk callback is duplicated.
16. SeaTalk delivery fails.
17. Backend restarts during the timer.
18. Multiple browser tabs.
19. Multiple requests submitted at the same time.
20. All active FTE OPS users time out.
21. New FTE OPS logs in while a request is waiting.
22. OPS PIC cancels a pending request.
23. Request is edited while SeaTalk approval is pending.

---

## 22. Request Editing Rule

Recommended initial rule:

Once a request enters approval routing, approval-sensitive fields should not silently change.

If OPS PIC edits important request details while pending:

```text
Cancel current SeaTalk approval assignments
        ↓
Save updated request
        ↓
Generate a new approval routing cycle
```

This prevents an FTE OPS from approving outdated information.

---

## 23. Security Rules

The backend must validate:

- authenticated application user for checkbox approval;
- FTE OPS role;
- SeaTalk callback authenticity;
- SeaTalk user identity;
- active routing assignment;
- token validity;
- expiration;
- request approval state;
- duplicate callback protection.

Never approve based only on frontend state.

---

## 24. Implementation Order

### Phase 1 — Finalize states and backend approval contract

1. Inspect current request approval fields.
2. Map existing checkbox behavior.
3. Define final request approval states.
4. Define the shared approval service contract.
5. Add approval audit/source fields.

### Phase 2 — Database migrations

1. Add request approval fields.
2. Create presence storage.
3. Create approval routing table.
4. Add indexes and uniqueness constraints.
5. Add foreign keys where appropriate.

### Phase 3 — Preserve and refactor existing checkbox approval

1. Move current checkbox approval logic into the shared Approval Service.
2. Keep current UI behavior working.
3. Confirm checkbox approval still works before adding SeaTalk.
4. Add `approval_source = WEB`.

### Phase 4 — FTE OPS presence

1. Add heartbeat endpoint.
2. Add frontend heartbeat.
3. Implement active-user query.
4. Deduplicate multiple tabs.
5. Test logout and inactive timeout.

### Phase 5 — Approval routing engine

1. Load active FTE OPS users.
2. Implement round-robin selection.
3. Create routing assignment.
4. Set `expires_at = sent_at + 3 minutes`.
5. Prevent assigning the same expired FTE again within the same routing cycle.

### Phase 6 — SeaTalk message integration

1. Build interactive approval message.
2. Send message to assigned FTE OPS.
3. Store SeaTalk message/reference ID.
4. Store secure approval token.
5. Handle send failure.

### Phase 7 — SeaTalk callback

1. Validate callback authenticity.
2. Resolve SeaTalk user to application user.
3. Validate active route.
4. Validate token and expiry.
5. Approve or reject.
6. Close remaining routing assignments.
7. Return expired/already-processed response when appropriate.

### Phase 8 — Three-minute timeout worker

1. Find active routes with expired `expires_at`.
2. Mark route EXPIRED.
3. Find next eligible active FTE OPS.
4. Send next SeaTalk approval.
5. Move to waiting state when no eligible user remains.
6. Make processing idempotent.

### Phase 9 — Automatic frontend synchronization

1. Subscribe/request refreshed request state.
2. Update checkbox from backend `approval_status`.
3. Remove direct checkbox-as-source-of-truth logic.
4. Test SeaTalk → backend → request table synchronization.

### Phase 10 — Conflict protection

1. Add database transaction/locking.
2. Enforce first-valid-approval-wins.
3. Close active SeaTalk routes after manual approval.
4. Reject expired SeaTalk actions.
5. Test simultaneous approvals.

### Phase 11 — Testing

Run unit, feature, integration, SeaTalk callback, timeout, and UI synchronization tests for all edge cases defined above.

### Phase 12 — Controlled rollout

Recommended rollout:

```text
Development
    ↓
Test with 1 FTE
    ↓
Test with 2–5 FTE users
    ↓
Staging
    ↓
Observe routing/audit logs
    ↓
Production
```

---

## 25. Acceptance Criteria

The feature is complete only when all of these are true:

- OPS PIC submission immediately appears in the FTE OPS request table.
- Request remains visible throughout SeaTalk routing.
- Existing checkbox approval still works.
- Active FTE OPS users are determined from actual recent web activity.
- SeaTalk initially routes to one active FTE OPS only.
- Each SeaTalk assignment has a 3-minute window.
- Timeout routes to the next eligible active FTE OPS.
- Round-robin prevents one user from receiving every first assignment.
- SeaTalk approval automatically checks the request-table checkbox.
- Manual checkbox approval invalidates outstanding SeaTalk approvals.
- Late SeaTalk approvals cannot overwrite the current state.
- Duplicate callbacks cannot produce duplicate approval.
- No active FTE does not cause request loss.
- SeaTalk outage does not cause request loss.
- Audit history identifies approver, source, time, and routing attempts.
- Backend remains the single source of truth.

---

# Implementation Start

## Phase 1 — Step 1: Inspect Current Approval Implementation

Before modifying anything, inspect the existing implementation for the FTE OPS request-table checkbox.

Identify:

```text
Frontend:
- component containing the checkbox
- API call triggered when checkbox changes
- local state used for checked/unchecked status

Backend:
- route receiving the approval request
- controller/service method
- database column currently updated
- authorization rules

Database:
- current request approval/status fields
```

Do not change the code yet.

The purpose of this step is to identify the current approval path so it can be safely refactored into the shared Approval Service without breaking the existing checkbox flow.

### Expected output from the inspection

```text
Frontend file:
Backend route:
Controller/service:
Database table:
Current approval column:
Current authorization:
```

Once these are known, Phase 1 — Step 2 is to define and implement the shared backend approval contract.
