import { FormEvent, useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, Ban, Check, Pencil, Plus, Save, X, XCircle } from 'lucide-react';
import { Pagination } from '../components/Pagination';
import { ColumnVisibilityMenu } from '../components/ColumnVisibilityMenu';
import { Modal } from '../components/Modal';
import { RequestFilters, statuses } from '../components/RequestFilters';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv, requestMetricsQueryString, requestQueryString } from '../lib/requests';
import { useUiStore } from '../stores/ui';
import type { ClusterLookup, Page, RequestSort, TruckRequest, User } from '../types';

type EditableAction = { kind: 'edit' | 'reject'; request: TruckRequest };
type RequestPayload = { cluster: FormDataEntryValue | null; region: FormDataEntryValue | null; dock_no: FormDataEntryValue | null; backlogs: number; backlogs_timestamp?: FormDataEntryValue | null; truck_size: FormDataEntryValue | null; truck_type: FormDataEntryValue | null };

const defaultColumns = ['status', 'request_timestamp', 'cluster', 'dock_no', 'backlogs', 'plate_number', 'truck_size', 'truck_type'];
const columnOptions = [
  { key: 'status', label: 'Status' },
  { key: 'request_timestamp', label: 'Request time' },
  { key: 'cluster', label: 'Cluster' },
  { key: 'dock_no', label: 'Dock #' },
  { key: 'backlogs', label: 'Backlogs' },
  { key: 'ob_fte', label: 'Ops FTE' },
  { key: 'linehaul_trip_no', label: 'LHTrip #' },
  { key: 'plate_number', label: 'Plate #' },
  { key: 'mm_fte', label: 'FTE MM' },
  { key: 'truck_size', label: 'Truck size' },
  { key: 'truck_type', label: 'Truck type' },
  { key: 'provide_time', label: 'Provide time' },
  { key: 'docked_time', label: 'Docked time' },
  { key: 'doc_officer', label: 'DOC officer' },
];

