import { FormEvent, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import {
  BadgeCheck,
  ChartNoAxesCombined,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Hash,
  ListChecks,
  MoreHorizontal,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Table2,
  Tag,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueueSnapshot } from "../hooks/useQueueNotifications";
import { api } from "../lib/api";
import { buildIdempotencyHeaders } from "../lib/idempotency";
import { defaultRequestFilters, openRequestsSheet } from "../lib/requests";
import type {
  ClusterLookup,
  Page,
  RequestFilters,
  RequestSort,
  TruckRequest,
  User,
} from "../types";
import { useUiStore } from "../stores/ui";
import { LinehaulFilterPanel } from "../components/LinehaulFilterPanel";
import { LinehaulRequestDetailsPanel } from "../components/LinehaulRequestDetailsPanel";
import { SkeletonCardList, SkeletonRequestTable } from "../components/Skeleton";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
}
function statusLabel(status: TruckRequest["status"]) {
  return status.replaceAll("_", " ");
}

type RequestPayload = {
  cluster: FormDataEntryValue | null;
  region: FormDataEntryValue | null;
  dock_no: FormDataEntryValue | null;
  backlogs: number;
  backlogs_timestamp?: FormDataEntryValue | null;
  truck_size: FormDataEntryValue | null;
  truck_type: "WETLEASE";
};

