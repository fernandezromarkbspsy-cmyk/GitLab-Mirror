import { Fragment, type ReactNode, useState } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronsUpDown, CircleDot, Clipboard, Clock3, Copy, Hash, Landmark, ListChecks, Truck, UserRound } from 'lucide-react';
import type { RequestSort, SortDirection, TruckRequest } from '../types';
import { StatusBadge } from './StatusBadge';

type Props = {
  rows: TruckRequest[];
  actions?: (request: TruckRequest) => ReactNode;
  emptyMessage?: string;
  emptyAction?: ReactNode;
  sort?: RequestSort;
  direction?: SortDirection;
  onSort?: (sort: RequestSort) => void;
  visibleColumns?: string[];
};

type Column = { key: string; sortKey?: RequestSort; label: string; icon: typeof CircleDot; render: (request: TruckRequest) => ReactNode };

const columns: Column[] = [
  { key: 'status', sortKey: 'status', label: 'Status', icon: CircleDot, render: request => <StatusBadge status={request.status} /> },
  { key: 'request_timestamp', sortKey: 'request_timestamp', label: 'Request ts', icon: Clock3, render: request => formatDateTime(request.request_timestamp) },
  { key: 'cluster', sortKey: 'cluster', label: 'Cluster', icon: Landmark, render: request => <ClusterCell request={request} /> },
  { key: 'dock_no', sortKey: 'dock_no', label: 'Dock #', icon: Truck, render: request => request.dock_no },
  { key: 'backlogs', sortKey: 'backlogs', label: 'Backlogs', icon: ListChecks, render: request => request.backlogs.toLocaleString() },
  { key: 'ob_fte', label: 'Ops FTE', icon: UserRound, render: request => empty(request.ob_fte) },
  { key: 'linehaul_trip_no', label: 'LHTrip #', icon: Clipboard, render: request => <TripCopyCell request={request} /> },
  { key: 'plate_number', sortKey: 'plate_number', label: 'Plate #', icon: Hash, render: request => empty(request.plate_number) },
  { key: 'mm_fte', label: 'FTE MM', icon: UserRound, render: request => empty(request.created_by) },
  { key: 'truck_size', label: 'Truck Size', icon: Truck, render: request => empty(request.truck_size) },
  { key: 'truck_type', label: 'Truck Type', icon: Truck, render: request => empty(request.truck_type) },
  { key: 'provide_time', label: 'Provide TS', icon: Clock3, render: request => formatDateTime(request.provide_time) },
  { key: 'docked_time', label: 'Docked TS', icon: Clock3, render: request => formatDateTime(request.docked_time) },
  { key: 'doc_officer', label: 'DOC Officer', icon: UserRound, render: request => empty(request.created_by) },
];

export function RequestTable({ rows, actions, emptyMessage = 'No requests found.', emptyAction, sort, direction, onSort, visibleColumns }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  if (!rows.length) return <div className="empty-state"><strong>No requests</strong><p>{emptyMessage}</p>{emptyAction && <div className="empty-state-actions">{emptyAction}</div>}</div>;
  const visibleSet = visibleColumns ? new Set(visibleColumns) : null;
  const renderedColumns = visibleSet ? columns.filter(column => visibleSet.has(column.key)) : columns;

  function heading(column: Column) {
    const content = <span className="table-header-label"><column.icon size={14} />{column.label}</span>;
    if (!onSort || !column.sortKey) return content;
    const active = sort === column.sortKey;
    const Icon = active ? direction === 'asc' ? ArrowUp : ArrowDown : ChevronsUpDown;
    return <button className={`sort-button ${active ? 'is-active' : ''}`} type="button" onClick={() => onSort(column.sortKey!)}>{content}<Icon size={13} /></button>;
  }

  return <div className="table-wrap request-table-wrap"><table className="request-table"><thead><tr><th><span className="sr-only">Expand</span></th>{renderedColumns.map(column => <th key={column.key} className={`request-column request-column--${column.key}`}>{heading(column)}</th>)}{actions && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{rows.map(request => {
    const expanded = expandedId === request.id;
    const detailId = `request-detail-${request.id}`;
    return <Fragment key={request.id}>
      <tr className="request-row" aria-expanded={expanded}>
        <td className="request-column request-column--expand" data-label="Expand">
          <button
            type="button"
            className="expand-button"
            aria-expanded={expanded}
            aria-controls={detailId}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} request ${request.id}`}
            onClick={() => setExpandedId(value => value === request.id ? null : request.id)}
          >
            <ChevronDown size={15} />
          </button>
        </td>
        {renderedColumns.map(column => <td key={column.key} className={`request-column request-column--${column.key}`} data-label={column.label}>{column.render(request)}</td>)}
        {actions && <td className="request-column request-column--actions" data-label="Actions"><div className="row-actions">{actions(request)}</div></td>}
      </tr>
      {expanded && <tr className="request-detail-row" id={detailId}><td colSpan={renderedColumns.length + (actions ? 2 : 1)}><RequestDetails request={request} /></td></tr>}
    </Fragment>;
  })}</tbody></table></div>;
}

function empty(value: string | null | undefined) {
  return value?.trim() ? value : '-';
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function ClusterCell({ request }: { request: TruckRequest }) {
  const value = empty(request.cluster);
  const label = value === '-' ? '-' : `SOC 5 > ${value}`;

  return <div className="cluster-cell" title={value === '-' ? undefined : value}>
    <span className="cluster-cell-value">{label}</span>
  </div>;
}

function TripCopyCell({ request }: { request: TruckRequest }) {
  const [copied, setCopied] = useState(false);
  const value = empty(request.linehaul_trip_no);

  if (value === '-') {
    return <span className="trip-value">-</span>;
  }

  return <div className="trip-cell">
    <button type="button" className={`inline-icon-button ${copied ? 'is-copied' : ''}`} onClick={async event => {
      event.stopPropagation();
      if (!request.linehaul_trip_no) return;
      try {
        await navigator.clipboard.writeText(request.linehaul_trip_no);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      } catch (error) {
        console.error('Unable to copy trip number', error);
      }
    }} aria-label="Copy linehaul trip number" title="Copy linehaul trip number">
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
    <span className="trip-value">{value}</span>
  </div>;
}

function RequestDetails({ request }: { request: TruckRequest }) {
  const fields: Array<[string, ReactNode]> = [
    ['Request ID', request.id],
    ['Created By', request.created_by],
    ['Created At', formatDateTime(request.created_at)],
    ['Updated At', formatDateTime(request.updated_at)],
    ['Driver ID', empty(request.driver_id)],
    ['Rejection Remarks', empty(request.rejection_remarks)],
  ];

  return <div className="request-detail-grid">{fields.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}
