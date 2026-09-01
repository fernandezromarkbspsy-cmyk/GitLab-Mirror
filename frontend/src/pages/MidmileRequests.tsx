import { FormEvent, useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, CheckCircle2, ChevronLeft, ChevronRight, CircleCheck, Clock3, Hash, ListChecks, MoreHorizontal, Tag, Truck, Users, X, XCircle } from 'lucide-react';
import { Modal } from '../components/Modal';
import { statuses } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import { api } from '../lib/api';
import { LinehaulFilterPanel } from '../components/LinehaulFilterPanel';
import { defaultRequestFilters, exportRequestsCsv, requestMetricsQueryString, requestQueryString } from '../lib/requests';
import type { Page, RequestSort, TruckRequest, User } from '../types';

type MmAction = 'assign-truck' | 'reject-mm';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function displayValue(value?: string | null) {
  return value?.trim() ? value : '-';
}

export function MidmileRequests({ user, queue }: { user: User; queue: QueueSnapshot }) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState(defaultRequestFilters);
  const deferredSearch = useDeferredValue(filters.search);
  const [selected, setSelected] = useState<{ request: TruckRequest; action: MmAction } | null>(null);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const appliedFilters = { ...filters, search: deferredSearch };
  const requests = useQuery({
    queryKey: ['requests', 'midmile-all', appliedFilters],
    queryFn: () => api<Page<TruckRequest>>(`/requests?${requestQueryString(appliedFilters)}`),
    placeholderData: previous => previous,
    enabled: user.role === 'fte_mm',
  });
  const metrics = useQuery({
    queryKey: ['request-metrics', 'midmile-all', { search: appliedFilters.search, dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo }],
    queryFn: () => api<{ total: number; awaiting_action: number; by_status: Partial<Record<TruckRequest['status'], number>> }>(`/requests/metrics?${requestMetricsQueryString(appliedFilters)}`),
    placeholderData: previous => previous,
    enabled: user.role === 'fte_mm',
  });
  const transition = useMutation({
    mutationFn: ({ request, action, payload }: { request: TruckRequest; action: MmAction; payload: Record<string, unknown> }) => api<TruckRequest>(`/requests/${request.id}/${action}`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: async (_, variables) => { setSelected(null); setNotice(variables.action === 'assign-truck' ? 'Truck confirmed.' : 'Request returned to Outbound.'); await queryClient.invalidateQueries({ queryKey: ['requests'] }); await queryClient.invalidateQueries({ queryKey: ['request-metrics'] }); },
  });

  const actions = (request: TruckRequest) => request.status === 'APPROVED' ? <><button className="table-action assign" type="button" onClick={() => setSelected({ request, action: 'assign-truck' })}><CheckCircle2 size={15} />Assign</button><button className="table-action reject" type="button" onClick={() => setSelected({ request, action: 'reject-mm' })}><XCircle size={15} />Reject</button></> : null;
  function sortBy(sort: RequestSort) { setFilters(value => ({ ...value, sort, direction: value.sort === sort && value.direction === 'asc' ? 'desc' : 'asc', page: 1 })); }
  async function exportCsv() {
    setExporting(true);
    setNotice('');
    try { await exportRequestsCsv(appliedFilters, `truck-requests-${new Date().toISOString().slice(0, 10)}.csv`); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'CSV export failed.'); }
    finally { setExporting(false); }
  }

  const statusSummary = statuses.map(status => ({ value: status, count: status === 'ALL' ? (metrics.data?.total ?? 0) : (metrics.data?.by_status?.[status] ?? 0) }));

  return <div className={`workspace-view lh-request-page${selected ? ' lh-drawer-open' : ''}`} aria-label="Linehaul request workspace"><section className="lh-request-workspace" aria-label="Midmile linehaul requests">
    {(notice || transition.error) && <p className={`notice${transition.error || notice.includes('failed') ? ' error' : ' success-notice'}`}>{transition.error?.message || notice}</p>}

    <section className="panel data-panel queue-panel"><div><div className="section-title"><h2>Pending confirmation</h2>{queue.count > 0 && <span className="count-badge">{queue.count}</span>}</div><p>Approved requests awaiting FTE Midmile confirmation</p></div>{queue.isPending ? <div className="table-loading-shell"><div className="table-loading-toolbar"><span className="skeleton-chip" /><span className="skeleton-chip" /><span className="skeleton-chip" /></div><SkeletonTable columns={4} rows={4} compact /></div> : queue.error ? <p className="state error">{queue.error.message}</p> : queue.rows.length ? <RequestTable rows={queue.rows} actions={actions} /> : <div className="lh-empty-state">No approved requests are awaiting confirmation.</div>}</section>

    <LinehaulFilterPanel filters={filters} exporting={exporting} onChange={setFilters} onSort={sortBy} onExport={() => void exportCsv()} onNotice={setNotice} />

    <section className="lh-table-shell" aria-label="Midmile linehaul request records"><div className="lh-table-toolbar"><div className="lh-view-controls"><button className="lh-toolbar-icon" type="button" aria-label="Refresh records" onClick={() => void requests.refetch()}><Clock3 size={16} /></button><div className="lh-view-tabs"><button className="selected" type="button"><BadgeCheck size={15} />Table</button></div></div></div><div className="lh-records-table" role="table"><div className="lh-table-head lh-table-grid" role="row"><span><CircleCheck size={14} />Status</span><button type="button" onClick={() => sortBy('request_timestamp')}><Clock3 size={14} /><span>Request Time</span></button><button type="button" onClick={() => sortBy('cluster')}><Hash size={14} /><span>Cluster</span></button><span><BadgeCheck size={14} />Region</span><button type="button" onClick={() => sortBy('dock_no')}><Truck size={14} /><span>Dock #</span></button><button type="button" onClick={() => sortBy('backlogs')}><ListChecks size={14} /><span>Backlogs</span></button><span><Truck size={14} />LH Size</span><span><Users size={14} />SOC PIC</span><span><Tag size={14} />LH Trip #</span><button type="button" onClick={() => sortBy('plate_number')}><Hash size={14} /><span>Plate #</span></button><span /></div><div className="lh-table-body">{requests.isPending && <div className="lh-empty-state">Loading live requests...</div>}{requests.error && <div className="lh-empty-state">{requests.error.message}</div>}{!requests.isPending && !requests.error && (requests.data?.data ?? []).map((row, index) => <div className="lh-table-row lh-table-grid" role="row" tabIndex={0} key={row.id} style={{ '--row-index': index } as React.CSSProperties}><span><span className={`lh-status lh-status-${row.status.toLowerCase()}`}>{row.status.replaceAll('_', ' ')}</span></span><span>{formatDateTime(row.request_timestamp)}</span><span title={row.cluster}>{row.cluster}</span><span>{row.region}</span><span>{row.dock_no}</span><span>{row.backlogs.toLocaleString()}</span><span>{row.truck_size}</span><span>{displayValue(row.ob_fte)}</span><span>{displayValue(row.linehaul_trip_no)}</span><span>{displayValue(row.plate_number)}</span><span className="lh-row-menu-wrap"><button className="lh-row-more" type="button" aria-label={`Actions for request ${row.id}`} onClick={event => { event.stopPropagation(); setOpenRow(openRow === row.id ? null : row.id); }}><MoreHorizontal size={17} /></button>{openRow === row.id && row.status === 'APPROVED' && <span className="lh-row-menu"><button type="button" onClick={() => { setSelected({ request: row, action: 'assign-truck' }); setOpenRow(null); }}>Assign</button><button type="button" onClick={() => { setSelected({ request: row, action: 'reject-mm' }); setOpenRow(null); }}>Reject</button></span>}</span></div>)}{!requests.isPending && !requests.error && (requests.data?.data ?? []).length === 0 && <div className="lh-empty-state">No live requests match the current filters.</div>}</div></div><footer className="lh-table-footer"><span>{requests.data ? `Page ${requests.data.current_page} of ${requests.data.last_page}` : 'Page 1'}</span><div className="lh-pagination"><span>Show row</span><select value={String(filters.perPage)} onChange={event => setFilters(current => ({ ...current, perPage: Number(event.target.value), page: 1 }))}><option value="8">8</option><option value="10">10</option><option value="20">20</option></select><button type="button" disabled={!requests.data || requests.data.current_page <= 1} aria-label="Previous page" onClick={() => setFilters(current => ({ ...current, page: Math.max(1, current.page - 1) }))}><ChevronLeft size={16} aria-hidden="true" /></button><button type="button" disabled={!requests.data || requests.data.current_page >= requests.data.last_page} aria-label="Next page" onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}><ChevronRight size={16} aria-hidden="true" /></button></div></footer></section>

    {selected && <MidmileActionDialog selection={selected} busy={transition.isPending} error={transition.error?.message} onClose={() => setSelected(null)} onSubmit={payload => transition.mutate({ ...selected, payload })} />}
  </section></div>;
}

