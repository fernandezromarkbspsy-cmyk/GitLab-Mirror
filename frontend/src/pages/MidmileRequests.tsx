import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  ChartNoAxesCombined,
  CheckCircle2,
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
  X,
  XCircle,
} from "lucide-react";
import type { FormEvent, MouseEvent } from "react";
import { useState } from "react";
import { LinehaulFilterPanel } from "../components/LinehaulFilterPanel";
import { LinehaulRequestDetailsPanel } from "../components/LinehaulRequestDetailsPanel";
import { Modal } from "../components/Modal";
import { Pagination } from "../components/Pagination";
import { SkeletonCardList, SkeletonRequestTable } from "../components/Skeleton";
import { StatusBadge } from "../components/StatusBadge";
import { useRequestFilters } from "../hooks/useRequestFilters";
import { api } from "../lib/api";
import { buildIdempotencyHeaders } from "../lib/idempotency";
import { openRequestsSheet, requestQueryString } from "../lib/requests";
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

export function MidmileRequests({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const { filters, appliedFilters, setFilters, changeFilters, updateSearch } =
    useRequestFilters();
  const [selected, setSelected] = useState<{
    request: TruckRequest;
    action: MmAction;
  } | null>(null);
  const [notice, setNotice] = useState("");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "card">("table");
  const [selectedRow, setSelectedRow] = useState<TruckRequest | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [panelPosition, setPanelPosition] = useState({ x: 24, y: 112 });
  const requests = useQuery({
    queryKey: ["requests", "midmile-all", appliedFilters],
    queryFn: () =>
      api<Page<TruckRequest>>(
        `/requests?${requestQueryString(appliedFilters)}`,
      ),
    placeholderData: (previous) => previous,
    enabled: user.role === "fte_mm",
  });
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
  function selectRow(row: TruckRequest, event: MouseEvent<HTMLElement>) {
    const workspace = event.currentTarget.closest<HTMLElement>(
      ".lh-request-workspace",
    );
    const bounds = workspace?.getBoundingClientRect();
    const scale = window.matchMedia("(min-width: 821px)").matches ? 0.75 : 1;
    if (bounds) {
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
    }
    setSelectedRow(row);
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
          onNotice={setNotice}
        />

        {selectedRow && (
          <LinehaulRequestDetailsPanel
            request={selectedRow}
            position={panelPosition}
            onPositionChange={setPanelPosition}
            onClose={() => setSelectedRow(null)}
            onNotice={setNotice}
          />
        )}

        <section
          className="lh-table-shell"
          aria-label="Midmile linehaul request records"
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
                  onClick={() => setNotice("Chart view is coming soon")}
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
                </button>
                <button type="button" onClick={() => sortBy("cluster")}>
                  <Hash size={14} />
                  <span>Cluster</span>
                </button>
                <span>
                  <BadgeCheck size={14} />
                  Region
                </span>
                <button type="button" onClick={() => sortBy("dock_no")}>
                  <Truck size={14} />
                  <span>Dock #</span>
                </button>
                <button type="button" onClick={() => sortBy("backlogs")}>
                  <ListChecks size={14} />
                  <span>Backlogs</span>
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
                  (requests.data?.data ?? []).map((row, index) => (
                    <div
                      className="lh-table-row lh-table-grid"
                      key={row.id}
                      style={{ "--row-index": index } as React.CSSProperties}
                      role="button"
                      tabIndex={0}
                      aria-expanded={expandedRow === row.id}
                      aria-label={`View details for request ${row.id}`}
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
                      <span>
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
                            {row.status === "PENDING" && (
                              <>
                                <button
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
        ? {
            plate_number: data.get("plate_number"),
            truck_size: data.get("truck_size"),
            truck_type: data.get("truck_type"),
            provide_time: data.get("provide_time") || null,
          }
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
            <label>
              Provide time
              <input name="provide_time" type="datetime-local" />
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
