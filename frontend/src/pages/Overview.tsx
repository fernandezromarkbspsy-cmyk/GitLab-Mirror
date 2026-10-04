import { useQuery } from "@tanstack/react-query";
import {
  avatarClass,
  chartGridLineClass,
  chartHoverStateClass,
  chartPointGroupClass,
  chartXLabelClass,
  chartYLabelClass,
  dashboardGridClass,
  dashboardPanelBodyClass,
  dashboardPanelHeadClass,
  dashboardPanelKickerClass,
  dashboardTripsPanelClass,
  dashboardViewClass,
  donutCenterClass,
  donutCenterLabelClass,
  donutCenterValueClass,
  donutClass,
  donutLayoutClass,
  donutLegendClass,
  donutLegendItemClass,
  donutLegendSwatchClass,
  donutLegendTextClass,
  donutLegendValueClass,
  dialogHeadClass,
  iconButtonClass,
  intradayCardClass,
  intradayDateIconClass,
  intradayFiltersClass,
  intradayKpiAccentClass,
  intradayKpiClass,
  intradayKpiLabelClass,
  intradayKpiSuffixClass,
  intradayKpiValueClass,
  intradayLiveDotClass,
  intradayLiveLabelClass,
  intradayLiveStatusClass,
  intradayMetaDotClass,
  intradayShellClass,
  loadingChipClass,
  loadingShellClass,
  loadingToolbarClass,
  overviewMetricsClass,
  scorecardsLayoutClass,
  lineChartClass,
  lineChartSvgClass,
  lineAreaClass,
  lineStrokeClass,
  linehaulRowClass,
  queueRowGroupClass,
  requestDetailContentClass,
  requestDetailCopyClass,
  requestDetailDialogClass,
  requestDetailTitleClass,
  textButtonClass,
  truckDotClass,
  tripsPanelBodyClass,
} from "../lib/uiClasses";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Truck,
  X,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ChartHeader } from "../components/dashboard/ChartHeader";
import { MetricCard } from "../components/dashboard/MetricCard";
import { Panel } from "../components/dashboard/Panel";
import { QueuePreview } from "../components/dashboard/QueuePreview";
import { Modal } from "../components/Modal";
import { RequestTable } from "../components/RequestTable";
import { Skeleton } from "../components/Skeleton";
import { SkeletonTable } from "../components/SkeletonTable";
import { api } from "../lib/api";
import { useUiStore } from "../stores/ui";
import type {
  AppView,
  Page,
  RequestAnalytics,
  RequestMetrics,
  Status,
  TruckRequest,
  User,
} from "../types";

const INTRADAY_HOURS = [
  6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2,
  3, 4, 5,
] as const;
type IntradayChartPoint = {
  label: string;
  hour: number;
  count: number;
  x: number;
  y: number;
};

function getTodayDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  return points.reduce((path, point, index, all) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = all[index - 1];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

export function Overview({
  onNavigate,
  preview = false,
}: {
  user: User;
  onNavigate: (view: AppView) => void;
  preview?: boolean;
}) {
  const from = useUiStore((state) => state.dateFrom);
  const to = useUiStore((state) => state.dateTo);
  const [detailStatus, setDetailStatus] = useState<Status | "ALL" | null>(null);
  const [intradayDate, setIntradayDate] = useState(() => getTodayDate());
  const [activeIntradayPoint, setActiveIntradayPoint] =
    useState<IntradayChartPoint | null>(null);
  const [refreshPulse, setRefreshPulse] = useState(false);
  const range = `date_from=${from}&date_to=${to}`;
  const requests = useQuery({
    queryKey: ["requests", "dashboard"],
    queryFn: () =>
      api<Page<TruckRequest>>(
        "/requests?per_page=100&sort=created_at&direction=desc",
      ),
    placeholderData: (previous) => previous,
    refetchInterval: false,
    enabled: !preview,
  });
  const metrics = useQuery({
    queryKey: ["request-metrics", from, to],
    queryFn: () => api<RequestMetrics>(`/requests/metrics?${range}`),
    refetchInterval: false,
    enabled: !preview,
  });
  const analytics = useQuery({
    queryKey: ["request-analytics", from, to],
    queryFn: () => api<RequestAnalytics>(`/requests/analytics?${range}`),
    refetchInterval: false,
    enabled: !preview,
  });
  const intraday = useQuery({
    queryKey: ["intraday-dispatch", intradayDate],
    queryFn: () =>
      api<{ data: Array<{ hour: number; orderQty: number }> }>(
        `/dispatch/intraday?date=${intradayDate}`,
      ),
    refetchInterval: false,
    staleTime: 10_000,
    enabled: !preview,
  });
  useEffect(() => {
    if (!intraday.dataUpdatedAt) return;
    setRefreshPulse(true);
    const timeout = window.setTimeout(() => setRefreshPulse(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [intraday.dataUpdatedAt]);
  const details = useQuery({
    queryKey: ["request-details", detailStatus, from, to],
    queryFn: () =>
      api<Page<TruckRequest>>(
        `/requests?per_page=100&${range}${detailStatus !== "ALL" ? `&status=${detailStatus}` : ""}`,
      ),
    enabled: detailStatus !== null,
  });
  const dispatchChart = useMemo(() => {
    const points =
      intraday.data?.data ??
      INTRADAY_HOURS.map((hour) => ({ hour, orderQty: 0 }));
    const maximum = Math.max(1, ...points.map((point) => point.orderQty));
    const peak = points.reduce(
      (best, point) => (point.orderQty > best.orderQty ? point : best),
      { hour: 0, orderQty: 0 },
    );
    const total = points.reduce((sum, point) => sum + point.orderQty, 0);
    const chartPoints: IntradayChartPoint[] = points.map((point, index) => ({
      label: String(point.hour),
      hour: point.hour,
      count: point.orderQty,
      x: 46 + index * (points.length > 1 ? 608 / (points.length - 1) : 0),
      y: 150 - (point.orderQty / maximum) * 104,
    }));
    const line = smoothPath(chartPoints);

    return {
      maximum,
      peak,
      chartPoints,
      line,
      area: chartPoints.length
        ? `${line} L ${chartPoints[chartPoints.length - 1].x} 160 L ${chartPoints[0].x} 160 Z`
        : "",
      total,
    };
  }, [intraday.data?.data]);
  const sizes = ["4W", "6W", "10W", "6WF"] as const;
  const sizeTotal = sizes.reduce(
    (sum, size) => sum + (analytics.data?.truck_sizes[size] ?? 0),
    0,
  );
  const rows = requests.data?.data ?? [];
  const linehaulTrips = rows
    .filter((request) => request.linehaul_trip_no || request.driver_id)
    .slice(0, 4);
  const assignedTrucks = rows
    .filter(
      (request) =>
        (request.status === "DOCKING" || request.status === "ASSIGNED") &&
        request.plate_number,
    )
    .slice(0, 4);
  const palette = ["2f6f6a", "3f8f89", "77b7af", "dbece8"];
  const gradients = useMemo(() => {
    let offset = 0;
    return sizes
      .map((size, index) => {
        const value = analytics.data?.truck_sizes[size] ?? 0;
        const start = offset;
        offset += sizeTotal ? (value / sizeTotal) * 100 : 0;
        return `#${palette[index]} ${start}% ${offset}%`;
      })
      .join(",");
  }, [analytics.data, sizeTotal]);
  const totalRequests = metrics.data?.total ?? 0;
  const pendingRequests = metrics.data?.by_status.PENDING ?? 0;
  const forDockingRequests = metrics.data?.by_status.DOCKING ?? 0;
  const dockedRequests = metrics.data?.by_status.DOCKED ?? 0;
  const completionRate = totalRequests
    ? Math.round((dockedRequests / totalRequests) * 100)
    : 0;
  const cards: Array<{
    label: string;
    status: Status | "ALL";
    value: number;
    icon: ReactNode;
    chip: string;
    footnote: string;
    primary?: boolean;
  }> = [
    {
      label: "Total Requests",
      status: "ALL",
      value: totalRequests,
      icon: <ClipboardList size={22} aria-hidden="true" />,
      chip: "Overall volume",
      footnote: `Intraday chart: ${dispatchChart.total.toLocaleString()} dispatches on ${intradayDate}`,
    },
    {
      label: "Pending Requests",
      status: "PENDING",
      value: pendingRequests,
      icon: <Clock3 size={22} aria-hidden="true" />,
      chip: "Needs action",
      footnote: `${totalRequests ? Math.round((pendingRequests / totalRequests) * 100) : 0}% of all requests`,
      primary: true,
    },
    {
      label: "Awaiting Docking",
      status: "DOCKING",
      value: forDockingRequests,
      icon: <Truck size={22} aria-hidden="true" />,
      chip: "Dock queue",
      footnote: "Waiting for dock confirmation",
    },
    {
      label: "Completed",
      status: "DOCKED",
      value: dockedRequests,
      icon: <CheckCircle2 size={22} aria-hidden="true" />,
      chip: "Completed",
      footnote: `${completionRate}% completion rate`,
    },
  ];
  const intradayStatus = intraday.isPending
    ? "Loading live dispatch data."
    : intraday.error
      ? "Dispatch feed unavailable."
      : "Live dispatch data via realtime.";
  const formatHour = useCallback(
    (hour: number) => `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`,
    [],
  );

  return (
    <div className={`${dashboardViewClass} dashboard-overview`}>
      {(requests.error ||
        metrics.error ||
        analytics.error ||
        intraday.error) && (
        <p className="error notice text-[var(--color-danger)]" role="alert">
          Some dashboard data could not be loaded. Check the affected panel for
          details.
        </p>
      )}
      <section className={scorecardsLayoutClass} aria-label="Dashboard metrics">
        <section className={overviewMetricsClass} aria-label="Request metrics">
          {cards.map((card) => (
            <MetricCard
              key={card.status}
              label={card.label}
              value={
                metrics.isPending ? (
                  <Skeleton width={64} height={26} />
                ) : (
                  card.value.toLocaleString()
                )
              }
              icon={card.icon}
              chip={card.chip}
              footnote={
                metrics.isPending ? <Skeleton width={112} /> : card.footnote
              }
              primary={card.primary}
              onClick={() => setDetailStatus(card.status)}
            />
          ))}
        </section>
        <section className={intradayShellClass} aria-label="Intraday dispatch card">
          <article className={intradayCardClass}>
            <ChartHeader
              title="Hourly Throughput"
              description={
                <>
                  <span className={intradayMetaDotClass} aria-hidden="true" />
                  <span>Live operational feed</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={intradayDate}>{intradayDate}</time>
                </>
              }
              controls={
                <IntradayDateSelector
                  value={intradayDate}
                  onChange={setIntradayDate}
                />
              }
            />
            <div className="grid grid-cols-[minmax(7.5rem,max-content)_minmax(7.5rem,max-content)_minmax(10.5rem,1fr)] items-center gap-[clamp(.7rem,2vw,1.1rem)] max-[820px]:grid-cols-3 max-[600px]:grid-cols-1 max-[600px]:gap-[.7rem]">
              <IntradayKpi
                label="Total dispatched"
                loading={intraday.isPending}
                value={dispatchChart.total.toLocaleString()}
              />
              <IntradayKpi
                label="Peak hour"
                loading={intraday.isPending}
                value={dispatchChart.peak.orderQty.toLocaleString()}
                suffix={formatHour(dispatchChart.peak.hour)}
                accent
              />
              <IntradayLiveStatus
                error={Boolean(intraday.error)}
                refreshing={intraday.isFetching && !intraday.isPending}
                refreshed={refreshPulse}
                text={intradayStatus}
              />
            </div>
            <IntradayLineChart
              activePoint={activeIntradayPoint}
              area={dispatchChart.area}
              formatHour={formatHour}
              line={dispatchChart.line}
              maximum={dispatchChart.maximum}
              points={dispatchChart.chartPoints}
              onActivePointChange={setActiveIntradayPoint}
            />
          </article>
        </section>
      </section>
      <section className={dashboardGridClass}>
        <Panel
          className="chart-panel truck-mix-panel"
          kicker="Distribution"
          title="Truck mix"
          description="Selected date range"
        >
          <div className={donutLayoutClass}>
            <div
              className={donutClass}
              style={{
                background: sizeTotal
                  ? `conic-gradient(${gradients})`
                  : "var(--color-bg-base)",
              }}
            >
              <span className={donutCenterClass}>
                <strong className={donutCenterValueClass}>{sizeTotal}</strong>
                <small className={donutCenterLabelClass}>Total</small>
              </span>
            </div>
            <section className={donutLegendClass} aria-label="Truck size breakdown">
              {sizes.map((size, index) => {
                const count = analytics.data?.truck_sizes[size] ?? 0;
                return (
                  <div className={donutLegendItemClass} key={size}>
                    <i className={donutLegendSwatchClass} style={{ background: `#${palette[index]}` }} />
                    <span className={donutLegendTextClass}>{size}</span>
                    <strong className={donutLegendValueClass}>
                      {count}{" "}
                      <small>
                        ({sizeTotal ? Math.round((count / sizeTotal) * 100) : 0}
                        %)
                      </small>
                    </strong>
                  </div>
                );
              })}
            </section>
          </div>
        </Panel>
        <article className={`min-w-0 overflow-hidden rounded-card border border-card-line bg-card-surface shadow-card ${dashboardTripsPanelClass}`}>
          <div className={`${dashboardPanelHeadClass} border-b border-[#087f7c]/[.24] pb-[.65rem]`}>
            <div>
              <p className={dashboardPanelKickerClass}>Live dispatch board</p>
              <h2 className="m-0 text-sm font-semibold text-card-heading">Recent linehaul trips</h2>
              <p className="mt-1 mb-0 text-xs leading-normal text-soc5-muted">Latest trips with driver assignments</p>
            </div>
            <span className="trips-live-status">
              <i aria-hidden="true" /> Live
            </span>
            <button
              className={textButtonClass}
              type="button"
              onClick={() => onNavigate("docking")}
            >
              View All
            </button>
          </div>
          <div className={tripsPanelBodyClass}>
            <QueuePreview
              items={linehaulTrips}
              emptyMessage="No linehaul trips have been created yet."
              renderItem={(request) => (
                <div className={linehaulRowClass} key={request.id}>
                  <span className={avatarClass}>
                    {(request.driver_id || request.created_by)
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <div className={queueRowGroupClass}>
                    <strong>
                      {request.linehaul_trip_no || "Trip pending"}
                    </strong>
                    <small>Doc Officer: {request.created_by}</small>
                  </div>
                  <span className={`${queueRowGroupClass} min-w-0`}>
                    <b>{request.driver_id || "Driver pending"}</b>
                    <small>Assigned driver</small>
                  </span>
                  <span className={`${queueRowGroupClass} justify-items-end text-right`}>
                    <b>{request.cluster}</b>
                    <small>Cluster</small>
                  </span>
                </div>
              )}
            />
          </div>
        </article>
        <article className="min-w-0 min-h-[15.5rem] overflow-hidden rounded-card border border-card-line bg-card-surface shadow-card">
          <div className={dashboardPanelHeadClass}>
            <div>
              <p className={dashboardPanelKickerClass}>Docking queue</p>
              <h2 className="m-0 text-sm font-semibold text-card-heading">Trucks awaiting docking</h2>
              <p className="mt-1 mb-0 text-xs leading-normal text-soc5-muted">Assigned trucks ready for dock confirmation</p>
            </div>
            <button
              className={textButtonClass}
              type="button"
              onClick={() => onNavigate("docking")}
            >
              View All
            </button>
          </div>
          <div className={`${dashboardPanelBodyClass} bg-[linear-gradient(135deg,#fbfdec,#f5f9e5)]`}>
            <QueuePreview
              items={assignedTrucks}
              className="truck-list"
              emptyMessage="No assigned trucks are ready for docking."
              renderItem={(request) => (
                <div className={`${linehaulRowClass} border-[#dce7b5] bg-white shadow-[0_.25rem_.7rem_rgb(83_104_13_/_8%)]`} key={request.id}>
                  <span className={truckDotClass}>
                    <Truck size={15} />
                  </span>
                  <div className={queueRowGroupClass}>
                    <strong>{request.cluster}</strong>
                    <small>{request.status.replaceAll("_", " ")}</small>
                  </div>
                  <span>{request.plate_number}</span>
                  <span>{request.truck_size}</span>
                </div>
              )}
            />
          </div>
        </article>
      </section>
      <Modal
        open={detailStatus !== null}
        onClose={() => setDetailStatus(null)}
        className={requestDetailDialogClass}
        ariaLabelledBy="request-details-title"
      >
        <div className={dialogHeadClass}>
          <div>
            <h2 className={requestDetailTitleClass} id="request-details-title">
              {cards.find((card) => card.status === detailStatus)?.label}
            </h2>
            <p className={requestDetailCopyClass}>
              {from} to {to} - {details.data?.total ?? 0} requests
            </p>
          </div>
          <button
            className={iconButtonClass}
            type="button"
            aria-label="Close"
            onClick={() => setDetailStatus(null)}
          >
            <X size={18} />
          </button>
        </div>
        {details.isPending ? (
          <div className={loadingShellClass}>
            <div className={loadingToolbarClass}>
              <span className={loadingChipClass} />
              <span className={loadingChipClass} />
              <span className={loadingChipClass} />
            </div>
            <SkeletonTable columns={14} rows={4} compact />
          </div>
        ) : (
          <RequestTable
            rows={details.data?.data ?? []}
            tableWrapperClassName={requestDetailContentClass}
            emptyStateClassName={requestDetailContentClass}
          />
        )}
      </Modal>
    </div>
  );
}

function IntradayDateSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className={intradayFiltersClass} aria-label="Intraday dispatch date">
      <label className="sr-only" htmlFor="intraday-date-filter">
        Intraday dispatch date
      </label>
      <span className={intradayDateIconClass} aria-hidden="true">
        <CalendarDays size={16} strokeWidth={2.1} />
      </span>
      <input
        id="intraday-date-filter"
        className={"min-w-0 flex-1 rounded-[.5rem] border border-transparent bg-transparent px-1 text-xs font-bold text-[#162538] outline-none focus:border-[#9bd7cf] focus:bg-white focus:ring-[.2rem] focus:ring-[rgb(20_184_166_/_14%)] max-[600px]:w-full"}
        type="date"
        value={value}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value);
        }}
      />
    </fieldset>
  );
}

