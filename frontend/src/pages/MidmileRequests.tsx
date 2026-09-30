import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Printer,
  RefreshCw,
  Table2,
  Truck,
  X,
} from "lucide-react";
import type { FormEvent } from "react";
import { Fragment, useState } from "react";
import {
  ColumnVisibilityMenu,
  linehaulColumnOptions,
} from "../components/ColumnVisibilityMenu";
import { LinehaulFilterPanel } from "../components/LinehaulFilterPanel";
import { Modal } from "../components/Modal";
import { Pagination } from "../components/Pagination";
import { PrintableTruckLabel } from "../components/PrintableTruckLabel";
import { SkeletonCardList, SkeletonRequestTable } from "../components/Skeleton";
import { StatusBadge } from "../components/StatusBadge";
import { useRequestFilters } from "../hooks/useRequestFilters";
import { api } from "../lib/api";
import { buildIdempotencyHeaders } from "../lib/idempotency";
import {
  buildMidmileAssignmentPayload,
  openRequestsSheet,
  requestQueryString,
} from "../lib/requests";
import type { Page, RequestSort, TruckRequest, User } from "../types";

type MmAction = "assign-truck" | "reject-mm";

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

export function MidmileRequests({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const { filters, appliedFilters, setFilters, changeFilters } =
    useRequestFilters();
  const [selected, setSelected] = useState<{
    request: TruckRequest;
    action: MmAction;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "card">("table");
  const [printRequest, setPrintRequest] = useState<TruckRequest | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    linehaulColumnOptions.map(({ key }) => key),
  );
  const hasColumn = (key: string) => visibleColumns.includes(key);
  const requests = useQuery({
    queryKey: ["requests", "midmile-all", appliedFilters],
    queryFn: () =>
      api<Page<TruckRequest>>(
        `/requests?${requestQueryString(appliedFilters)}`,
      ),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: user.role === "fte_mm",
  });

  function toggleSelected(id: string) {
    setSelectedIds((current) => {
      if (current.has(id)) return new Set();
      return new Set([id]);
    });
  }
  const selectedRequest = (requests.data?.data ?? []).find((row) =>
    selectedIds.has(row.id),
  );
  const transition = useMutation({
    mutationFn: ({
      request,
      action,
      payload,
    }: {
      request: TruckRequest;
      action: MmAction;
      payload: Record<string, unknown>;
    }) =>
      api<TruckRequest>(`/requests/${request.id}/${action}`, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: buildIdempotencyHeaders(`midmile-${action}`, {
          requestId: request.id,
          action,
          payload,
        }),
      }),
    onSuccess: async (_, variables) => {
      setSelected(null);
      setNotice(
        variables.action === "assign-truck"
          ? "Truck confirmed."
          : "Request returned to Outbound.",
      );
      await queryClient.invalidateQueries({ queryKey: ["requests"] });
      await queryClient.invalidateQueries({ queryKey: ["request-metrics"] });
    },
  });

  function sortBy(sort: RequestSort) {
    setFilters((value) => ({
      ...value,
      sort,
      direction:
        value.sort === sort && value.direction === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }
  function exportSheet() {
    openRequestsSheet();
  }
  return (
    <div
      className={`workspace-view lh-request-page${selected ? " lh-drawer-open" : ""}`}
    >
      <section
        className="lh-request-workspace"
        aria-label="Midmile linehaul requests"
      >
        {(notice || transition.error) && (
          <p
            className={`notice${transition.error || notice.includes("failed") ? " error" : " success-notice"}`}
          >
            {transition.error?.message || notice}
          </p>
        )}

        <LinehaulFilterPanel
          filters={filters}
          onChange={changeFilters}
          onSort={sortBy}
          onExport={exportSheet}
          showAddNew={false}
          showCreateNew={false}
          onNotice={setNotice}
        />

        {printRequest && (
          <PrintableTruckLabel
            request={printRequest}
            onClose={() => setPrintRequest(null)}
          />
        )}

        <section
          className="lh-table-shell"
          aria-label="Midmile linehaul request records"
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
              {selectedRequest && (
                <div className="lh-request-toolbar-actions" aria-label="Selected request actions">
                  <span className="lh-request-toolbar-label">Selected request</span>
                  <button
                    className="request-action-button request-action-assign"
                    type="button"
                    onClick={() =>
                      setSelected({
                        request: selectedRequest,
                        action: "assign-truck",
                      })
                    }
                  >
                    Assign
                  </button>
                  <button
                    className="request-action-button request-action-reject"
                    type="button"
                    onClick={() =>
                      setSelected({
                        request: selectedRequest,
                        action: "reject-mm",
                      })
                    }
                  >
                    Reject
                  </button>
                </div>
              )}
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
                onClick={exportSheet}
              >
                <Download size={15} aria-hidden="true" />
                Export
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
                  <span className="flex items-center gap-2">
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
                  </button>
                )}
                {hasColumn("cluster") && (
                  <button type="button" onClick={() => sortBy("cluster")}>
                    <Hash size={14} />
                    <span>Cluster</span>
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
                  </button>
                )}
                {hasColumn("backlogs") && (
                  <button type="button" onClick={() => sortBy("backlogs")}>
                    <ListChecks size={14} />
                    <span>Backlogs</span>
                  </button>
                )}
                {hasColumn("backlogsTime") && <span>Backlogs Time Stamp</span>}
                {hasColumn("lhTypeRequest") && <span>LH Type (Request)</span>}
                {hasColumn("opsFte") && <span>Ops FTE</span>}
                {hasColumn("plateNumber") && (
                  <button type="button" onClick={() => sortBy("plate_number")}>
                    <Hash size={14} />
                    <span>Plate number</span>
                  </button>
                )}
                {hasColumn("mmFte") && <span>MM FTE</span>}
                {hasColumn("truckSize") && (
                  <span>
                    <Truck size={14} />
                    LH Size
                  </span>
                )}
                {hasColumn("lhTypeInput") && (
                  <span>LH type (input by FTE MM)</span>
                )}
                {hasColumn("provideTime") && <span>Provide Time</span>}
                {hasColumn("linehaulTrip") && <span>Linehaul Trip</span>}
                {hasColumn("assignedTime") && <span>Assigned time</span>}
                {hasColumn("dockedTime") && <span>Docked Time</span>}
                {hasColumn("docOfficer") && <span>DOC Officer</span>}
                {hasColumn("opsPic") && <span>OPS/PIC</span>}
                <span />
              </div>
              <div className="lh-table-body">
                {requests.isPending && (
                  <SkeletonRequestTable rows={6} columns={visibleColumns.length + 1} />
                )}
                {requests.error && (
                  <div className="lh-empty-state">{requests.error.message}</div>
                )}
                {!requests.isPending &&
                  !requests.error &&
                  (requests.data?.data ?? []).map((row, index) => (
                    <Fragment key={row.id}>
                    <div
                      className={`lh-table-row lh-table-grid ${expandedRow === row.id ? "is-expanded" : ""} ${selectedIds.has(row.id) ? "is-selected" : ""}`}
                      key={row.id}
                      style={{ "--row-index": index } as React.CSSProperties}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expandedRow === row.id}
                      aria-label={`${expandedRow === row.id ? "Collapse" : "Expand"} details for request ${row.id}`}
                      onClick={() =>
                        setExpandedRow((current) =>
                          current === row.id ? null : row.id,
                        )
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setExpandedRow((current) =>
                            current === row.id ? null : row.id,
                          );
                        }
                      }}
                    >
                      {hasColumn("status") && (
                        <span className="flex items-center gap-2">
                        {row.status === "PENDING" && (
                          <input
                            type="checkbox"
                            className="request-row-checkbox"
                            aria-label={`Select request ${row.id}`}
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleSelected(row.id)}
                            onClick={(event) => event.stopPropagation()}
                          />
                        )}
                        <ChevronDown
                          aria-hidden="true"
                          className={`size-3.5 shrink-0 text-[#718071] transition-transform ${expandedRow === row.id ? "rotate-180 text-[#536500]" : ""}`}
                        />
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
                      {hasColumn("backlogsTime") && (
                        <span>{formatDateTime(row.backlogs_timestamp)}</span>
                      )}
                      {hasColumn("lhTypeRequest") && (
                        <span>{displayValue(row.truck_type)}</span>
                      )}
                      {hasColumn("opsFte") && (
                        <span>{displayValue(row.ob_fte_name ?? row.ob_fte)}</span>
                      )}
                      {hasColumn("plateNumber") && (
                        <span>{displayValue(row.plate_number)}</span>
                      )}
                      {hasColumn("mmFte") && (
                        <span>{displayValue(row.created_by_name ?? row.created_by)}</span>
                      )}
                      {hasColumn("truckSize") && <span>{row.truck_size}</span>}
                      {hasColumn("lhTypeInput") && (
                        <span>{displayValue(row.truck_type)}</span>
                      )}
                      {hasColumn("provideTime") && (
                        <span>{formatDateTime(row.provide_time)}</span>
                      )}
                      {hasColumn("linehaulTrip") && (
                        <span>{displayValue(row.linehaul_trip_no)}</span>
                      )}
                      {hasColumn("assignedTime") && <span>-</span>}
                      {hasColumn("dockedTime") && (
                        <span>{formatDateTime(row.docked_time)}</span>
                      )}
                      {hasColumn("docOfficer") && (
                        <span>{displayValue(row.created_by_name ?? row.created_by)}</span>
                      )}
                      {hasColumn("opsPic") && (
                        <span>{displayValue(row.ob_fte_name ?? row.ob_fte)}</span>
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
                                setPrintRequest(row);
                                setOpenRow(null);
                              }}
                            >
                              <Printer size={14} />
                              Print
                            </button>
                            {row.status === "PENDING" && (
                              <>
                                <button
                                  className="request-action-button request-action-assign"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelected({
                                      request: row,
                                      action: "assign-truck",
                                    });
                                    setOpenRow(null);
                                  }}
                                >
                                  Assign
                                </button>
                                <button
                                  className="request-action-button request-action-reject"
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setSelected({
                                      request: row,
                                      action: "reject-mm",
                                    });
                                    setOpenRow(null);
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </span>
                        )}
                      </span>
                    </div>
                    {expandedRow === row.id && (
                      <dl
                        className="col-span-full grid min-w-[1120px] grid-cols-2 gap-x-6 gap-y-2 border-b border-[#e5ebe6] border-l-2 border-l-[#a2c500] bg-[#fbfcf7] px-5 py-3 text-xs text-[#202b2e] md:grid-cols-4"
                        aria-label={`Expanded details for request ${row.id}`}
                      >
                        {[
                          ["Cluster", formatCluster(row.cluster)],
                          ["Request time", formatDetailDateTime(row.request_timestamp)],
                          ["Region", row.region],
                          ["Dock #", row.dock_no],
                          ["Backlogs", row.backlogs.toLocaleString()],
                          ["Backlogs time", formatDetailDateTime(row.backlogs_timestamp)],
                          ["LH size", row.truck_size],
                          ["Truck type", row.truck_type],
                          ["SOC PIC · FTE Ops", displayValue(row.ob_fte_name ?? row.ob_fte)],
                          ["LH trip #", displayValue(row.linehaul_trip_no)],
                          ["Plate #", displayValue(row.plate_number)],
                        ].map(([label, value]) => (
                          <div className={`min-w-0 border-b border-[#e9eeea] pb-2 ${label === "Cluster" ? "md:col-span-2" : ""}`} key={label}>
                            <dt className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#718071]">{label}</dt>
                            <dd className={`break-words ${label === "Cluster" ? "text-sm font-bold leading-5 text-[#26352d]" : "text-xs font-medium leading-4 text-[#33423a]"}`}>{value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    </Fragment>
                  ))}
                {!requests.isPending &&
                  !requests.error &&
                  (requests.data?.data ?? []).length === 0 && (
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
                (requests.data?.data ?? []).map((row) => (
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
                        onClick={() => setPrintRequest(row)}
                      >
                        <Printer size={14} />
                        Print label
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

        {selected && (
          <MidmileActionDialog
            selection={selected}
            busy={transition.isPending}
            error={transition.error?.message}
            onClose={() => setSelected(null)}
            onSubmit={(payload) => transition.mutate({ ...selected, payload })}
          />
        )}
      </section>
    </div>
  );
}

function MidmileActionDialog({
  selection,
  busy,
  error,
  onClose,
  onSubmit,
}: {
  selection: { request: TruckRequest; action: MmAction };
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>) => void;
}) {
  const confirming = selection.action === "assign-truck";
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    onSubmit(
      confirming
        ? buildMidmileAssignmentPayload(data)
        : { rejection_remarks: data.get("rejection_remarks") },
    );
  }
  return (
    <Modal
      open
      onClose={onClose}
      className="form-dialog compact"
      role="dialog"
      ariaLabelledBy="action-title"
    >
      <div className="dialog-head">
        <div>
          <p className="eyebrow">{selection.request.cluster}</p>
          <h2 id="action-title">
            {confirming ? "Assign truck" : "Reject request"}
          </h2>
        </div>
        <button
          className="icon-button"
          type="button"
          title="Close"
          aria-label="Close"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </div>
      <form onSubmit={submit}>
        {confirming ? (
          <>
            <label>
              Plate number
              <input name="plate_number" required maxLength={30} />
            </label>
            <label>
              Truck size
              <select
                name="truck_size"
                defaultValue={selection.request.truck_size}
              >
                <option>4W</option>
                <option>6W</option>
                <option>10W</option>
                <option>6WF</option>
              </select>
            </label>
            <label>
              Truck type
              <select
                name="truck_type"
                defaultValue={selection.request.truck_type}
              >
                <option>WETLEASE</option>
                <option>DRYLEASE</option>
              </select>
            </label>
          </>
        ) : (
          <label>
            Rejection remarks
            <textarea name="rejection_remarks" required rows={4} />
          </label>
        )}
        {error && <p className="error notice">{error}</p>}
        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy}>
            {busy ? (
              "Saving..."
            ) : confirming ? (
              <>
                <Truck size={17} />
                Assign truck
              </>
            ) : (
              "Reject request"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
