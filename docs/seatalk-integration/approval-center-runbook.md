# SeaTalk Approval Center runbook

## Normal operation

The scheduler expires inactive assignments every minute and retries failed or
pending Approval Center item synchronization every five minutes. The local
request approval fields remain canonical; provider failures are recorded on the
local approval item and never undo a committed web or SeaTalk decision.

Inspect the current local queue without changing state:

```sh
php artisan seatalk:reconcile-approvals
```

Retry provider delivery after correcting provider connectivity or configuration:

```sh
php artisan seatalk:reconcile-approvals --repair
```

The command is deliberately local-state driven. It does not overwrite a local
approval from an untrusted provider response. When the documented get endpoint
is configured, it compares provider status with canonical local status before
repairing delivery. Provider endpoint contracts must be configured and verified
before enabling delivery.

## Secret rotation and permission changes

1. Disable `SEATALK_APPROVAL_ENABLED`.
2. Rotate the app secret and callback signing secret in the deployment secret
   store; never put either value in logs or the frontend configuration.
3. Update the SeaTalk app permissions/Data Scope and callback URLs.
4. Deploy the new values and run the command in dry-run mode.
5. Re-enable delivery only after a signed callback and a provider create/update
   test succeed.

## Replay and callback investigation

Search `seatalk_callback_events` by `event_id`, provider item ID, request ID,
and employee code. Duplicate event IDs are acknowledged without applying a
second approval. Invalid signatures are rejected before controller handling;
inspect application logs for the request timestamp and callback route.

## Disable and rollback

Set `SEATALK_APPROVAL_ENABLED=false` and stop the scheduler/queue worker if
provider traffic must stop immediately. Web approval remains available. Do not
roll back request approval metadata after a local decision has committed; repair
provider delivery with `seatalk:reconcile-approvals --repair` after recovery.
