import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShipWheel, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { Modal } from "../components/Modal";
import { PrintableTruckLabel } from "../components/PrintableTruckLabel";
import { RequestTable } from "../components/RequestTable";
import { SkeletonTable } from "../components/SkeletonTable";
import { api } from "../lib/api";
import { buildIdempotencyHeaders } from "../lib/idempotency";
import type { Page, TruckRequest, User } from "../types";

type DockAction = "mark-docked" | "confirm";

export function DockingConfirmation({ user }: { user: User }) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<TruckRequest | null>(null);
  const [printable, setPrintable] = useState<TruckRequest | null>(null);
  const queue = useQuery({
    queryKey: ["requests", "docking"],
    queryFn: () =>
      api<Page<TruckRequest>>(
        "/requests?per_page=100&sort=created_at&direction=desc",
      ),
    enabled: user.role === "doc_officer" || user.role === "ops_pic",
  });
  const action = useMutation({
    mutationFn: ({
      request,
      action,
      payload,
    }: {
      request: TruckRequest;
      action: DockAction;
      payload?: Record<string, unknown>;
    }) =>
      api<TruckRequest>(`/requests/${request.id}/${action}`, {
        method: "POST",
        body: JSON.stringify(payload ?? {}),
        headers: buildIdempotencyHeaders(`docking-${action}`, {
          requestId: request.id,
          action,
          payload: payload ?? {},
        }),
      }),
    onSuccess: async (updated, variables) => {
      setSelected(null);
      if (variables.action === "mark-docked") setPrintable(updated);
      await client.invalidateQueries({ queryKey: ["requests"] });
    },
  });
  const rows = (queue.data?.data ?? []).filter(
    (request) =>
      request.status === "FOR_DOCKING" || request.status === "DOCKED",
  );
  const actions = (request: TruckRequest) =>
    request.status === "DOCKED" && user.role === "doc_officer" ? (
      <button
        type="button"
        className="table-action approve"
        disabled={action.isPending}
        onClick={() => action.mutate({ request, action: "confirm" })}
      >
        <CheckCircle2 size={15} />
        Confirm
      </button>
    ) : request.status === "FOR_DOCKING" ? (
      <button
        type="button"
        className="table-action assign"
        disabled={action.isPending}
        onClick={() => setSelected(request)}
      >
        <ShipWheel size={15} />
        Dock truck
      </button>
    ) : null;

  return (
    <div className="workspace-view">
      {action.error && <p className="notice error">{action.error.message}</p>}
      <section className="panel data-panel">
        <div className="panel-head">
          <div>
            <h2>Docking queue</h2>
            <p>Assigned trucks requiring dock action or final confirmation</p>
          </div>
        </div>
        {queue.isPending ? (
          <div className="table-loading-shell">
            <div className="table-loading-toolbar">
              <span className="skeleton-chip" />
              <span className="skeleton-chip" />
            </div>
            <SkeletonTable columns={4} rows={4} compact />
          </div>
        ) : (
          <RequestTable
            rows={rows}
            actions={actions}
            emptyMessage="No trucks are waiting for docking."
          />
        )}
      </section>
      {selected && (
        <DockDialog
          request={selected}
          role={user.role}
          busy={action.isPending}
          onClose={() => setSelected(null)}
          onSubmit={(payload) =>
            action.mutate({ request: selected, action: "mark-docked", payload })
          }
        />
      )}
      {printable && (
        <PrintableTruckLabel
          request={printable}
          onClose={() => setPrintable(null)}
        />
      )}
    </div>
  );
}

function DockDialog({
  request,
  role,
  busy,
  onClose,
  onSubmit,
}: {
  request: TruckRequest;
  role: User["role"];
  busy: boolean;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit(
      role === "doc_officer"
        ? { driver_id: data.get("driver_id") }
        : { linehaul_trip_no: data.get("linehaul_trip_no") },
    );
  }
  return (
    <Modal
      open
      onClose={onClose}
      className="form-dialog compact"
      role="dialog"
      ariaLabel={`Dock truck for ${request.cluster}`}
    >
      <div className="dialog-head">
        <div>
          <p className="eyebrow">{request.cluster}</p>
          <h2>Dock truck</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>
      <form onSubmit={submit}>
        {role === "doc_officer" ? (
          <label>
            Driver ID
            <input
              name="driver_id"
              required
              defaultValue={request.driver_id ?? ""}
            />
          </label>
        ) : (
          <label>
            LH Trip Number
            <input
              name="linehaul_trip_no"
              required
              defaultValue={request.linehaul_trip_no ?? ""}
            />
          </label>
        )}
        <div className="dialog-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Mark as docked"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