function IntradayKpi({
  label,
  loading,
  value,
  suffix,
  accent = false,
}: {
  label: string;
  loading: boolean;
  value: string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className={intradayKpiClass}>
      <span className={intradayKpiLabelClass}>{label}</span>
      <strong className={`${intradayKpiValueClass}${accent ? ` ${intradayKpiAccentClass}` : ""}`}>
        {loading ? (
          <Skeleton width={118} height={36} />
        ) : (
          <>
            {value}
            {suffix ? <small className={intradayKpiSuffixClass}>{suffix}</small> : null}
          </>
        )}
      </strong>
    </div>
  );
}

function IntradayLiveStatus({
  error,
  refreshing,
  refreshed,
  text,
}: {
  error: boolean;
  refreshing: boolean;
  refreshed: boolean;
  text: string;
}) {
  return (
    <span
      className={`${intradayLiveStatusClass}${error ? " text-[#a8523d]" : ""}`}
      aria-live="polite"
    >
      <i className={intradayLiveDotClass} aria-hidden="true" />
      <span>{text}</span>
      <b className={intradayLiveLabelClass}>{refreshing ? "Refreshing" : refreshed ? "Updated" : "Live"}</b>
    </span>
  );
}

function IntradayLineChart({
  activePoint,
  area,
  formatHour,
  line,
  maximum,
  points,
  onActivePointChange,
}: {
  activePoint: IntradayChartPoint | null;
  area: string;
  formatHour: (hour: number) => string;
  line: string;
  maximum: number;
  points: IntradayChartPoint[];
  onActivePointChange: (point: IntradayChartPoint | null) => void;
}) {
  const tooltipX = activePoint
    ? activePoint.x > 540
      ? activePoint.x - 130
      : activePoint.x + 14
    : 0;
  const tooltipY = activePoint ? Math.max(18, activePoint.y - 58) : 0;

  return (
    <div className={lineChartClass}>
      <svg
        className={lineChartSvgClass}
        viewBox="0 0 700 200"
        role="img"
        aria-label="Intraday dispatch volume over a 24-hour period"
      >
        <desc>
          Line chart showing dispatch order volume from 6 AM through 5 AM.
        </desc>
        <defs>
          <linearGradient id="lineAreaTop" x1="0" x2="0" y1="0" y2="1">
            <stop
              offset="0%"
              stopColor="#b5d93f"
              stopOpacity=".16"
            />
            <stop
              offset="100%"
              stopColor="#b5d93f"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>
        {[160, 112, 64].map((y) => (
          <line
            key={y}
            className={chartGridLineClass}
            x1="46"
            y1={y}
            x2="654"
            y2={y}
          />
        ))}
        <text className={chartYLabelClass} x="38" y="163">
          0
        </text>
        <text className={chartYLabelClass} x="38" y="115">
          {Math.round(maximum / 2).toLocaleString()}
        </text>
        <text className={chartYLabelClass} x="38" y="67">
          {maximum.toLocaleString()}
        </text>
        {area && <path className={lineAreaClass} d={area} />}
        <path className={lineStrokeClass} d={line} />
        {points.map((point, index) => {
          const active = activePoint?.hour === point.hour;
          const timeLabel = formatHour(point.hour);
          return (
            // biome-ignore lint/a11y/useSemanticElements: SVG data points need keyboard interaction but cannot be native buttons.
            <g
              key={point.label}
              role="button"
              tabIndex={0}
              aria-label={`${timeLabel}: ${point.count.toLocaleString()} dispatched orders`}
              className={chartPointGroupClass}
              data-active={active || undefined}
              onBlur={() => onActivePointChange(null)}
              onFocus={() => onActivePointChange(point)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onActivePointChange(point);
                }
              }}
              onClick={() => onActivePointChange(point)}
              onMouseEnter={() => onActivePointChange(point)}
              onMouseLeave={() => onActivePointChange(null)}
            >
              <circle cx={point.x} cy={point.y} r="4.2" />
              {index % 3 === 0 && (
                <text className={chartXLabelClass} x={point.x} y="184">
                  {timeLabel}
                </text>
              )}
            </g>
          );
        })}
        {activePoint ? (
          <g className={chartHoverStateClass}>
            <line x1={activePoint.x} y1="44" x2={activePoint.x} y2="160" />
            <circle cx={activePoint.x} cy={activePoint.y} r="5.2" />
            <rect x={tooltipX} y={tooltipY} width="118" height="44" rx="10" />
            <text x={tooltipX + 12} y={tooltipY + 18}>
              {formatHour(activePoint.hour)}
            </text>
            <text x={tooltipX + 12} y={tooltipY + 34}>
              {activePoint.count.toLocaleString()} orders
            </text>
          </g>
        ) : null}
      </svg>
    </div>
  );
}
