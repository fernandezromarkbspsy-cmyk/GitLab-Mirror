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
  Search,
  SlidersHorizontal,
  Table2,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import type { MouseEvent } from "react";
import { useMemo, useState } from "react";
import { LinehaulFilterPanel } from "../components/LinehaulFilterPanel";
import {
  InlineCreateRow,
  InlineEditRow,
} from "../components/OutboundRequestForms";
import { LinehaulRequestDetailsPanel } from "../components/LinehaulRequestDetailsPanel";
import { SkeletonCardList, SkeletonRequestTable } from "../components/Skeleton";
import type { QueueSnapshot } from "../hooks/useQueueNotifications";
import { useOutboundRequests } from "../hooks/useOutboundRequests";
import { openRequestsSheet } from "../lib/requests";
import type {
  TruckRequest,
  User,
} from "../types";
import "../styles/pages/outbound-requests.css";

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

export function OutboundRequests({
  user: _user,
  queue: _queue,
}: {
  user: User;
  queue: QueueSnapshot;
}) {
  const {
    filters,
    setFilters,
    requests,
    rows,
    creating,
    setCreating,
    editing,
    setEditing,
    toast,
    showToast,
    createRequest,
    updateRequest,
    updateSearch,
    sortBy,
  } = useOutboundRequests();
  const [view, setView] = useState<"table" | "card">("table");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TruckRequest | null>(null);
  const [panelPosition, setPanelPosition] = useState({ x: 24, y: 112 });
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
    <div className="workspace-view lh-request-page">
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
              onSubmit={(payload) =>
                updateRequest.mutate({ id: editing.id, payload })
              }
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
                {requests.isPending && <SkeletonRequestTable rows={6} />}
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
              {requests.isPending ? (
                <SkeletonCardList rows={4} />
              ) : (
                rows.map((row) => (
                  <article className="lh-record-card" key={row.id}>
                    <div>
                      <small>{row.id}</small>
                      <h3>{row.cluster}</h3>
                      <p>
                        {row.region} · Dock {row.dock_no}
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
                      <button
                        type="button"
                        className="text-button"
                        onClick={(event) => selectRow(row, event)}
                      >
                        View details
                      </button>
                    </div>
                  </article>
                ))
              )}
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

