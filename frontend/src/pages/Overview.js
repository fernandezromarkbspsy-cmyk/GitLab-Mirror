import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, X } from 'lucide-react';
import { RequestTable } from '../components/RequestTable';
import { SkeletonTable } from '../components/SkeletonTable';
import { ChartHeader } from '../components/dashboard/ChartHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { Panel } from '../components/dashboard/Panel';
import { QueuePreview } from '../components/dashboard/QueuePreview';
import { api } from '../lib/api';
import { useUiStore } from '../stores/ui';
const INTRADAY_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];
const CHART_RANGES = ['1D', '1W', '1M'];
function getOperationalDate(now = new Date()) {
    const operationalDate = new Date(now);
    if (operationalDate.getHours() < 6)
        operationalDate.setDate(operationalDate.getDate() - 1);
    const year = operationalDate.getFullYear();
    const month = String(operationalDate.getMonth() + 1).padStart(2, '0');
    const day = String(operationalDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function smoothPath(points) {
    if (!points.length)
        return '';
    return points.reduce((path, point, index, all) => {
        if (index === 0)
            return `M ${point.x} ${point.y}`;
        const previous = all[index - 1];
        const midX = (previous.x + point.x) / 2;
        return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
}
export function Overview({ onNavigate }) {
    const from = useUiStore(state => state.dateFrom);
    const to = useUiStore(state => state.dateTo);
    const intradayDate = from === to && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : getOperationalDate();
    const [detailStatus, setDetailStatus] = useState(null);
    const [chartRange, setChartRange] = useState('1D');
    const range = `date_from=${from}&date_to=${to}`;
    const requests = useQuery({
        queryKey: ['requests', 'dashboard'],
        queryFn: () => api('/requests?per_page=100&sort=created_at&direction=desc'),
        placeholderData: previous => previous,
        refetchInterval: 15_000,
    });
    const metrics = useQuery({ queryKey: ['request-metrics', from, to], queryFn: () => api(`/requests/metrics?${range}`), refetchInterval: 15_000 });
    const analytics = useQuery({ queryKey: ['request-analytics', from, to], queryFn: () => api(`/requests/analytics?${range}`), refetchInterval: 15_000 });
    const intraday = useQuery({ queryKey: ['intraday-dispatch', intradayDate], queryFn: () => api(`/dispatch/intraday?date=${intradayDate}`), refetchInterval: 15_000, staleTime: 10_000 });
    const details = useQuery({ queryKey: ['request-details', detailStatus, from, to], queryFn: () => api(`/requests?per_page=100&${range}${detailStatus !== 'ALL' ? `&status=${detailStatus}` : ''}`), enabled: detailStatus !== null });
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
    const sizes = ['4W', '6W', '10W', '6WF'];
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
    const cards = [
        { label: 'Total Requests', status: 'ALL', value: totalRequests, icon: _jsx("img", { className: "metric-icon-image", src: "/dashboard-icon/ClipboardList.png", alt: "", "aria-hidden": "true" }), chip: 'Overall volume', footnote: `${activeSignal} hourly events` },
        { label: 'Pending Requests', status: 'PENDING', value: pendingRequests, icon: _jsx("img", { className: "metric-icon-image", src: "/dashboard-icon/Clock3.png", alt: "", "aria-hidden": "true" }), chip: 'Needs action', footnote: `${totalRequests ? Math.round((pendingRequests / totalRequests) * 100) : 0}% of all requests`, primary: true },
        { label: 'Awaiting Docking', status: 'FOR_DOCKING', value: forDockingRequests, icon: _jsx("img", { className: "metric-icon-image", src: "/dashboard-icon/truck.png", alt: "", "aria-hidden": "true" }), chip: 'Dock queue', footnote: 'Waiting for dock confirmation' },
        { label: 'Completed', status: 'DOCKED', value: dockedRequests, icon: _jsx("img", { className: "metric-icon-image", src: "/dashboard-icon/CircleCheckBig.png", alt: "", "aria-hidden": "true" }), chip: 'Completed', footnote: `${completionRate}% completion rate` },
    ];
    const intradayStatus = intraday.isPending
        ? 'Loading live dispatch data.'
        : intraday.error
            ? 'Dispatch feed unavailable.'
            : 'Live dispatch data. Updates every 15 seconds.';
    return _jsxs("div", { className: "workspace-view dashboard-view dashboard-overview", children: [(requests.error || metrics.error || analytics.error || intraday.error) && _jsx("p", { className: "error notice", role: "alert", children: "Some dashboard data could not be loaded. Check the affected panel for details." }), _jsxs("section", { className: "scorecards-layout", "aria-label": "Dashboard metrics", children: [_jsx("section", { className: "overview-metrics", "aria-label": "Request metrics", children: cards.map(card => _jsx(MetricCard, { label: card.label, value: metrics.isPending ? '-' : card.value.toLocaleString(), icon: card.icon, chip: card.chip, footnote: metrics.isPending ? '-' : card.footnote, primary: card.primary, onClick: () => setDetailStatus(card.status) }, card.status)) }), _jsx("section", { className: "balance-shell top-dispatch-chart", "aria-label": "Hourly dispatch volume", children: _jsxs("article", { className: "balance-card", children: [_jsx(ChartHeader, { kicker: "Dispatch activity", title: "Hourly dispatch volume", description: `Live operational feed · ${intradayDate}`, controls: _jsx("div", { className: "balance-filters", role: "group", "aria-label": "Chart time ranges", children: CHART_RANGES.map(range => _jsx("button", { type: "button", disabled: range !== '1D', "aria-pressed": chartRange === range, title: range === '1D' ? 'Intraday view' : 'This feed currently supports intraday data only', onClick: () => setChartRange(range), children: range }, range)) }) }), _jsxs("div", { className: "top-dispatch-summary", children: [_jsx("strong", { children: intraday.isPending ? '-' : activeSignal.toLocaleString() }), _jsxs("span", { children: ["Total orders \u00B7 peak ", peakDispatch.orderQty, " at ", peakDispatch.hour, ":00"] }), _jsx("em", { className: `chart-sync-status${intraday.error ? ' is-error' : ''}`, role: "status", "aria-live": "polite", "aria-atomic": "true", children: intradayStatus })] }), _jsx("div", { className: "line-chart top-dispatch-line-chart", children: _jsxs("svg", { viewBox: "0 0 700 190", role: "img", "aria-label": "Intraday dispatch order quantity by hour", children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "lineAreaTop", x1: "0", x2: "0", y1: "0", y2: "1", children: [_jsx("stop", { offset: "0%", stopColor: "var(--dispatch-accent)", stopOpacity: ".20" }), _jsx("stop", { offset: "100%", stopColor: "var(--dispatch-accent)", stopOpacity: "0" })] }) }), _jsx("line", { x1: "46", y1: "160", x2: "654", y2: "160" }), _jsx("line", { x1: "46", y1: "112", x2: "654", y2: "112" }), _jsx("line", { x1: "46", y1: "64", x2: "654", y2: "64" }), areaPath && _jsx("path", { className: "line-area", d: areaPath }), _jsx("path", { className: "line-stroke", d: linePath }), chartPoints.map(point => _jsxs("g", { children: [_jsx("circle", { cx: point.x, cy: point.y, r: "4", children: _jsxs("title", { children: [point.label, ": ", point.count, " orders"] }) }), _jsx("text", { x: point.x, y: "178", children: point.label })] }, point.label)), chartPoints.length > 0 && _jsxs("g", { className: "line-callout", children: [_jsx("line", { x1: peakPoint.x, y1: peakPoint.y, x2: peakPoint.x, y2: "160" }), _jsx("rect", { x: Math.max(48, Math.min(peakPoint.x - 48, 604)), y: Math.max(18, peakPoint.y - 42), width: "96", height: "34", rx: "5" }), _jsxs("text", { x: Math.max(96, Math.min(peakPoint.x, 652)), y: Math.max(38, peakPoint.y - 22), children: [peakPoint.label, ":00"] }), _jsxs("text", { x: Math.max(96, Math.min(peakPoint.x, 652)), y: Math.max(52, peakPoint.y - 8), children: [peakPoint.count, " orders"] })] })] }) })] }) })] }), _jsxs("section", { className: "dashboard-grid", children: [_jsx(Panel, { className: "chart-panel truck-mix-panel", kicker: "Distribution", title: "Truck mix", description: "Selected date range", children: _jsxs("div", { className: "donut-layout", children: [_jsx("div", { className: "donut", style: { background: sizeTotal ? `conic-gradient(${gradients})` : 'var(--color-bg-base)' }, children: _jsxs("span", { children: [_jsx("strong", { children: sizeTotal }), _jsx("small", { children: "Total" })] }) }), _jsx("div", { className: "donut-legend", "aria-label": "Truck size breakdown", children: sizes.map((size, index) => { const count = analytics.data?.truck_sizes[size] ?? 0; return _jsxs("div", { children: [_jsx("i", { style: { background: `#${palette[index]}` } }), _jsx("span", { children: size }), _jsxs("strong", { children: [count, " ", _jsxs("small", { children: ["(", sizeTotal ? Math.round(count / sizeTotal * 100) : 0, "%)"] })] })] }, size); }) })] }) }), _jsxs("article", { className: "panel dashboard-list-panel dashboard-list-panel--trips", children: [_jsxs("div", { className: "panel-head", children: [_jsxs("div", { children: [_jsx("p", { className: "panel-kicker", children: "Linehaul activity" }), _jsx("h2", { children: "Recent linehaul trips" }), _jsx("p", { children: "Latest trips with driver assignments" })] }), _jsx("button", { className: "text-button", type: "button", onClick: () => onNavigate('docking'), children: "View All" })] }), _jsx("div", { className: "panel-body", children: _jsx(QueuePreview, { items: linehaulTrips, emptyMessage: "No linehaul trips have been created yet.", renderItem: request => _jsxs("div", { className: "linehaul-row", children: [_jsx("span", { className: "avatar", children: (request.driver_id || request.created_by).slice(0, 1).toUpperCase() }), _jsxs("div", { children: [_jsx("strong", { children: request.driver_id || 'Driver pending' }), _jsxs("small", { children: ["Doc Officer: ", request.created_by] })] }), _jsx("span", { children: request.linehaul_trip_no || 'Trip pending' }), _jsx("span", { children: request.cluster })] }, request.id) }) })] }), _jsxs("article", { className: "panel dashboard-list-panel", children: [_jsxs("div", { className: "panel-head", children: [_jsxs("div", { children: [_jsx("p", { className: "panel-kicker", children: "Docking queue" }), _jsx("h2", { children: "Trucks awaiting docking" }), _jsx("p", { children: "Assigned trucks ready for dock confirmation" })] }), _jsx("button", { className: "text-button", type: "button", onClick: () => onNavigate('docking'), children: "View All" })] }), _jsx("div", { className: "panel-body", children: _jsx(QueuePreview, { items: assignedTrucks, className: "truck-list", emptyMessage: "No assigned trucks are ready for docking.", renderItem: request => _jsxs("div", { className: "truck-row", children: [_jsx("span", { className: "truck-dot", children: _jsx(Truck, { size: 15 }) }), _jsxs("div", { children: [_jsx("strong", { children: request.cluster }), _jsx("small", { children: request.status.replaceAll('_', ' ') })] }), _jsx("span", { children: request.plate_number }), _jsx("span", { children: request.truck_size })] }, request.id) }) })] })] }), detailStatus !== null && _jsx("div", { className: "dialog-layer", role: "presentation", onMouseDown: event => event.target === event.currentTarget && setDetailStatus(null), children: _jsxs("section", { className: "form-dialog request-detail-dialog", role: "dialog", "aria-modal": "true", "aria-label": "Request details", children: [_jsxs("div", { className: "dialog-head", children: [_jsxs("div", { children: [_jsx("h2", { children: cards.find(card => card.status === detailStatus)?.label }), _jsxs("p", { children: [from, " to ", to, " - ", details.data?.total ?? 0, " requests"] })] }), _jsx("button", { className: "icon-button", "aria-label": "Close", onClick: () => setDetailStatus(null), children: _jsx(X, { size: 18 }) })] }), details.isPending ? _jsxs("div", { className: "table-loading-shell", children: [_jsxs("div", { className: "table-loading-toolbar", children: [_jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" }), _jsx("span", { className: "skeleton-chip" })] }), _jsx(SkeletonTable, { columns: 14, rows: 4, compact: true })] }) : _jsx(RequestTable, { rows: details.data?.data ?? [] })] }) })] });
}
