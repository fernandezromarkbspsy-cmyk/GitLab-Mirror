import type { Status } from "../types";

const statusLabelMap: Partial<Record<Status, string>> = {
  REQUESTED: "Requested",
  ASSIGNED: "Assigned",
  CANCELLED: "Cancelled",
  DOCKING: "Docking",
  DOCKED: "Docked",
  PENDING: "Pending",
  REROUTED: "Rerouted",
};

const statusClassMap: Record<Status, string> = {
  REQUESTED:
    "border-current/20 bg-status-pending-surface text-status-pending-ink",
  ASSIGNED:
    "border-current/20 bg-status-info-surface text-status-info-ink",
  CANCELLED:
    "border-current/20 bg-status-danger-surface text-status-danger-ink",
  DOCKING:
    "border-current/20 bg-status-info-surface text-status-info-ink",
  DOCKED:
    "border-current/20 bg-status-success-surface text-status-success-ink",
  PENDING:
    "border-status-pending-line bg-status-pending-surface text-status-pending-ink",
  REROUTED:
    "border-current/20 bg-status-pending-surface text-status-pending-ink",
};

export function StatusBadge({
  status,
  className,
  uppercase = false,
}: {
  status: Status;
  className?: string;
  uppercase?: boolean;
}) {
  return (
    <span
      className={`inline-block min-h-[22px] rounded-full border border-transparent px-2 py-[3px] text-[10px] leading-[13px] font-bold ${statusClassMap[status]}${uppercase ? " uppercase" : ""}${className ? ` ${className}` : ""}`}
    >
      {statusLabelMap[status] ?? status.replaceAll("_", " ")}
    </span>
  );
}