export function OutboundRequests({ user, queue }: { user: User; queue: QueueSnapshot }) {
  const queryClient = useQueryClient();
  const globalSearch = useUiStore(state => state.search);
  const setGlobalSearch = useUiStore(state => state.setSearch);
  const [filters, setFilters] = useState(() => ({ ...defaultRequestFilters, search: globalSearch }));
  const deferredSearch = useDeferredValue(filters.search);
  const [activeAction, setActiveAction] = useState<EditableAction | null>(null);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const appliedFilters = { ...filters, search: deferredSearch };
  const requests = useQuery({
    queryKey: ['requests', 'outbound-all', appliedFilters],
    queryFn: () => api<Page<TruckRequest>>(`/requests?${requestQueryString(appliedFilters)}`),
    placeholderData: previous => previous,
  });
  const metrics = useQuery({
    queryKey: ['request-metrics', 'outbound-all', { search: appliedFilters.search, dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo }],
    queryFn: () => api<{ total: number; awaiting_action: number; by_status: Partial<Record<TruckRequest['status'], number>> }>(`/requests/metrics?${requestMetricsQueryString(appliedFilters)}`),
    placeholderData: previous => previous,
  });

  async function refreshData(message: string) {
    setNotice(message);
    await queryClient.invalidateQueries({ queryKey: ['requests'] });
    await queryClient.invalidateQueries({ queryKey: ['request-metrics'] });
    await queryClient.invalidateQueries({ queryKey: ['request-analytics'] });
  }

  const createRequest = useMutation({
    mutationFn: (payload: RequestPayload) => api<TruckRequest>('/requests', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: async () => { setCreating(false); await refreshData('LH request created.'); },
  });
  const editRequest = useMutation({
    mutationFn: async ({ request, payload }: { request: TruckRequest; payload: RequestPayload }) => {
      await api<TruckRequest>(`/requests/${request.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      return api<TruckRequest>(`/requests/${request.id}/approve`, { method: 'POST', body: '{}' });
    },
    onSuccess: async () => { setActiveAction(null); await refreshData('Request updated and routed to FTE MM.'); },
  });
  const transition = useMutation({
    mutationFn: ({ request, action }: { request: TruckRequest; action: 'approve' | 'reject-ops' | 'cancel' }) => api<TruckRequest>(`/requests/${request.id}/${action}`, { method: 'POST', body: '{}' }),
    onSuccess: async (_, variables) => { setActiveAction(null); await refreshData(variables.action === 'approve' ? 'Request approved.' : variables.action === 'reject-ops' ? 'Request rejected.' : 'Request cancelled.'); },
  });
  const bulkApprove = useMutation({
    mutationFn: (ids: string[]) => api('/requests/bulk-approve', { method: 'POST', body: JSON.stringify({ ids }) }),
    onSuccess: async (_, ids) => {
      await refreshData(`Approved ${ids.length} request${ids.length === 1 ? '' : 's'}.`);
    },
  });

  const actionable = (request: TruckRequest) => request.status === 'PENDING' || request.status === 'REJECTED_BY_MM';
  const actions = (request: TruckRequest) => user.role === 'fte_ops' && actionable(request) ? <>
    <button className="table-action approve" type="button" disabled={transition.isPending} onClick={() => transition.mutate({ request, action: 'approve' })}><Check size={15} />Approve</button>
    <button className="table-action edit" type="button" disabled={editRequest.isPending} onClick={() => setActiveAction({ kind: 'edit', request })}><Pencil size={15} />Edit</button>
    <button className="table-action reject" type="button" disabled={transition.isPending} onClick={() => setActiveAction({ kind: 'reject', request })}><XCircle size={15} />Reject</button>
  </> : user.role === 'ops_pic' && actionable(request) ? <button className="table-action cancel" type="button" disabled={transition.isPending} onClick={() => setActiveAction({ kind: 'reject', request })}><Ban size={15} />Cancel</button> : null;

  function sortBy(sort: RequestSort) {
    setFilters(value => ({ ...value, sort, direction: value.sort === sort && value.direction === 'asc' ? 'desc' : 'asc', page: 1 }));
  }

  async function exportCsv() {
    setExporting(true);
    setNotice('');
    try {
      await exportRequestsCsv(appliedFilters, `lh-requests-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'CSV export failed.');
    } finally {
      setExporting(false);
    }
  }

  const statusSummary = statuses.map(status => ({ value: status, count: status === 'ALL' ? (metrics.data?.total ?? 0) : (metrics.data?.by_status?.[status] ?? 0) }));
  const error = createRequest.error || editRequest.error || transition.error;
  const approvable = requests.data?.data?.filter(request => request.status === 'PENDING' || request.status === 'REJECTED_BY_MM').map(request => request.id) ?? [];
  return <div className="workspace-view">
    {(notice || error) && <p className={`notice${error || notice.includes('failed') ? ' error' : ' success-notice'}`}>{error?.message || notice}</p>}

    <section className="request-list-section">
      <div className="request-page-heading">
        <div>
          <p className="request-page-kicker"><Activity size={13} /> Outbound workspace</p>
          <h1>Linehaul requests</h1>
          <p className="request-page-description">Keep every dock movement visible, actionable, and moving on time.</p>
        </div>
        <div className="request-page-meta"><span className="live-indicator" /> Live queue <strong>{requests.data?.total ?? 0}</strong></div>
      </div>
      <div className="request-snapshot" aria-label="Request snapshot">
        <div className="snapshot-card snapshot-card--accent"><span>All requests</span><strong>{metrics.isPending ? '-' : metrics.data?.total ?? 0}</strong><small>Across the selected range</small></div>
        <div className="snapshot-card"><span>Awaiting action</span><strong>{metrics.isPending ? '-' : metrics.data?.awaiting_action ?? 0}</strong><small>Needs an ops decision</small></div>
        <div className="snapshot-card"><span>Visible rows</span><strong>{requests.isPending ? '-' : requests.data?.data.length ?? 0}</strong><small>Current page results</small></div>
      </div>
      <div className="page-actions">
        {user.role === 'ops_pic' && <button type="button" onClick={() => setCreating(true)}><Plus size={17} />Create request</button>}
        {user.role === 'fte_ops' && <button type="button" className="secondary-button" disabled={!approvable.length || bulkApprove.isPending} onClick={() => bulkApprove.mutate(approvable)}>{bulkApprove.isPending ? 'Approving...' : `Approve ${approvable.length || ''} visible`}</button>}
      </div>
      <div className="request-toolbar-surface">
        <ColumnVisibilityMenu visible={visibleColumns} onChange={setVisibleColumns} options={columnOptions} />
      </div>
      <RequestFilters filters={filters} exporting={exporting} statusSummary={statusSummary} hideStatusFilter={user.role === 'fte_ops'} onChange={next => { setFilters(next); setGlobalSearch(next.search); }} onExport={() => void exportCsv()} onRefresh={() => void requests.refetch()} />
      <section className="panel data-panel">{creating && <InlineCreateRow busy={createRequest.isPending} onCancel={() => setCreating(false)} onSubmit={payload => { setNotice(''); createRequest.mutate(payload); }} />}{requests.isPending ? <div className="table-loading-shell"><div className="table-loading-toolbar"><span className="skeleton-chip" /><span className="skeleton-chip" /><span className="skeleton-chip" /></div><SkeletonTable columns={visibleColumns.length + 2} rows={4} /></div> : requests.error ? <p className="state error">{requests.error.message}</p> : <><RequestTable rows={requests.data?.data ?? []} actions={actions} sort={filters.sort} direction={filters.direction} onSort={sortBy} visibleColumns={visibleColumns} emptyAction={<>{user.role === 'ops_pic' && <button type="button" onClick={() => setCreating(true)}>Create request</button>}<button type="button" className="secondary-button" onClick={() => { setFilters(defaultRequestFilters); setGlobalSearch(''); }}>Clear filters</button><button type="button" className="secondary-button" onClick={() => void requests.refetch()}>Refresh</button></>} /><Pagination page={requests.data!} onPageChange={page => setFilters(value => ({ ...value, page }))} /></>}</section>
    </section>

    {activeAction?.kind === 'edit' && <EditRequestDialog request={activeAction.request} busy={editRequest.isPending} error={editRequest.error?.message} onClose={() => setActiveAction(null)} onSubmit={payload => editRequest.mutate({ request: activeAction.request, payload })} />}
    {activeAction?.kind === 'reject' && <ConfirmRejectDialog request={activeAction.request} isCancel={user.role === 'ops_pic'} busy={transition.isPending} onClose={() => setActiveAction(null)} onConfirm={() => transition.mutate({ request: activeAction.request, action: user.role === 'fte_ops' ? 'reject-ops' : 'cancel' })} />}
  </div>;
}

function requestPayload(form: HTMLFormElement): RequestPayload {
  const data = new FormData(form);
  return { cluster: data.get('cluster'), region: data.get('region'), dock_no: data.get('dock_no'), backlogs: Number(data.get('backlogs')), backlogs_timestamp: data.get('backlogs_timestamp'), truck_size: data.get('truck_size'), truck_type: data.get('truck_type') };
}

function RequestFields({ request }: { request?: TruckRequest }) {
  return <div className="form-grid request-form-grid"><label>Cluster<input name="cluster" required maxLength={120} defaultValue={request?.cluster} /></label><label>Region<input name="region" required maxLength={120} defaultValue={request?.region} /></label><label>Dock number<input name="dock_no" required maxLength={50} defaultValue={request?.dock_no} /></label><label>Backlogs<input name="backlogs" type="number" required min={0} defaultValue={request?.backlogs ?? 0} /></label><label>Truck size<select name="truck_size" defaultValue={request?.truck_size ?? '6W'}><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label><label>Truck type<select name="truck_type" defaultValue={request?.truck_type ?? 'WETLEASE'}><option>WETLEASE</option><option>DRYLEASE</option></select></label></div>;
}

function InlineCreateRow({ busy, onCancel, onSubmit }: { busy: boolean; onCancel: () => void; onSubmit: (payload: RequestPayload) => void }) {
  const [clusterText, setClusterText] = useState('');
  const [selected, setSelected] = useState<ClusterLookup | null>(null);
  const clusterSearch = useDeferredValue(clusterText);
  const lookup = useQuery({
    queryKey: ['clusters', clusterSearch],
    queryFn: () => api<{ data: ClusterLookup[] }>(`/clusters?search=${encodeURIComponent(clusterSearch)}`),
    enabled: clusterSearch.trim().length >= 3,
  });

  function pick(cluster: ClusterLookup) {
    setSelected(cluster);
    setClusterText(cluster.cluster_name);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(requestPayload(event.currentTarget));
  }

  return <form className="inline-create-row" onSubmit={submit}>
    <label className="cluster-lookup-field">Cluster<input name="cluster" required autoFocus maxLength={120} value={clusterText} onChange={event => { setClusterText(event.target.value); setSelected(null); }} placeholder="Type 3 chars" />{lookup.data && !selected && <div className="cluster-suggestions">{lookup.data.data.length ? lookup.data.data.map(cluster => <button key={cluster.id} type="button" onClick={() => pick(cluster)}><strong>{cluster.cluster_name}</strong><span>{cluster.hub_name} / {cluster.region}</span></button>) : <p>No cluster found.</p>}</div>}</label>
    <label>Region<input name="region" required readOnly value={selected?.region ?? ''} /></label>
    <label>Dock No<input name="dock_no" required maxLength={50} defaultValue={selected?.dock_number ?? ''} key={selected?.id ?? 'dock'} /></label>
    <label>Backlogs<input name="backlogs" type="number" required readOnly min={0} value={selected?.backlogs ?? 0} /></label>
    <label>Backlogs Timestamp<input readOnly value={selected?.backlogs_ts ? new Date(selected.backlogs_ts).toLocaleString() : ''} /><input type="hidden" name="backlogs_timestamp" value={selected?.backlogs_ts ?? ''} /></label>
    <label>Truck Size<select name="truck_size" defaultValue="6W"><option>4W</option><option>6W</option><option>10W</option><option>6WF</option></select></label>
    <label>Truck Type<select name="truck_type" defaultValue="WETLEASE"><option>WETLEASE</option><option>DRYLEASE</option></select></label>
    <div className="inline-create-actions"><button className="secondary-button" type="button" onClick={onCancel}><X size={15} />Cancel</button><button disabled={busy || !selected}><Save size={15} />{busy ? 'Saving...' : 'Save'}</button></div>
  </form>;
}

function EditRequestDialog({ request, busy, error, onClose, onSubmit }: { request: TruckRequest; busy: boolean; error?: string; onClose: () => void; onSubmit: (payload: RequestPayload) => void }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(requestPayload(event.currentTarget)); }
  return <Modal open onClose={onClose} ariaLabelledBy="edit-title"><div className="dialog-head"><div><p className="eyebrow">FTE OPS</p><h2 id="edit-title">Edit LH request</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><form onSubmit={submit}><RequestFields request={request} />{error && <p className="error notice">{error}</p>}<div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Cancel</button><button disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></div></form></Modal>;
}

function ConfirmRejectDialog({ request, isCancel, busy, onClose, onConfirm }: { request: TruckRequest; isCancel: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  return <Modal open onClose={onClose} className="form-dialog compact" role="alertdialog" ariaLabelledBy="reject-title"><div className="dialog-head"><div><p className="eyebrow">{request.cluster}</p><h2 id="reject-title">{isCancel ? 'Cancel request' : 'Reject request'}</h2></div><button className="icon-button" type="button" title="Close" aria-label="Close" onClick={onClose}><X size={19} /></button></div><p className="dialog-copy">This request will be moved to Cancelled and removed from the active queue.</p><div className="dialog-actions"><button className="secondary-button" type="button" onClick={onClose}>Keep request</button><button className="danger-button" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Saving...' : isCancel ? 'Cancel request' : 'Reject request'}</button></div></Modal>;
}
