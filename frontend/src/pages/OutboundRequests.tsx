import {
  BadgeCheck,
  ChartNoAxesCombined,
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
import { useState } from "react";
import { LinehaulFilterPanel } from "../components/LinehaulFilterPanel";
import {
  InlineCreateRow,
  InlineEditRow,
} from "../components/OutboundRequestForms";
import { LinehaulRequestDetailsPanel } from "../components/LinehaulRequestDetailsPanel";
import { Pagination } from "../components/Pagination";
import { SkeletonCardList, SkeletonRequestTable } from "../components/Skeleton";
import { StatusBadge } from "../components/StatusBadge";
import type { QueueSnapshot } from "../hooks/useQueueNotifications";
import { useOutboundRequests } from "../hooks/useOutboundRequests";
import { openRequestsSheet } from "../lib/requests";
import type { TruckRequest, User } from "../types";
import "../styles/pages/outbound-requests.css";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
function displayValue(value?: string | null) {
  return value?.trim() ? value : "-";
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
    changeFilters,
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
    approveRequests,
    updateSearch,
    sortBy,
  } = useOutboundRequests();
  const [view, setView] = useState<"table" | "card">("table");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TruckRequest | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
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
  const canApprove = _user.role === "fte_ops";
  const approvalGrid = canApprove
    ? "!min-w-[1210px] ![grid-template-columns:116px_148px_145px_105px_88px_92px_90px_110px_105px_112px_99px]"
    : "";
  const selectedCount = selectedIds.size;
  const approvalLabel = selectedCount > 2 ? "Bulk Approved" : "Approved";

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpanded(row: TruckRequest) {
    setExpandedRow((current) => (current === row.id ? null : row.id));
    _queue.acknowledge(row.id);
  }

  function approveSelected() {
    const ids = [...selectedIds];
    if (!ids.length) return;
    approveRequests.mutate(ids, {
      onSuccess: () => setSelectedIds(new Set()),
    });
  }

  return (
    <div className="workspace-view lh-request-page">
      <section className="lh-request-workspace" aria-label="Linehaul requests">
        <LinehaulFilterPanel
          filters={filters}
          onChange={changeFilters}
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
              <div className={`lh-table-head lh-table-grid ${approvalGrid}`}>
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
                <span className="justify-center">
                  {canApprove && selectedCount > 0 && (
                    <button
                      type="button"
                      className="!h-8 whitespace-nowrap rounded-md bg-[#536500] !px-3 text-[11px] font-semibold normal-case tracking-normal text-white transition-colors hover:bg-[#405000] disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={approveRequests.isPending}
                      onClick={approveSelected}
                    >
                      {approvalLabel}
                    </button>
                  )}
                </span>
              </div>
              <div className="lh-table-body">
                {requests.isPending && <SkeletonRequestTable rows={6} />}
                {requests.error && (
                  <div className="lh-empty-state">{requests.error.message}</div>
                )}
                {!requests.isPending &&
                  !requests.error &&
                  rows.map((row, index) => {
                    const isExpanded = expandedRow === row.id;
                    const isAlerting =
                      row.status === "PENDING" &&
                      _queue.alerts.some((alert) => alert.id === row.id);
                    return (
                      <div className="contents" key={row.id}>
                        <div
                          className={`lh-table-row lh-table-grid ${approvalGrid} ${isAlerting ? "!bg-[#f6f9e9] ring-1 ring-inset ring-[#a2c500] motion-safe:animate-pulse" : ""}`}
                          style={
                            { "--row-index": index } as React.CSSProperties
                          }
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          aria-label={`View details for request ${row.id}`}
                          onClick={() => toggleExpanded(row)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleExpanded(row);
                            }
                          }}
                        >
                          <span className="flex items-center gap-2">
                            {canApprove && row.status === "PENDING" && (
                              <input
                                type="checkbox"
                                className="size-4 shrink-0 cursor-pointer accent-[#536500]"
                                aria-label={`Select request ${row.id}`}
                                checked={selectedIds.has(row.id)}
                                onChange={() => toggleSelected(row.id)}
                                onClick={(event) => event.stopPropagation()}
                              />
                            )}
                            <StatusBadge status={row.status} uppercase />
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
                        {isExpanded && (
                          <dl
                            className={`sticky left-0 col-span-full grid grid-cols-2 gap-x-8 gap-y-4 border-b border-[#dfe8e7] bg-[#fbfcf7] px-6 py-5 text-xs text-[#202b2e] shadow-inner md:grid-cols-4 ${canApprove ? "min-w-[1210px]" : "min-w-[1120px]"}`}
                            aria-label={`Expanded details for request ${row.id}`}
                          >
                            {[
                              ["Request ID", row.id],
                              [
                                "Request time",
                                formatDateTime(row.request_timestamp),
                              ],
                              ["Cluster", row.cluster],
                              ["Region", row.region],
                              ["Dock #", row.dock_no],
                              ["Backlogs", row.backlogs.toLocaleString()],
                              [
                                "Backlogs time",
                                formatDateTime(row.backlogs_timestamp),
                              ],
                              ["LH size", row.truck_size],
                              ["Truck type", row.truck_type],
                              ["SOC PIC", displayValue(row.ob_fte)],
                              ["LH trip #", displayValue(row.linehaul_trip_no)],
                              ["Plate #", displayValue(row.plate_number)],
                            ].map(([label, value]) => (
                              <div className="min-w-0" key={label}>
                                <dt className="mb-1 font-semibold uppercase tracking-[0.04em] text-[#6e7778]">
                                  {label}
                                </dt>
                                <dd className="truncate font-medium">
                                  {value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    );
                  })}
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
                      <StatusBadge status={row.status} uppercase />
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
          <Pagination
            page={requests.data}
            perPage={filters.perPage}
            onPageChange={(page) =>
              setFilters((current) => ({ ...current, page }))
            }
            onPerPageChange={(perPage) =>
              setFilters((current) => ({ ...current, perPage, page: 1 }))
            }
          />
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
