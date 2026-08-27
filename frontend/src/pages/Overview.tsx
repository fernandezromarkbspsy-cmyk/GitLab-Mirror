import { useMemo, useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, Clock3, Route, Sparkles, Truck, X } from 'lucide-react';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
import { api } from '../lib/api';
import { useUiStore } from '../stores/ui';
import type { AppView, Page, RequestAnalytics, RequestMetrics, Status, TruckRequest, User } from '../types';

const INTRADAY_DATE = '2026-08-23';
const INTRADAY_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5] as const;

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return '';
  return points.reduce((path, point, index, all) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = all[index - 1];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, '');
}

export function Overview({ onNavigate }: { user: User; onNavigate: (view: AppView) => void }) {
  const from = useUiStore(state => state.dateFrom);
  const to = useUiStore(state => state.dateTo);
  const [detailStatus, setDetailStatus] = useState<Status | 'ALL' | null>(null);
  const range = `date_from=${from}&date_to=${to}`;
  const requests = useQuery({
    queryKey: ['requests', 'dashboard'],
    queryFn: () => api<Page<TruckRequest>>('/requests?per_page=100&sort=created_at&direction=desc'),
    placeholderData: previous => previous,
    refetchInterval: 15_000,
  });
  const metrics = useQuery({ queryKey: ['request-metrics', from, to], queryFn: () => api<RequestMetrics>(`/requests/metrics?${range}`), refetchInterval: 15_000 });
  const analytics = useQuery({ queryKey: ['request-analytics', from, to], queryFn: () => api<RequestAnalytics>(`/requests/analytics?${range}`), refetchInterval: 15_000 });
  const intraday = useQuery({ queryKey: ['intraday-dispatch', INTRADAY_DATE], queryFn: () => api<{ data: Array<{ hour: number; orderQty: number }> }>(`/dispatch/intraday?date=${INTRADAY_DATE}`), refetchInterval: 15_000, staleTime: 10_000 });
  const details = useQuery({ queryKey: ['request-details', detailStatus, from, to], queryFn: () => api<Page<TruckRequest>>(`/requests?per_page=100&${range}${detailStatus !== 'ALL' ? `&status=${detailStatus}` : ''}`), enabled: detailStatus !== null });
  const cards: Array<{ label: string; status: Status | 'ALL'; value: number; icon: ReactNode }> = [
    { label: 'Total Request', status: 'ALL', value: metrics.data?.total ?? 0, icon: <img className="metric-icon-image" src="/dashboard-icon/light-bulb.png" alt="" aria-hidden="true" /> },
    { label: 'Pending Request', status: 'PENDING', value: metrics.data?.by_status.PENDING ?? 0, icon: <Clock3 size={18} /> },
    { label: 'For Docking', status: 'FOR_DOCKING', value: metrics.data?.by_status.FOR_DOCKING ?? 0, icon: <Truck size={18} /> },
    { label: 'Docked', status: 'DOCKED', value: metrics.data?.by_status.DOCKED ?? 0, icon: <Truck size={18} /> },
  ];
  const dispatchPoints = intraday.data?.data ?? INTRADAY_HOURS.map(hour => ({ hour, orderQty: 0 }));
  const maxDispatch = Math.max(1, ...dispatchPoints.map(point => point.orderQty));
  const peakDispatch = dispatchPoints.reduce((best, point) => point.orderQty > best.orderQty ? point : best, { hour: 0, orderQty: 0 });
  const chartPoints = dispatchPoints.map((point, index) => ({
    label: String(point.hour),
    count: point.orderQty,
    x: 46 + index * (dispatchPoints.length > 1 ? 608 / (dispatchPoints.length - 1) : 0),
    y: 150 - point.orderQty / maxDispatch * 104,
  }));
  const linePath = smoothPath(chartPoints);
  const areaPath = chartPoints.length ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 160 L ${chartPoints[0].x} 160 Z` : '';
  const peakPoint = chartPoints.reduce((best, point) => point.count > best.count ? point : best, { label: '-', count: 0, x: 350, y: 96 });
  const sizes = ['4W', '6W', '10W', '6WF'] as const;
  const sizeTotal = sizes.reduce((sum, size) => sum + (analytics.data?.truck_sizes[size] ?? 0), 0);
  const rows = requests.data?.data ?? [];
  const linehaulTrips = rows.filter(request => request.linehaul_trip_no || request.driver_id).slice(0, 4);
  const assignedTrucks = rows.filter(request => (request.status === 'FOR_DOCKING' || request.status === 'ASSIGNED') && request.plate_number).slice(0, 4);
  const palette = ['2f6f6a', '3f8f89', '77b7af', 'dbece8'];
  const gradients = useMemo(() => {
    let offset = 0;
    return sizes.map((size, index) => {
      const value = analytics.data?.truck_sizes[size] ?? 0;
      const start = offset;
      offset += sizeTotal ? value / sizeTotal * 100 : 0;
      return `#${palette[index]} ${start}% ${offset}%`;
    }).join(',');
  }, [analytics.data, sizeTotal]);
  const totalRequests = metrics.data?.total ?? 0;
  const pendingRequests = metrics.data?.by_status.PENDING ?? 0;
  const forDockingRequests = metrics.data?.by_status.FOR_DOCKING ?? 0;
  const dockedRequests = metrics.data?.by_status.DOCKED ?? 0;
  const completionRate = totalRequests ? Math.round((dockedRequests / totalRequests) * 100) : 0;
  const activeSignal = dispatchPoints.reduce((sum, point) => sum + point.orderQty, 0);

  return <div className="workspace-view dashboard-view dashboard-overview">
    {(requests.error || metrics.error || analytics.error) && <p className="error notice">Dashboard data could not be loaded.</p>}
    <section className="scorecards-layout" aria-label="Dashboard metrics">
    <section className="overview-metrics" aria-label="Request metrics">
      <button type="button" className="metric-card metric-card--primary" onClick={() => setDetailStatus('ALL')}>
        <span className="metric-card-top">
          <span className="metric-icon"><img className="metric-icon-image" src="/dashboard-icon/ClipboardList.png" alt="" aria-hidden="true" /></span>
          <span className="metric-chip">Live summary</span>
        </span>
        <span className="metric-copy">
          <small>Total Requests</small>
          <strong>{metrics.isPending ? '-' : totalRequests.toLocaleString()}</strong>
        </span>
        <span className="metric-foot">
          <span>{metrics.isPending ? '-' : activeSignal} hourly events</span>
          <ArrowUpRight size={16} />
        </span>
      </button>
      <button type="button" className="metric-card" onClick={() => setDetailStatus('PENDING')}>
        <span className="metric-card-top">
          <span className="metric-icon"><img className="metric-icon-image" src="/dashboard-icon/Clock3.png" alt="" aria-hidden="true" /></span>
          <span className="metric-chip">Needs attention</span>
        </span>
        <span className="metric-copy">
          <small>Pending Request</small>
          <strong>{metrics.isPending ? '-' : pendingRequests.toLocaleString()}</strong>
        </span>
        <span className="metric-foot">
          <span>{metrics.isPending ? '-' : `${totalRequests ? Math.round((pendingRequests / totalRequests) * 100) : 0}% of all requests`}</span>
          <ArrowUpRight size={16} />
        </span>
      </button>
      <button type="button" className="metric-card" onClick={() => setDetailStatus('FOR_DOCKING')}>
        <span className="metric-card-top">
          <span className="metric-icon"><img className="metric-icon-image" src="/dashboard-icon/truck.png" alt="" aria-hidden="true" /></span>
          <span className="metric-chip">Dock queue</span>
        </span>
        <span className="metric-copy">
          <small>For Docking</small>
          <strong>{metrics.isPending ? '-' : forDockingRequests.toLocaleString()}</strong>
        </span>
        <span className="metric-foot">
          <span>{metrics.isPending ? '-' : 'Waiting for dock assignment'}</span>
          <ArrowUpRight size={16} />
        </span>
      </button>
      <button type="button" className="metric-card" onClick={() => setDetailStatus('DOCKED')}>
        <span className="metric-card-top">
          <span className="metric-icon"><img className="metric-icon-image" src="/dashboard-icon/CircleCheckBig.png" alt="" aria-hidden="true" /></span>
          <span className="metric-chip">Completed</span>
        </span>
        <span className="metric-copy">
          <small>Docked</small>
          <strong>{metrics.isPending ? '-' : dockedRequests.toLocaleString()}</strong>
        </span>
        <span className="metric-foot">
          <span>{metrics.isPending ? '-' : `${completionRate}% completion rate`}</span>
          <ArrowUpRight size={16} />
        </span>
      </button>
    </section>
    <section className="balance-shell" aria-label="Total dispatch">
      <article className="balance-card">
        <div className="balance-head">
          <div>
            <h2>Total Dispatch</h2>
            <p>Hourly dispatch volume</p>
          </div>
          <div className="balance-filters" aria-label="Balance filters">
            <span>Live</span>
            <span>{INTRADAY_DATE}</span>
          </div>
        </div>
        <div className="balance-total">
            <strong>{intraday.isPending ? '-' : activeSignal.toLocaleString()}</strong>
        </div>
        <div className="balance-account">
          <div>
            <span>Current period</span>
            <strong>{from} to {to}</strong>
          </div>
          <button className="balance-details" type="button" onClick={() => onNavigate('lh-request')}>See Details</button>
        </div>
      </article>
      <div className="balance-actions" aria-label="Balance actions">
        <button type="button" onClick={() => onNavigate('lh-request')}>View Requests</button>
        <button type="button" onClick={() => onNavigate('docking')}>Dock Queue</button>
        <button type="button" className="balance-action-icon" aria-label="More balance actions">&bull;&bull;&bull;</button>
      </div>
    </section>
    </section>
    <section className="dashboard-grid">
      <article className="panel chart-panel line-panel">
        <div className="panel-head">
          <div>
            <p className="panel-kicker">Signal overview</p>
            <h2>Hourly truck requests</h2>
            <p>Google Sheet · intraday · {INTRADAY_DATE}</p>
          </div>
          <div className="chart-tabs" aria-label="Chart time ranges"><span>1D</span><span>1W</span><span>1M</span></div>
        </div>
        <div className="panel-body panel-body--chart">
          <div className="line-chart"><svg viewBox="0 0 700 190" role="img" aria-label="Intraday dispatch order quantity by hour"><defs><linearGradient id="lineArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--dispatch-accent)" stopOpacity=".20" /><stop offset="100%" stopColor="var(--dispatch-accent)" stopOpacity="0" /></linearGradient></defs><line x1="46" y1="160" x2="654" y2="160" /><line x1="46" y1="112" x2="654" y2="112" /><line x1="46" y1="64" x2="654" y2="64" />{areaPath && <path className="line-area" d={areaPath} />}<path className="line-stroke" d={linePath} />{chartPoints.map(point => <g key={point.label}><circle cx={point.x} cy={point.y} r="4"><title>{point.label}: {point.count} orders</title></circle><text x={point.x} y="178">{point.label}</text></g>)}{chartPoints.length > 0 && <g className="line-callout"><line x1={peakPoint.x} y1={peakPoint.y} x2={peakPoint.x} y2="160" /><rect x={Math.max(48, Math.min(peakPoint.x - 48, 604))} y={Math.max(18, peakPoint.y - 42)} width="96" height="34" rx="5" /><text x={Math.max(96, Math.min(peakPoint.x, 652))} y={Math.max(38, peakPoint.y - 22)}>{peakPoint.label}:00</text><text x={Math.max(96, Math.min(peakPoint.x, 652))} y={Math.max(52, peakPoint.y - 8)}>{peakPoint.count} orders</text></g>}</svg></div>
          <div className="chart-summary inline"><strong>{intraday.isPending ? '-' : activeSignal.toLocaleString()}</strong><span>Total order qty · peak {peakDispatch.orderQty} at {peakDispatch.hour}:00</span><em className={intraday.error ? 'is-error' : ''}>{intraday.error ? 'Sheet unavailable' : 'Auto-sync 15s'}</em></div>
        </div>
      </article>
      <article className="panel chart-panel">
        <div className="panel-head">
          <div>
            <p className="panel-kicker">Distribution</p>
            <h2>Truck sizes</h2>
            <p>Selected date range</p>
          </div>
        </div>
        <div className="panel-body">
          <div className="donut-layout"><div className="donut" style={{ background: sizeTotal ? `conic-gradient(${gradients})` : 'var(--color-bg-base)' }}><span><strong>{sizeTotal}</strong><small>Total</small></span></div><div className="donut-legend">{sizes.map((size, index) => { const count = analytics.data?.truck_sizes[size] ?? 0; return <div key={size}><i style={{ background: `var(--color-primary)` }} /><span>{size}</span><strong>{count} <small>({sizeTotal ? Math.round(count / sizeTotal * 100) : 0}%)</small></strong></div>; })}</div></div>
        </div>
      </article>
      <article className="panel dashboard-list-panel">
        <div className="panel-head">
          <div>
            <p className="panel-kicker">Operational queue</p>
            <h2>Linehaul Trips</h2>
            <p>Driver IDs from dock officer updates</p>
          </div>
          <button className="text-button" type="button" onClick={() => onNavigate('docking')}>View All</button>
        </div>
        <div className="panel-body">
          <div className="dashboard-list">{linehaulTrips.length ? linehaulTrips.map(request => <div className="linehaul-row" key={request.id}><span className="avatar">{(request.driver_id || request.created_by).slice(0, 1).toUpperCase()}</span><div><strong>{request.driver_id || 'Driver pending'}</strong><small>Doc Officer: {request.created_by}</small></div><span>{request.linehaul_trip_no || 'Trip pending'}</span><span>{request.cluster}</span></div>) : <p className="compact-empty">No linehaul trips have been created yet.</p>}</div>
        </div>
      </article>
      <article className="panel dashboard-list-panel">
        <div className="panel-head">
          <div>
            <p className="panel-kicker">Assignments</p>
            <h2>For Docking</h2>
            <p>Assigned trucks with plate number</p>
          </div>
          <button className="text-button" type="button" onClick={() => onNavigate('docking')}>View All</button>
        </div>
        <div className="panel-body">
          <div className="dashboard-list truck-list">{assignedTrucks.length ? assignedTrucks.map(request => <div className="truck-row" key={request.id}><span className="truck-dot"><Truck size={15} /></span><div><strong>{request.cluster}</strong><small>{request.status.replaceAll('_', ' ')}</small></div><span>{request.plate_number}</span><span>{request.truck_size}</span></div>) : <p className="compact-empty">No assigned trucks are ready for docking.</p>}</div>
        </div>
      </article>
    </section>
    {detailStatus !== null && <div className="dialog-layer" role="presentation" onMouseDown={event => event.target === event.currentTarget && setDetailStatus(null)}><section className="form-dialog request-detail-dialog" role="dialog" aria-modal="true" aria-label="Request details"><div className="dialog-head"><div><h2>{cards.find(card => card.status === detailStatus)?.label}</h2><p>{from} to {to} - {details.data?.total ?? 0} requests</p></div><button className="icon-button" aria-label="Close" onClick={() => setDetailStatus(null)}><X size={18} /></button></div>{details.isPending ? <div className="table-loading-shell"><div className="table-loading-toolbar"><span className="skeleton-chip" /><span className="skeleton-chip" /><span className="skeleton-chip" /></div><SkeletonTable columns={14} rows={4} compact /></div> : <RequestTable rows={details.data?.data ?? []} />}</section></div>}
  </div>;
}
