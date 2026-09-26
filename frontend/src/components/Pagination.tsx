import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Page } from "../types";

type Props = {
  page?: Page<unknown>;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

export function Pagination({
  page,
  perPage,
  onPageChange,
  onPerPageChange,
}: Props) {
  const currentPage = page?.current_page ?? 1;
  const lastPage = page?.last_page ?? 1;
  const range = page
    ? `${page.from ?? 0}-${page.to ?? 0} of ${page.total}`
    : "Loading records";

  return (
    <footer className="flex min-w-0 items-center justify-between border-t border-linehaul-line bg-linehaul-surface px-[11px] py-0 text-xs text-[#536163]">
      <span aria-live="polite">{range}</span>
      <nav
        className="flex items-center gap-1.5"
        aria-label="Request table pagination"
      >
        <label className="inline-flex items-center gap-2">
          <span className="max-[480px]:sr-only">Rows per page</span>
          <select
            className="h-[34px] w-[60px] rounded-lg border border-[rgb(24_61_63_/_10%)] bg-[#f9fbfa] px-[9px] text-[#4f595b] transition-[border-color,box-shadow] duration-200 focus:border-[rgb(8_127_124_/_28%)] focus:outline-none focus:ring-[3px] focus:ring-[rgb(8_127_124_/_7%)]"
            aria-label="Rows per page"
            value={String(perPage)}
            onChange={(event) => onPerPageChange(Number(event.target.value))}
          >
            <option value="8">8</option>
            <option value="10">10</option>
            <option value="20">20</option>
          </select>
        </label>
        <span className="min-w-[78px] text-center text-[#687577] max-[480px]:sr-only">
          Page {currentPage} of {lastPage}
        </span>
        <button
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-[#344042] transition-colors duration-150 enabled:hover:bg-[#edf8f6] enabled:hover:text-linehaul-teal disabled:cursor-default disabled:text-[#cdd4d5]"
          type="button"
          disabled={!page || currentPage <= 1}
          aria-label="Previous page"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg border-0 bg-transparent p-0 text-[#344042] transition-colors duration-150 enabled:hover:bg-[#edf8f6] enabled:hover:text-linehaul-teal disabled:cursor-default disabled:text-[#cdd4d5]"
          type="button"
          disabled={!page || currentPage >= lastPage}
          aria-label="Next page"
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </footer>
  );
}