function MidmileActionDialog({ selection, busy, error, onClose, onSubmit }: { selection: { request: TruckRequest; action: MmAction }; busy: boolean; error?: string; onClose: () => void; onSubmit: (payload: Record<string, unknown>) => void }) {
  const confirming = selection.action === 'assign-truck';
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit(confirming ? { plate_number: data.get('plate_number'), truck_size: data.get('truck_size'), truck_type: data.get('truck_type'), provide_time: data.get('provide_time') || null } : { rejection_remarks: data.get('rejection_remarks') });
  }
  return <Modal open onClose={onClose} className="form-dialog compact" role="dialog" ariaLabelledBy="action-title"><div className="dialog-head"><div><p className="eyebrow">{selection.request.cluster}</p><h2 id="action-title">{confirming ? 'Assign truck' : 'Reject request'}</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit}>{confirming ? <><label>Plate number<input name="plate_number" required autoFocus maxLength={30} /></label><label>Truck size<select name="truck_size" defaultValue={selection.request.truck_size}><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label><label>Truck type<select name="truck_type" defaultValue={selection.request.truck_type}><option>WETLEASE</option><option>DRYLEASE</option></select></label><label>Provide time<input name="provide_time" type="datetime-local" /></label></> : <label>Rejection remarks<textarea name="rejection_remarks" required rows={4} autoFocus /></label>}{error && <p className="error notice">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : confirming ? <><Truck size={17} />Assign truck</> : 'Reject request'}</button></div></form></Modal>;
}
