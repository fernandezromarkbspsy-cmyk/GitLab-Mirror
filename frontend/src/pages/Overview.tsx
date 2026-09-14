import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  Truck,
  X,
} from "lucide-react";
import { RequestTable } from "../components/RequestTable";
import { SkeletonTable } from "../components/SkeletonTable";
import { ChartHeader } from "../components/dashboard/ChartHeader";
import { MetricCard } from "../components/dashboard/MetricCard";
import { Panel } from "../components/dashboard/Panel";
import { QueuePreview } from "../components/dashboard/QueuePreview";
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
const CHART_RANGES = ["1D", "1W", "1M"] as const;
type ChartRange = (typeof CHART_RANGES)[number];

function getOperationalDate(now = new Date()) {
  const operationalDate = new Date(now);
  if (operationalDate.getHours() < 6)
    operationalDate.setDate(operationalDate.getDate() - 1);

  const year = operationalDate.getFullYear();
  const month = String(operationalDate.getMonth() + 1).padStart(2, "0");
  const day = String(operationalDate.getDate()).padStart(2, "0");
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
  const intradayDate =
    from === to && /^\d{4}-\d{2}-\d{2}$/.test(from)
      ? from
      : getOperationalDate();
  const [detailStatus, setDetailStatus] = useState<Status | "ALL" | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("1D");
  const range = `date_from=${from}&date_to=${to}`;
  const requests = useQuery({
    queryKey: ["requests", "dashboard"],
    queryFn: () =>
      api<Page<TruckRequest>>(
        "/requests?per_page=100&sort=created_at&direction=desc",
      ),
    placeholderData: (previous) => previous,
    refetchInterval: 15_000,
    enabled: !preview,
  });
  const metrics = useQuery({
    queryKey: ["request-metrics", from, to],
    queryFn: () => api<RequestMetrics>(`/requests/metrics?${range}`),
    refetchInterval: 15_000,
    enabled: !preview,
  });
  const analytics = useQuery({
    queryKey: ["request-analytics", from, to],
    queryFn: () => api<RequestAnalytics>(`/requests/analytics?${range}`),
    refetchInterval: 15_000,
    enabled: !preview,
  });
  const intraday = useQuery({
    queryKey: ["intraday-dispatch", intradayDate],
    queryFn: () =>
      api<{ data: Array<{ hour: number; orderQty: number }> }>(
        `/dispatch/intraday?date=${intradayDate}`,
      ),
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled: !preview,
  });
  const details = useQuery({
    queryKey: ["request-details", detailStatus, from, to],
    queryFn: () =>
      api<Page<TruckRequest>>(
        `/requests?per_page=100&${range}${detailStatus !== "ALL" ? `&status=${detailStatus}` : ""}`,
      ),
    enabled: detailStatus !== null,
  });
  const dispatchPoints =
    intraday.data?.data ??
    INTRADAY_HOURS.map((hour) => ({ hour, orderQty: 0 }));
  const maxDispatch = Math.max(
    1,
    ...dispatchPoints.map((point) => point.orderQty),
  );
  const peakDispatch = dispatchPoints.reduce(
    (best, point) => (point.orderQty > best.orderQty ? point : best),
    { hour: 0, orderQty: 0 },
  );
  const chartPoints = dispatchPoints.map((point, index) => ({
    label: String(point.hour),
    count: point.orderQty,
    x:
      46 +
      index *
        (dispatchPoints.length > 1 ? 608 / (dispatchPoints.length - 1) : 0),
    y: 150 - (point.orderQty / maxDispatch) * 104,
  }));
  const linePath = smoothPath(chartPoints);
  const areaPath = chartPoints.length
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} 160 L ${chartPoints[0].x} 160 Z`
    : "";
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
        (request.status === "FOR_DOCKING" || request.status === "ASSIGNED") &&
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
  const forDockingRequests = metrics.data?.by_status.FOR_DOCKING ?? 0;
  const dockedRequests = metrics.data?.by_status.DOCKED ?? 0;
  const completionRate = totalRequests
    ? Math.round((dockedRequests / totalRequests) * 100)
    : 0;
  const activeSignal = dispatchPoints.reduce(
    (sum, point) => sum + point.orderQty,
    0,
  );
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
      footnote: `${activeSignal} hourly events`,
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
      status: "FOR_DOCKING",
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
      : "Live dispatch data. Updates every 15 seconds.";
  const formatHour = (hour: number) =>
    `${hour % 12 || 12} ${hour >= 12 ? "PM" : "AM"}`;

  return (
    <div className="workspace-view dashboard-view dashboard-overview">
      {(requests.error ||
        metrics.error ||
        analytics.error ||
        intraday.error) && (
        <p className="error notice" role="alert">
          Some dashboard data could not be loaded. Check the affected panel for
          details.
        </p>
      )}
      <section className="scorecards-layout" aria-label="Dashboard metrics">
        <section className="overview-metrics" aria-label="Request metrics">
          {cards.map((card) => (
            <MetricCard
              key={card.status}
              label={card.label}
              value={metrics.isPending ? "-" : card.value.toLocaleString()}
              icon={card.icon}
              chip={card.chip}
              footnote={metrics.isPending ? "-" : card.footnote}
              primary={card.primary}
              onClick={() => setDetailStatus(card.status)}
            />
          ))}
        </section>
        <section className="intraday-shell" aria-label="Intraday dispatch card">
          <article className="intraday-card">
            <ChartHeader
              kicker="Intraday Card"
              title="Hourly dispatch volume"
              description={`Live operational feed · ${intradayDate}`}
              controls={
                <fieldset
                  className="intraday-filters"
                  aria-label="Chart time ranges"
                >
                  {CHART_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      disabled={range !== "1D"}
                      aria-pressed={chartRange === range}
                      title={
                        range === "1D"
                          ? "Intraday view"
                          : "This feed currently supports intraday data only"
                      }
                      onClick={() => setChartRange(range)}
                    >
                      {range}
                    </button>
                  ))}
                </fieldset>
              }
            />
            <div className="intraday-summary">
              <div>
                <span>Total dispatched</span>
                <strong>
                  {intraday.isPending ? "-" : activeSignal.toLocaleString()}
                </strong>
              </div>
              <div>
                <span>Peak hour</span>
                <strong>
                  {peakDispatch.orderQty.toLocaleString()}{" "}
                  <small>{formatHour(peakDispatch.hour)}</small>
                </strong>
              </div>
              <span
                className={`intraday-live-status${intraday.error ? " is-error" : ""}`}
              >
                <i />
                {intradayStatus}
              </span>
            </div>
            <div className="line-chart top-dispatch-line-chart">
              <svg
                viewBox="0 0 700 190"
                role="img"
                aria-label="Intraday dispatch order quantity by hour"
              >
                <defs>
                  <linearGradient id="lineAreaTop" x1="0" x2="0" y1="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--dispatch-accent)"
                      stopOpacity=".20"
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--dispatch-accent)"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <line
                  className="chart-grid-line"
                  x1="46"
                  y1="160"
                  x2="654"
                  y2="160"
                />
                <line
                  className="chart-grid-line"
                  x1="46"
                  y1="112"
                  x2="654"
                  y2="112"
                />
                <line
                  className="chart-grid-line"
                  x1="46"
                  y1="64"
                  x2="654"
                  y2="64"
                />
                <text className="chart-y-label" x="38" y="163">
                  0
                </text>
                <text className="chart-y-label" x="38" y="115">
                  {Math.round(maxDispatch / 2).toLocaleString()}
                </text>
                <text className="chart-y-label" x="38" y="67">
                  {maxDispatch.toLocaleString()}
                </text>
                {areaPath && <path className="line-area" d={areaPath} />}
                <path className="line-stroke" d={linePath} />
                {chartPoints.map((point, index) => (
                  <g
                    key={point.label}
                  >
                    <circle cx={point.x} cy={point.y} r="4">
                      <title>
                        {formatHour(Number(point.label))}: {point.count} orders
                      </title>
                    </circle>
                    <text x={point.x} y="178">
                      {formatHour(Number(point.label))}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </article>
        </section>
      </section>
      <section className="dashboard-grid">
        <Panel
          className="chart-panel truck-mix-panel"
          kicker="Distribution"
          title="Truck mix"
          description="Selected date range"
        >
          <div className="donut-layout">
            <div
              className="donut"
              style={{
                background: sizeTotal
                  ? `conic-gradient(${gradients})`
                  : "var(--color-bg-base)",
              }}
            >
              <span>
                <strong>{sizeTotal}</strong>
                <small>Total</small>
              </span>
            </div>
            <section className="donut-legend" aria-label="Truck size breakdown">
              {sizes.map((size, index) => {
                const count = analytics.data?.truck_sizes[size] ?? 0;
                return (
                  <div key={size}>
                    <i style={{ background: `#${palette[index]}` }} />
                    <span>{size}</span>
                    <strong>
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
        <article className="panel dashboard-list-panel dashboard-list-panel--trips">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Linehaul activity</p>
              <h2>Recent linehaul trips</h2>
              <p>Latest trips with driver assignments</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate("docking")}
            >
              View All
            </button>
          </div>
          <div className="panel-body">
            <QueuePreview
              items={linehaulTrips}
              emptyMessage="No linehaul trips have been created yet."
              renderItem={(request) => (
                <div className="linehaul-row" key={request.id}>
                  <span className="avatar">
                    {(request.driver_id || request.created_by)
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>
                  <div>
                    <strong>{request.driver_id || "Driver pending"}</strong>
                    <small>Doc Officer: {request.created_by}</small>
                  </div>
                  <span>{request.linehaul_trip_no || "Trip pending"}</span>
                  <span>{request.cluster}</span>
                </div>
              )}
            />
          </div>
        </article>
        <article className="panel dashboard-list-panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Docking queue</p>
              <h2>Trucks awaiting docking</h2>
              <p>Assigned trucks ready for dock confirmation</p>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate("docking")}
            >
              View All
            </button>
          </div>
          <div className="panel-body">
            <QueuePreview
              items={assignedTrucks}
              className="truck-list"
              emptyMessage="No assigned trucks are ready for docking."
              renderItem={(request) => (
                <div className="truck-row" key={request.id}>
                  <span className="truck-dot">
                    <Truck size={15} />
                  </span>
                  <div>
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
      {detailStatus !== null && (
        <div
          className="dialog-layer"
          role="presentation"
        >
          <section
            className="form-dialog request-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Request details"
          >
            <div className="dialog-head">
              <div>
                <h2>
                  {cards.find((card) => card.status === detailStatus)?.label}
                </h2>
                <p>
                  {from} to {to} - {details.data?.total ?? 0} requests
                </p>
              </div>
              <button
                className="icon-button"
                type="button"
                aria-label="Close"
                onClick={() => setDetailStatus(null)}
              >
                <X size={18} />
              </button>
            </div>
            {details.isPending ? (
              <div className="table-loading-shell">
                <div className="table-loading-toolbar">
                  <span className="skeleton-chip" />
                  <span className="skeleton-chip" />
                  <span className="skeleton-chip" />
                </div>
                <SkeletonTable columns={14} rows={4} compact />
              </div>
            ) : (
              <RequestTable rows={details.data?.data ?? []} />
            )}
          </section>
        </div>
      )}
    </div>
  );
}