export function OutboundRequests({
  user,
  queue: _queue,
}: {
  user: User;
  queue: QueueSnapshot;
}) {
  const queryClient = useQueryClient();
  const globalSearch = useUiStore((state) => state.search);
  const setGlobalSearch = useUiStore((state) => state.setSearch);
  const [view, setView] = useState<"table" | "card">("table");
  const [filters, setFilters] = useState<RequestFilters>(() => ({
    ...defaultRequestFilters,
    search: globalSearch,
  }));
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TruckRequest | null>(null);
  const [panelPosition, setPanelPosition] = useState({ x: 24, y: 112 });
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TruckRequest | null>(null);
  const [toast, setToast] = useState("");
  const requests = useQuery({
    queryKey: ["requests", "outbound-all", filters],
    queryFn: () =>
      api<Page<TruckRequest>>(
        `/requests?${new URLSearchParams({
          page: String(filters.page),
          per_page: String(filters.perPage),
          sort: filters.sort,
          direction: filters.direction,
          ...(filters.status !== "ALL" ? { status: filters.status } : {}),
          ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
          ...(filters.dateFrom ? { date_from: filters.dateFrom } : {}),
          ...(filters.dateTo ? { date_to: filters.dateTo } : {}),
        }).toString()}`,
      ),
    placeholderData: (previous) => previous,
  });
  const rows = useMemo(() => requests.data?.data ?? [], [requests.data]);
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  async function refreshData(message: string) {
    showToast(message);
    await queryClient.invalidateQueries({ queryKey: ["requests"] });
  }
  const createRequest = useMutation({
    mutationFn: (payload: RequestPayload) =>
      api<TruckRequest>("/requests", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: buildIdempotencyHeaders("outbound-create", payload),
      }),
    onSuccess: async () => {
      setCreating(false);
      await refreshData("LH request created.");
    },
  });
  const updateRequest = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RequestPayload }) =>
      api<TruckRequest>(`/requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: buildIdempotencyHeaders("outbound-update", { id, payload }),
      }),
    onSuccess: async () => {
      setEditing(null);
      await refreshData("LH request updated.");
    },
  });
  function updateSearch(value: string) {
    setFilters((current) => ({ ...current, search: value, page: 1 }));
    setGlobalSearch(value);
  }
  function sortBy(sort: RequestSort) {
    setFilters((current) => ({
      ...current,
      sort,
      direction:
        current.sort === sort && current.direction === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }
  function selectRow(row: TruckRequest, event: MouseEvent<HTMLElement>) {
    const workspace = event.currentTarget.closest<HTMLElement>(
      ".lh-request-workspace",
    );
    const bounds = workspace?.getBoundingClientRect();
    const scale = window.matchMedia("(min-width: 821px)").matches ? 0.75 : 1;
    if (bounds)
      setPanelPosition({
        x: Math.max(
          8,
          Math.min(
            (event.clientX - bounds.left + 12) / scale,
            bounds.width / scale - 328,
          ),
        ),
        y: Math.max(
          8,
          Math.min(
            (event.clientY - bounds.top + 12) / scale,
            bounds.height / scale - 360,
          ),
        ),
      });
    setSelectedRow(row);
  }
  function exportRows() {
    openRequestsSheet();
  }

  return (
    <div
      className="workspace-view lh-request-page"
    >
      <section className="lh-request-workspace" aria-label="Linehaul requests">
        <LinehaulFilterPanel
          filters={filters}
          onChange={setFilters}
          onSort={sortBy}
          onExport={() => void exportRows()}
          onAddNew={() => {
            createRequest.reset();
            setCreating(true);
          }}
          onNotice={showToast}
        />
        {editing && (
          <div className="lh-table-create-row">
            <InlineEditRow
              request={editing}
              busy={updateRequest.isPending}
              error={updateRequest.error?.message}
              onCancel={() => {
                updateRequest.reset();
                setEditing(null);
              }}
              onSubmit={(payload) => updateRequest.mutate({ id: editing.id, payload })}
            />
          </div>
        )}
        {creating && (
          <div className="lh-table-create-row">
            <InlineCreateRow
              busy={createRequest.isPending}
              error={createRequest.error?.message}
              onCancel={() => {
                createRequest.reset();
                setCreating(false);
              }}
              onSubmit={(payload) => createRequest.mutate(payload)}
            />
          </div>
        )}
        {selectedRow && (
          <LinehaulRequestDetailsPanel
            request={selectedRow}
            position={panelPosition}
            onPositionChange={setPanelPosition}
            onClose={() => setSelectedRow(null)}
            onNotice={showToast}
          />
        )}
        <section
          className="lh-table-shell"
          aria-label="Outbound linehaul request records"
        >
          <div className="lh-table-toolbar">
            <div className="lh-view-controls">
              <button
                className="lh-toolbar-icon"
                type="button"
                aria-label="Refresh records"
                onClick={() => void requests.refetch()}
              >
                <RefreshCw size={16} />
              </button>
              <div className="lh-view-tabs">
                <button
                  type="button"
                  onClick={() => showToast("Chart view is coming soon")}
                >
                  <ChartNoAxesCombined size={15} />
                  Chart
                </button>
                <button
                  className={view === "table" ? "selected" : ""}
                  type="button"
                  onClick={() => setView("table")}
                >
                  <Table2 size={15} />
                  Table
                </button>
                <button
                  className={view === "card" ? "selected" : ""}
                  type="button"
                  onClick={() => setView("card")}
                >
                  <SlidersHorizontal size={15} />
                  Card
                </button>
              </div>
            </div>
            <label className="lh-search-box">
              <Search size={17} />
              <input
                value={filters.search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search by plate number"
              />
              <kbd>Ctrl + F</kbd>
            </label>
          </div>
          {view === "table" ? (
            <div className="lh-records-table">
              <div className="lh-table-head lh-table-grid">
                <span>
                  <CircleCheck size={14} />
                  Status
                </span>
                <button
                  type="button"
                  onClick={() => sortBy("request_timestamp")}
                >
                  <Clock3 size={14} />
                  <span>Request Time</span>
                  <SlidersHorizontal size={13} />
                </button>
                <button type="button" onClick={() => sortBy("cluster")}>
                  <Hash size={14} />
                  <span>Cluster</span>
                  <SlidersHorizontal size={13} />
                </button>
                <span>
                  <BadgeCheck size={14} />
                  Region
                </span>
                <button type="button" onClick={() => sortBy("dock_no")}>
                  <Truck size={14} />
                  <span>Dock #</span>
                  <SlidersHorizontal size={13} />
                </button>
                <button type="button" onClick={() => sortBy("backlogs")}>
                  <ListChecks size={14} />
                  <span>Backlogs</span>
                  <SlidersHorizontal size={13} />
                </button>
                <span>
                  <Truck size={14} />
                  LH Size
                </span>
                <span>
                  <Users size={14} />
                  SOC PIC
                </span>
                <span>
                  <Tag size={14} />
                  LH Trip #
                </span>
                <button type="button" onClick={() => sortBy("plate_number")}>
                  <Hash size={14} />
                  <span>Plate #</span>
                  <SlidersHorizontal size={13} />
                </button>
                <span />
              </div>
              <div className="lh-table-body">
                {requests.isPending && (
                  <SkeletonRequestTable rows={6} />
                )}
                {requests.error && (
                  <div className="lh-empty-state">{requests.error.message}</div>
                )}
                {!requests.isPending &&
                  !requests.error &&
                  rows.map((row, index) => (
                    <div
                      className="lh-table-row lh-table-grid"
                      key={row.id}
                      style={{ "--row-index": index } as React.CSSProperties}
                    >
                      <span>
                        <span
                          className={`lh-status lh-status-${row.status.toLowerCase()}`}
                        >
                          {statusLabel(row.status)}
                        </span>
                      </span>
                      <span>{formatDateTime(row.request_timestamp)}</span>
                      <span title={row.cluster}>{row.cluster}</span>
                      <span>{row.region}</span>
                      <span>{row.dock_no}</span>
                      <span>{row.backlogs.toLocaleString()}</span>
                      <span>{row.truck_size}</span>
                      <span>{displayValue(row.ob_fte)}</span>
                      <span>{displayValue(row.linehaul_trip_no)}</span>
                      <span>{displayValue(row.plate_number)}</span>
                      <span className="lh-row-menu-wrap">
                        <button
                          className="lh-row-more"
                          type="button"
                          aria-label={`Actions for request ${row.id}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setOpenRow(openRow === row.id ? null : row.id);
                          }}
                        >
                          <MoreHorizontal size={17} />
                        </button>
                        {openRow === row.id && (
                          <span className="lh-row-menu">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                selectRow(row, event);
                                setOpenRow(null);
                              }}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateRequest.reset();
                                setEditing(row);
                                setOpenRow(null);
                              }}
                            >
                              Edit
                            </button>
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                {!requests.isPending &&
                  !requests.error &&
                  rows.length === 0 && (
                    <div className="lh-empty-state">
                      No live requests match the current filters.
                    </div>
                  )}
              </div>
            </div>
          ) : (
            <div className="lh-card-view">
              {requests.isPending ? <SkeletonCardList rows={4} /> : rows.map((row) => (
                <article
                  className="lh-record-card"
                  key={row.id}
                >
                  <div>
                    <small>{row.id}</small>
                    <h3>{row.cluster}</h3>
                    <p>
                      {row.region}{" "}
                      ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·
                      Dock {row.dock_no}
                    </p>
                  </div>
                  <div className="lh-card-right">
                    <strong>{row.truck_size}</strong>
                    <span>{row.backlogs.toLocaleString()} backlogs</span>
                    <span
                      className={`lh-status lh-status-${row.status.toLowerCase()}`}
                    >
                      {statusLabel(row.status)}
                    </span>
                    <button type="button" className="text-button" onClick={(event) => selectRow(row, event)}>
                      View details
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <footer className="lh-table-footer">
            <span>
              {requests.data
                ? `Page ${requests.data.current_page} of ${requests.data.last_page}`
                : "Page 1"}
            </span>
            <div className="lh-pagination">
              <span>Show row</span>
              <select
                value={String(filters.perPage)}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    perPage: Number(event.target.value),
                    page: 1,
                  }))
                }
              >
                <option value="8">8</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
              <button
                type="button"
                disabled={!requests.data || requests.data.current_page <= 1}
                aria-label="Previous page"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))
                }
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                disabled={
                  !requests.data ||
                  requests.data.current_page >= requests.data.last_page
                }
                aria-label="Next page"
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </section>
      </section>
      {toast && (
        <div className="lh-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

function requestPayload(form: HTMLFormElement): RequestPayload {
  const data = new FormData(form);
  return {
    cluster: data.get("cluster"),
    region: data.get("region"),
    dock_no: data.get("dock_no"),
    backlogs: Number(data.get("backlogs")),
    backlogs_timestamp: data.get("backlogs_timestamp"),
    truck_size: data.get("truck_size"),
    truck_type: "WETLEASE",
  };
}

function InlineCreateRow({
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (payload: RequestPayload) => void;
}) {
  const [clusterText, setClusterText] = useState("");
  const [selected, setSelected] = useState<ClusterLookup | null>(null);
  const clusterSearch = clusterText.trim();
  const lookup = useQuery({
    queryKey: ["clusters", clusterSearch],
    queryFn: () =>
      api<{ data: ClusterLookup[] }>(
        `/clusters?search=${encodeURIComponent(clusterSearch)}`,
      ),
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

  return (
    <form className="inline-create-row" onSubmit={submit}>
      <label className="cluster-lookup-field">
        Cluster
        <input
          name="cluster"
          required
          maxLength={120}
          value={clusterText}
          onChange={(event) => {
            setClusterText(event.target.value);
            setSelected(null);
          }}
          placeholder="Type 3 chars"
        />
        {clusterSearch.length >= 3 && lookup.isFetching && !lookup.data && (
          <div className="cluster-suggestions">
            <p>Searching...</p>
          </div>
        )}
        {lookup.isError && (
          <div className="cluster-suggestions">
            <p>Unable to load clusters.</p>
          </div>
        )}
        {lookup.data && !selected && !lookup.isFetching && (
          <div className="cluster-suggestions">
            {lookup.data.data.length ? (
              lookup.data.data.map((cluster) => (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => pick(cluster)}
                >
                  <strong>{cluster.cluster_name}</strong>
                  <span>
                    Dock {cluster.dock_number} / {cluster.region}
                  </span>
                </button>
              ))
            ) : (
              <p>No cluster found.</p>
            )}
          </div>
        )}
      </label>
      <label>
        Region
        <input name="region" required readOnly value={selected?.region ?? ""} />
      </label>
      <label>
        Dock No
        <input
          name="dock_no"
          required
          maxLength={50}
          defaultValue={selected?.dock_number ?? ""}
          key={selected?.id ?? "dock"}
        />
      </label>
      <label>
        Backlogs
        <input
          name="backlogs"
          type="number"
          required
          readOnly
          min={0}
          value={selected?.backlogs ?? 0}
        />
      </label>
      <label>
        Backlogs Timestamp
        <input
          readOnly
          value={
            selected?.backlogs_ts
              ? new Date(selected.backlogs_ts).toLocaleString()
              : ""
          }
        />
        <input
          type="hidden"
          name="backlogs_timestamp"
          value={selected?.backlogs_ts ?? ""}
        />
      </label>
      <label>
        Truck Size
        <select name="truck_size" defaultValue="6W">
          <option>4W</option>
          <option>6W</option>
          <option>10W</option>
          <option>6WF</option>
        </select>
      </label>
      {error && <p className="error notice">{error}</p>}
      <div className="inline-create-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          <X size={15} />
          Cancel
        </button>
        <button type="submit" disabled={busy || !selected}>
          <Save size={15} />
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function InlineEditRow({
  request,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  request: TruckRequest;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (payload: RequestPayload) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(requestPayload(event.currentTarget));
  }

  return (
    <form className="inline-create-row" onSubmit={submit}>
      <label>
        Cluster
        <input name="cluster" required maxLength={120} defaultValue={request.cluster} />
      </label>
      <label>
        Region
        <input name="region" required maxLength={120} defaultValue={request.region} />
      </label>
      <label>
        Dock No
        <input name="dock_no" required maxLength={50} defaultValue={request.dock_no} />
      </label>
      <label>
        Backlogs
        <input name="backlogs" type="number" required min={0} defaultValue={request.backlogs} />
      </label>
      <label>
        Truck Size
        <select name="truck_size" defaultValue={request.truck_size}>
          <option>4W</option>
          <option>6W</option>
          <option>10W</option>
          <option>6WF</option>
        </select>
      </label>
      <label>
        Truck Type
        <select name="truck_type" defaultValue={request.truck_type}>
          <option>WETLEASE</option>
          <option>DRYLEASE</option>
        </select>
      </label>
      {error && <p className="error notice">{error}</p>}
      <div className="inline-create-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          <X size={15} />
          Cancel
        </button>
        <button type="submit" disabled={busy}>
          <Save size={15} />
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
