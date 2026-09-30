# FTE-MM truck-request handoff

## Scope

FTE-MM can access only the Truck Request workspace. An FTE-OPS approval is the
`REQUESTED` workflow state and is presented consistently to every role.

## Design

- The request repository presents `REROUTED` rows as `PENDING` to FTE-MM and
  Doc Officers, while Ops PIC and FTE Ops see `REROUTED`.
- Transition authorization and the stored state machine remain unchanged:
  FTE-MM assignment and rejection still require stored `REQUESTED` requests.
- The Truck Request workspace uses the LH Request table/card controls, without
  create, edit, or FTE-OPS approval controls, and retains only assign/reject
  actions for pending FTE-MM handoffs.

## Security

Authentication and server-side role authorization are unchanged. The UI status
is presentation-only; all transitions continue to validate the actor, stored
status, allowed input fields, and idempotency server-side.
