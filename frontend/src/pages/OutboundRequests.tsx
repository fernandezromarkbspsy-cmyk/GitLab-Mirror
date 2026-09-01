import { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, CalendarDays, ChartNoAxesCombined, ChevronLeft, ChevronRight, CircleCheck, CircleDollarSign, Clock3, Hash, ListChecks, MoreHorizontal, Package, RefreshCw, Search, ShieldCheck, SlidersHorizontal, Table2, Tag, Truck, Users, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import { api } from '../lib/api';
import { defaultRequestFilters, exportRequestsCsv } from '../lib/requests';
import type { Page, RequestFilters, RequestSort, TruckRequest, User } from '../types';
import { useUiStore } from '../stores/ui';
import { LinehaulFilterPanel } from '../components/LinehaulFilterPanel';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function displayValue(value?: string | null) {
  return value?.trim() ? value : '-';
}

function statusLabel(status: TruckRequest['status']) {
  return status.replaceAll('_', ' ');
}

export function OutboundRequests({ user, queue: _queue }: { user: User; queue: QueueSnapshot }) {
  const globalSearch = useUiStore(state => state.search);
  const setGlobalSearch = useUiStore(state => state.setSearch);
  const [view, setView] = useState<'table' | 'card'>('table');
  const [filters, setFilters] = useState<RequestFilters>(() => ({ ...defaultRequestFilters, search: globalSearch }));
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TruckRequest | null>(null);
  const [toast, setToast] = useState('');
  const requests = useQuery({
    queryKey: ['requests', 'outbound-all', filters],
    queryFn: () => api<Page<TruckRequest>>(`/requests?${new URLSearchParams({
      page: String(filters.page), per_page: String(filters.perPage), sort: filters.sort, direction: filters.direction,
      ...(filters.status !== 'ALL' ? { status: filters.status } : {}), ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
      ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}), ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
    }).toString()}`),
    placeholderData: previous => previous,
  });
  const rows = useMemo(() => requests.data?.data ?? [], [requests.data]);
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  useEffect(() => {
    if (!selectedRow) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedRow(null); };
    document.addEventListener('keydown', closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previousOverflow; };
  }, [selectedRow]);
  function updateSearch(value: string) { setFilters(current => ({ ...current, search: value, page: 1 })); setGlobalSearch(value); }
  function sortBy(sort: RequestSort) { setFilters(current => ({ ...current, sort, direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc', page: 1 })); }
  async function exportRows() { try { await exportRequestsCsv(filters, `lh-requests-${new Date().toISOString().slice(0, 10)}.csv`); showToast('Linehaul request list exported'); } catch (error) { showToast(error instanceof Error ? error.message : 'CSV export failed'); } }

  return <div className={`workspace-view lh-request-page${selectedRow ? ' lh-drawer-open' : ''}`} aria-label="Linehaul request workspace"><section className="lh-request-workspace" aria-label="Linehaul requests">
    <LinehaulFilterPanel filters={filters} onChange={setFilters} onSort={sortBy} onExport={() => void exportRows()} onNotice={showToast} />
    <section className="lh-table-shell" aria-label="Outbound linehaul request records"><div className="lh-table-toolbar"><div className="lh-view-controls"><button className="lh-toolbar-icon" type="button" aria-label="Refresh records" onClick={() => void requests.refetch()}><RefreshCw size={16} /></button><div className="lh-view-tabs"><button type="button" onClick={() => showToast('Chart view is coming soon')}><ChartNoAxesCombined size={15} />Chart</button><button className={view === 'table' ? 'selected' : ''} type="button" onClick={() => setView('table')}><Table2 size={15} />Table</button><button className={view === 'card' ? 'selected' : ''} type="button" onClick={() => setView('card')}><SlidersHorizontal size={15} />Card</button></div></div><label className="lh-search-box"><Search size={17} /><input value={filters.search} onChange={event => updateSearch(event.target.value)} placeholder="Search by plate number" /><kbd>Ctrl + F</kbd></label></div>
      {view === 'table' ? <div className="lh-records-table" role="table"><div className="lh-table-head lh-table-grid" role="row"><span><CircleCheck size={14} />Status</span><button type="button" onClick={() => sortBy('request_timestamp')}><Clock3 size={14} /><span>Request Time</span><SlidersHorizontal size={13} /></button><button type="button" onClick={() => sortBy('cluster')}><Hash size={14} /><span>Cluster</span><SlidersHorizontal size={13} /></button><span><BadgeCheck size={14} />Region</span><button type="button" onClick={() => sortBy('dock_no')}><Truck size={14} /><span>Dock #</span><SlidersHorizontal size={13} /></button><button type="button" onClick={() => sortBy('backlogs')}><ListChecks size={14} /><span>Backlogs</span><SlidersHorizontal size={13} /></button><span><Truck size={14} />LH Size</span><span><Users size={14} />SOC PIC</span><span><Tag size={14} />LH Trip #</span><button type="button" onClick={() => sortBy('plate_number')}><Hash size={14} /><span>Plate #</span><SlidersHorizontal size={13} /></button><span /></div><div className="lh-table-body">{requests.isPending && <div className="lh-empty-state">Loading live requests...</div>}{requests.error && <div className="lh-empty-state">{requests.error.message}</div>}{!requests.isPending && !requests.error && rows.map((row, index) => <div className="lh-table-row lh-table-grid" role="row" tabIndex={0} key={row.id} style={{ '--row-index': index } as React.CSSProperties} onClick={() => setSelectedRow(row)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedRow(row); } }}><span><span className={`lh-status lh-status-${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span></span><span>{formatDateTime(row.request_timestamp)}</span><span title={row.cluster}>{row.cluster}</span><span>{row.region}</span><span>{row.dock_no}</span><span>{row.backlogs.toLocaleString()}</span><span>{row.truck_size}</span><span>{displayValue(row.ob_fte)}</span><span>{displayValue(row.linehaul_trip_no)}</span><span>{displayValue(row.plate_number)}</span><span className="lh-row-menu-wrap"><button className="lh-row-more" type="button" aria-label={`Actions for request ${row.id}`} onClick={event => { event.stopPropagation(); setOpenRow(openRow === row.id ? null : row.id); }}><MoreHorizontal size={17} /></button>{openRow === row.id && <span className="lh-row-menu"><button type="button" onClick={() => { setSelectedRow(row); setOpenRow(null); }}>View</button><button type="button" onClick={() => showToast(`Editing ${row.id}`)}>Edit</button></span>}</span></div>)}{!requests.isPending && !requests.error && rows.length === 0 && <div className="lh-empty-state">No live requests match the current filters.</div>}</div></div> : <div className="lh-card-view">{rows.map(row => <article className="lh-record-card" key={row.id} tabIndex={0} onClick={() => setSelectedRow(row)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedRow(row); } }}><div><small>{row.id}</small><h3>{row.cluster}</h3><p>{row.region} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Dock {row.dock_no}</p></div><div className="lh-card-right"><strong>{row.truck_size}</strong><span>{row.backlogs.toLocaleString()} backlogs</span><span className={`lh-status lh-status-${row.status.toLowerCase()}`}>{statusLabel(row.status)}</span></div></article>)}</div>}
      <footer className="lh-table-footer"><span>{requests.data ? `Page ${requests.data.current_page} of ${requests.data.last_page}` : 'Page 1'}</span><div className="lh-pagination"><span>Show row</span><select value={String(filters.perPage)} onChange={event => setFilters(current => ({ ...current, perPage: Number(event.target.value), page: 1 }))}><option value="8">8</option><option value="10">10</option><option value="20">20</option></select><button type="button" disabled={!requests.data || requests.data.current_page <= 1} aria-label="Previous page" onClick={() => setFilters(current => ({ ...current, page: Math.max(1, current.page - 1) }))}><ChevronLeft size={16} aria-hidden="true" /></button><button type="button" disabled={!requests.data || requests.data.current_page >= requests.data.last_page} aria-label="Next page" onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}><ChevronRight size={16} aria-hidden="true" /></button></div></footer>
    </section></section>{selectedRow && <><button className="lh-drawer-backdrop" type="button" aria-label="Close request details" onClick={() => setSelectedRow(null)} /><aside className="lh-details-drawer" role="dialog" aria-label="Request details" aria-modal="true"><div className="lh-drawer-header"><div><span className="lh-drawer-eyebrow">Request details</span><h2>{selectedRow.id}</h2></div><button type="button" aria-label="Close request details" onClick={() => setSelectedRow(null)}><X size={18} /></button></div><div className="lh-drawer-profile"><div className="lh-drawer-avatar" aria-hidden="true">{selectedRow.cluster.charAt(0)}</div><div><strong>{selectedRow.cluster}</strong><span>{selectedRow.region}</span></div><span className={`lh-status lh-status-${selectedRow.status.toLowerCase()}`}>{statusLabel(selectedRow.status)}</span></div><div className="lh-drawer-summary"><div><CircleDollarSign size={18} /><span>Backlogs</span><strong>{selectedRow.backlogs.toLocaleString()}</strong></div><div><Clock3 size={18} /><span>Requested</span><strong>{formatDateTime(selectedRow.request_timestamp)}</strong></div></div><dl className="lh-drawer-fields"><div><dt><CalendarDays size={14} />Request time</dt><dd>{formatDateTime(selectedRow.request_timestamp)}</dd></div><div><dt><Hash size={14} />Cluster</dt><dd>{selectedRow.cluster}</dd></div><div><dt><BadgeCheck size={14} />Region</dt><dd>{selectedRow.region}</dd></div><div><dt><Truck size={14} />Dock #</dt><dd>{selectedRow.dock_no}</dd></div><div><dt><ListChecks size={14} />Backlogs</dt><dd>{selectedRow.backlogs.toLocaleString()}</dd></div><div><dt><ShieldCheck size={14} />LH size</dt><dd>{selectedRow.truck_size}</dd></div><div><dt><Users size={14} />SOC PIC</dt><dd>{displayValue(selectedRow.ob_fte)}</dd></div><div><dt><Tag size={14} />LH trip #</dt><dd>{displayValue(selectedRow.linehaul_trip_no)}</dd></div><div><dt><Hash size={14} />Plate #</dt><dd>{displayValue(selectedRow.plate_number)}</dd></div></dl><div className="lh-drawer-footer"><button type="button" onClick={() => showToast(`Editing ${selectedRow.id}`)}>Edit request</button><button type="button" onClick={() => showToast(`Opening ${selectedRow.id}`)}>Open record</button></div></aside></>}{toast && <div className="lh-toast" role="status">{toast}</div>}</div>;
}
