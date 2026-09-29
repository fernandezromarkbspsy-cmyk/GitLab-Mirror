import {
  ArrowUpDown,
  ChevronDown,
  Filter,
} from "lucide-react";
import { useState } from "react";
import type { RequestFilters, RequestSort } from "../types";
import { statuses } from "./RequestFilters";

const menuButtonClass =
  "flex min-h-9 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-[9px] border border-soc5-line bg-soc5-panel px-2.5 py-1.5 text-sm text-[#536264] transition-[color,border-color,background-color,box-shadow,transform] duration-200 hover:border-linehaul-teal/20 hover:bg-[#f5faf9] hover:text-linehaul-teal-strong hover:shadow-[var(--lh-2026-shadow-sm)] active:translate-y-px max-[480px]:w-full max-[480px]:justify-center";
const popoverClass =
  "absolute top-[calc(100%+8px)] left-0 z-20 grid min-w-[190px] gap-2.5 rounded-[10px] border border-[#dce9e8] bg-linehaul-surface p-3 shadow-[0_12px_28px_#1f4b4d1f] animate-[lh-popover-in_.18s_ease_both] max-[480px]:right-0 max-[480px]:left-auto";
type Props = {
  filters: RequestFilters;
  onChange: (next: RequestFilters) => void;
  onSort: (sort: RequestSort) => void;
};

export function LinehaulFilterPanel({
  filters,
  onChange,
  onSort,
}: Props) {
  const [openMenu, setOpenMenu] = useState<
    "status" | "filters" | "sort" | null
  >(null);
  const set = (values: Partial<RequestFilters>) =>
    onChange({ ...filters, ...values, page: 1 });

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-3 min-[481px]:flex-row min-[481px]:items-center max-[1120px]:flex-wrap max-[760px]:mt-[15px] max-[760px]:gap-2.5 max-[480px]:grid max-[480px]:grid-cols-2 lg:flex-row lg:items-center">
      <div className="relative inline-flex max-[760px]:order-none max-[760px]:flex-none">
        <button
          className={menuButtonClass}
          type="button"
          aria-expanded={openMenu === "status"}
          onClick={() => setOpenMenu(openMenu === "status" ? null : "status")}
        >
          <Filter size={15} aria-hidden="true" />
          <span>Status</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {openMenu === "status" && (
          <div
            className={`${popoverClass} min-w-40 gap-[3px] p-1.5`}
            role="menu"
            aria-label="Filter by request status"
          >
            {statuses.map((status) => (
              <button
                className="min-h-[30px] cursor-pointer rounded-md border-0 bg-transparent px-2 text-left text-xs capitalize text-[#506062] hover:bg-[#eef8f7] hover:text-linehaul-teal"
                key={status}
                type="button"
                role="menuitem"
                onClick={() => {
                  set({ status });
                  setOpenMenu(null);
                }}
              >
                {status === "ALL"
                  ? "All statuses"
                  : status.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative inline-flex max-[760px]:order-none max-[760px]:flex-none">
        <button
          className={menuButtonClass}
          type="button"
          aria-expanded={openMenu === "filters"}
          onClick={() => setOpenMenu(openMenu === "filters" ? null : "filters")}
        >
          <Filter size={15} aria-hidden="true" />
          <span>All filter</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {openMenu === "filters" && (
          <fieldset
            className={popoverClass}
            aria-label="Request filter controls"
          >
            <label className="grid gap-1.5 text-[10px] font-bold uppercase tracking-[.04em] text-[#657476]">
              Date
              <input
                className="min-h-[34px] rounded-[7px] border border-[#dce7e6] bg-linehaul-surface px-2 text-xs text-[#293b3d]"
                type="date"
                value={filters.dateFrom}
                onChange={(event) =>
                  set({
                    dateFrom: event.target.value,
                    dateTo: event.target.value,
                  })
                }
              />
            </label>
          </fieldset>
        )}
      </div>
      <div className="relative inline-flex max-[760px]:order-none max-[760px]:flex-none">
        <button
          className={menuButtonClass}
          type="button"
          aria-expanded={openMenu === "sort"}
          onClick={() => setOpenMenu(openMenu === "sort" ? null : "sort")}
        >
          <ArrowUpDown size={15} aria-hidden="true" />
          <span>Sort by</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        {openMenu === "sort" && (
          <div
            className={`${popoverClass} min-w-40 gap-[3px] p-1.5`}
            role="menu"
            aria-label="Sort requests"
          >
            {(
              [
                "request_timestamp",
                "cluster",
                "dock_no",
                "backlogs",
                "plate_number",
              ] as RequestSort[]
            ).map((sort) => (
              <button
                className="min-h-[30px] cursor-pointer rounded-md border-0 bg-transparent px-2 text-left text-xs capitalize text-[#506062] hover:bg-[#eef8f7] hover:text-linehaul-teal"
                key={sort}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSort(sort);
                  setOpenMenu(null);
                }}
              >
                {sort.replaceAll("_", " ")}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
