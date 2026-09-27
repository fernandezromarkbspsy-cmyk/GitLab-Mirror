# FTE-MM truck-request handoff

## Scope

FTE-MM can access only the Truck Request workspace. An FTE-OPS approval remains
the authoritative `APPROVED` workflow state, but is presented to FTE-MM as
`PENDING` to indicate that the truck assignment action is waiting for them.

## Design

- The request repository translates an FTE-MM `PENDING` filter to the stored
  `APPROVED` state and translates those rows back to `PENDING` in responses.
- Transition authorization and the stored state machine remain unchanged:
  FTE-MM assignment and rejection still require stored `APPROVED` requests.
- The Truck Request workspace uses the LH Request table/card controls, without
  create, edit, or FTE-OPS approval controls, and retains only assign/reject
  actions for pending FTE-MM handoffs.

## Security

Authentication and server-side role authorization are unchanged. The UI status
is presentation-only; all transitions continue to validate the actor, stored
status, allowed input fields, and idempotency server-side.
