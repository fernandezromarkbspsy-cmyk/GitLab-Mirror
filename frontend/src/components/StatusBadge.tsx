import type { Status } from '../types';

const statusLabelMap: Partial<Record<Status, string>> = {
  APPROVED: 'Approved',
  ASSIGNED: 'Assigned',
  CANCELLED: 'Cancelled',
  CONFIRMED: 'Confirmed',
  DOCKED: 'Docked',
  FOR_DOCKING: 'For docking',
  PENDING: 'Pending',
  REJECTED_BY_MM: 'Rejected',
};

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`status status--${status.toLowerCase()}`}>{statusLabelMap[status] ?? status.replaceAll('_', ' ')}</span>;
}
