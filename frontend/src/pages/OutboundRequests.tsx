import {
  BadgeCheck,
  ChevronDown,
  CircleCheck,
  Clock3,
  Download,
  Hash,
  LayoutGrid,
  ListChecks,
  MoreHorizontal,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Table2,
  Tag,
  Truck,
  Users,
} from "lucide-react";
import type { MouseEvent } from "react";
import { useState } from "react";
import {
  ColumnVisibilityMenu,
  linehaulColumnOptions,
} from "../components/ColumnVisibilityMenu";
import { LinehaulFilterPanel } from "../components/LinehaulFilterPanel";
import {
  InlineCreateRow,
  InlineEditRow,
} from "../components/OutboundRequestForms";
import { LinehaulRequestDetailsPanel } from "../components/LinehaulRequestDetailsPanel";
import { Modal } from "../components/Modal";
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
function formatDetailDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
function formatCluster(value: string) {
  return value
    .split(",")
    .map((cluster) => cluster.trim())
    .filter(Boolean)
    .join(" · ");
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
    rejectRequest,
    sortBy,
  } = useOutboundRequests();
  const [view, setView] = useState<"table" | "card">("table");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [selectedRow, setSelectedRow] = useState<TruckRequest | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [rejecting, setRejecting] = useState<TruckRequest | null>(null);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    linehaulColumnOptions.map(({ key }) => key),
  );
  const [panelPosition, setPanelPosition] = useState({ x: 24, y: 112 });
  const hasColumn = (key: string) => visibleColumns.includes(key);
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
  const canEdit = _user.role === "fte_ops";
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
          onExport={exportRows}
          onAddNew={() => {
            createRequest.reset();
            setCreating(true);
          }}
          onNotice={showToast}
          showCreateNew={_user.role === "ops_pic" || canApprove}
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
                className={`lh-toolbar-icon lh-refresh-button${requests.isFetching ? " is-refreshing" : ""}`}
                type="button"
                aria-label={requests.isFetching ? "Refreshing records" : "Refresh records"}
                title={requests.isFetching ? "Refreshing records" : "Refresh records"}
                aria-busy={requests.isFetching}
                disabled={requests.isFetching}
                onClick={() => void requests.refetch()}
              >
                <RefreshCw size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="lh-table-toolbar-actions">
              <div className="lh-view-toggle" role="group" aria-label="Request view">
                <button
                  className="lh-toolbar-icon"
                  type="button"
                  aria-label="Table view"
                  title="Table view"
                  aria-pressed={view === "table"}
                  onClick={() => setView("table")}
                >
                  <Table2 size={16} aria-hidden="true" />
                </button>
                <button
                  className="lh-toolbar-icon"
                  type="button"
                  aria-label="Card view"
                  title="Card view"
                  aria-pressed={view === "card"}
                  onClick={() => setView("card")}
                >
                  <LayoutGrid size={16} aria-hidden="true" />
                </button>
              </div>
              {view === "table" && (
                <ColumnVisibilityMenu
                  label="Choose visible columns"
                  options={linehaulColumnOptions}
                  visible={visibleColumns}
                  onChange={setVisibleColumns}
                  iconOnly
                />
              )}
              <button
                className="lh-table-action"
                type="button"
                onClick={() => void exportRows()}
              >
                <Download size={15} aria-hidden="true" />
                Export
              </button>
              <button
                className="lh-table-action is-primary"
                type="button"
                onClick={() => {
                  createRequest.reset();
                  setCreating(true);
                }}
              >
                <Plus size={15} aria-hidden="true" />
                Add new
              </button>
            </div>
          </div>
          {view === "table" ? (
            <div
              className="lh-records-table"
              style={{
                gridTemplateColumns: `repeat(${visibleColumns.length + 1}, minmax(max-content, 1fr))`,
              }}
            >
              <div className="lh-table-head lh-table-grid">
                {hasColumn("status") && (
                  <span>
                    <CircleCheck size={14} />
                    Status
                  </span>
                )}
                {hasColumn("requestTime") && (
                  <button
                    type="button"
                    onClick={() => sortBy("request_timestamp")}
                  >
                    <Clock3 size={14} />
                    <span>Request Time</span>
                    <SlidersHorizontal size={13} />
                  </button>
                )}
                {hasColumn("cluster") && (
                  <button type="button" onClick={() => sortBy("cluster")}>
                    <Hash size={14} />
                    <span>Cluster</span>
                    <SlidersHorizontal size={13} />
                  </button>
                )}
                {hasColumn("region") && (
                  <span>
                    <BadgeCheck size={14} />
                    Region
                  </span>
                )}
                {hasColumn("dock") && (
                  <button type="button" onClick={() => sortBy("dock_no")}>
                    <Truck size={14} />
                    <span>Dock #</span>
                    <SlidersHorizontal size={13} />
                  </button>
                )}
                {hasColumn("backlogs") && (
                  <button type="button" onClick={() => sortBy("backlogs")}>
                    <ListChecks size={14} />
                    <span>Backlogs</span>
                    <SlidersHorizontal size={13} />
                  </button>
                )}
                {hasColumn("truckSize") && (
                  <span>
                    <Truck size={14} />
                    LH Size
                  </span>
                )}
                {hasColumn("socPic") && (
                  <span>
                    <Users size={14} />
                    SOC PIC
                  </span>
                )}
                {hasColumn("tripNumber") && (
                  <span>
                    <Tag size={14} />
                    LH Trip #
                  </span>
                )}
                {hasColumn("plateNumber") && (
                  <button type="button" onClick={() => sortBy("plate_number")}>
                    <Hash size={14} />
                    <span>Plate #</span>
                    <SlidersHorizontal size={13} />
                  </button>
                )}
                <span className="justify-center">
                  {canApprove && selectedCount > 0 && (
                    <button
                      type="button"
                      className="request-action-button request-action-approve !h-8 whitespace-nowrap !px-3"
                      disabled={approveRequests.isPending}
                      onClick={approveSelected}
                    >
                      {approvalLabel}
                    </button>
                  )}
                </span>
              </div>
              <div className="lh-table-body">
                {requests.isFetching && (
                  <SkeletonRequestTable rows={6} columns={visibleColumns.length + 1} />
                )}
                {requests.error && (
                  <div className="lh-empty-state">{requests.error.message}</div>
                )}
                {!requests.isFetching &&
                  !requests.error &&
                  rows.map((row, index) => {
                    const isExpanded = expandedRow === row.id;
                    const isAlerting =
                      row.status === "PENDING" &&
                      _queue.alerts.some((alert) => alert.id === row.id);
                    return (
                      <div className="contents" key={row.id}>
                        <div
                          className={`lh-table-row lh-table-grid ${isExpanded ? "is-expanded" : ""} ${selectedIds.has(row.id) ? "is-selected" : ""} ${isAlerting ? "!bg-[#f6f9e9] ring-1 ring-inset ring-[#a2c500] motion-safe:animate-pulse" : ""}`}
                          style={
                            { "--row-index": index } as React.CSSProperties
                          }
                          role="button"
                          tabIndex={0}
                          aria-expanded={isExpanded}
                          aria-label={`${isExpanded ? "Collapse" : "Expand"} details for request ${row.id}`}
                          onClick={() => toggleExpanded(row)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              toggleExpanded(row);
                            }
                          }}
                        >
                          {hasColumn("status") && (
                            <span className="flex items-center gap-2">
                              <ChevronDown
                                aria-hidden="true"
                                className={`size-3.5 shrink-0 text-[#718071] transition-transform ${isExpanded ? "rotate-180 text-[#536500]" : ""}`}
                              />
                              {canApprove && row.status === "PENDING" && (
                                <input
                                  type="checkbox"
                                  className="request-row-checkbox"
                                  aria-label={`Select request ${row.id}`}
                                  checked={selectedIds.has(row.id)}
                                  onChange={() => toggleSelected(row.id)}
                                  onClick={(event) => event.stopPropagation()}
                                />
                              )}
                              <StatusBadge status={row.status} uppercase />
                            </span>
                          )}
                          {hasColumn("requestTime") && (
                            <span>{formatDateTime(row.request_timestamp)}</span>
                          )}
                          {hasColumn("cluster") && (
                            <span title={row.cluster}>{row.cluster}</span>
                          )}
                          {hasColumn("region") && <span>{row.region}</span>}
                          {hasColumn("dock") && <span>{row.dock_no}</span>}
                          {hasColumn("backlogs") && (
                            <span>{row.backlogs.toLocaleString()}</span>
                          )}
                          {hasColumn("truckSize") && <span>{row.truck_size}</span>}
                          {hasColumn("socPic") && (
                            <span>{displayValue(row.ob_fte)}</span>
                          )}
                          {hasColumn("tripNumber") && (
                            <span>{displayValue(row.linehaul_trip_no)}</span>
                          )}
                          {hasColumn("plateNumber") && (
                            <span>{displayValue(row.plate_number)}</span>
                          )}
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
                                {canApprove && row.status === "PENDING" && (
                                  <button
                                    className="request-action-button request-action-reject"
                                    type="button"
                                    onClick={() => {
                                      setRejecting(row);
                                      setOpenRow(null);
                                    }}
                                  >
                                    Reject
                                  </button>
                                )}
                                {canEdit && <button
                                  type="button"
                                  onClick={() => {
                                    updateRequest.reset();
                                    setEditing(row);
                                    setOpenRow(null);
                                  }}
                                >
                                  Edit
                                </button>}
                              </span>
                            )}
                          </span>
                        </div>
                        {isExpanded && (
                          <dl
                            className={`sticky left-0 col-span-full grid grid-cols-2 gap-x-6 gap-y-2 border-b border-[#e5ebe6] border-l-2 border-l-[#a2c500] bg-[#fbfcf7] px-5 py-3 text-xs text-[#202b2e] md:grid-cols-4 ${canApprove ? "min-w-[1210px]" : "min-w-[1120px]"}`}
                            aria-label={`Expanded details for request ${row.id}`}
                          >
                            {[
                              ["Cluster", formatCluster(row.cluster)],
                              [
                                "Request time",
                                formatDetailDateTime(row.request_timestamp),
                              ],
                              ["Region", row.region],
                              ["Dock #", row.dock_no],
                              ["Backlogs", row.backlogs.toLocaleString()],
                              [
                                "Backlogs time",
                                formatDetailDateTime(row.backlogs_timestamp),
                              ],
                              ["LH size", row.truck_size],
                              ["Truck type", row.truck_type],
                              ["SOC PIC · FTE Ops", displayValue(row.ob_fte_name ?? row.ob_fte)],
                              ["LH trip #", displayValue(row.linehaul_trip_no)],
                              ["Plate #", displayValue(row.plate_number)],
                            ].map(([label, value]) => (
                              <div className={`min-w-0 border-b border-[#e9eeea] pb-2 ${label === "Cluster" ? "md:col-span-2" : ""}`} key={label}>
                                <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#718071]">
                                  {label}
                                </dt>
                                <dd className={`break-words ${label === "Cluster" ? "text-sm font-bold leading-5 text-[#26352d]" : "text-xs font-medium leading-4 text-[#33423a]"}`}>
                                  {value}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </div>
                    );
                  })}
                {!requests.isFetching &&
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
              {requests.isFetching ? (
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
      {rejecting && (
        <Modal
          open
          onClose={() => setRejecting(null)}
          className="form-dialog compact"
          role="dialog"
          ariaLabelledBy="outbound-reject-title"
        >
          <div className="dialog-head">
            <div>
              <p className="eyebrow">FTE Ops action</p>
              <h2 id="outbound-reject-title">Reject request</h2>
              <p>{rejecting.id}</p>
            </div>
          </div>
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              rejectRequest.mutate(
                {
                  id: rejecting.id,
                  rejection_remarks: String(data.get("rejection_remarks") ?? ""),
                },
                { onSuccess: () => setRejecting(null) },
              );
            }}
          >
            <label>
              Rejection remarks
              <textarea name="rejection_remarks" required rows={4} />
            </label>
            {rejectRequest.error && (
              <p className="notice error">{rejectRequest.error.message}</p>
            )}
            <div className="dialog-actions">
              <button
                className="button-secondary"
                type="button"
                onClick={() => setRejecting(null)}
                disabled={rejectRequest.isPending}
              >
                Cancel
              </button>
              <button
                className="request-action-button request-action-reject"
                type="submit"
                disabled={rejectRequest.isPending}
              >
                {rejectRequest.isPending ? "Rejecting…" : "Reject request"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="lh-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
