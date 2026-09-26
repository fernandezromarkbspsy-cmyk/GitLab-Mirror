import type { Status } from "../types";

const statusLabelMap: Partial<Record<Status, string>> = {
  APPROVED: "Approved",
  ASSIGNED: "Assigned",
  CANCELLED: "Cancelled",
  CONFIRMED: "Confirmed",
  DOCKED: "Docked",
  FOR_DOCKING: "For docking",
  PENDING: "Pending",
  REJECTED_BY_MM: "Rejected",
};

const statusClassMap: Record<Status, string> = {
  APPROVED: "bg-status-success-surface text-status-success-ink",
  ASSIGNED: "bg-status-info-surface text-status-info-ink",
  CANCELLED: "bg-status-danger-surface text-status-danger-ink",
  CONFIRMED: "bg-status-success-surface text-status-success-ink",
  DOCKED: "bg-status-success-surface text-status-success-ink",
  FOR_DOCKING: "bg-status-info-surface text-status-info-ink",
  PENDING:
    "border-status-pending-line bg-status-pending-surface text-status-pending-ink",
  REJECTED_BY_MM: "bg-status-danger-surface text-status-danger-ink",
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
