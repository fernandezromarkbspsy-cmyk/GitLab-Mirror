import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Page } from '../types';

export function Pagination({ page, onPageChange }: { page: Page<unknown>; onPageChange: (page: number) => void }) {
  if (page.last_page <= 1) return null;
  return <nav className="pagination" aria-label="Table pagination">
    <p>{page.from ?? 0}-{page.to ?? 0} of {page.total}</p>
    <div>
      <button className="icon-button" type="button" title="Previous page" aria-label="Previous page" disabled={page.current_page <= 1} onClick={() => onPageChange(page.current_page - 1)}><ChevronLeft size={18} /></button>
      <span>Page {page.current_page} of {page.last_page}</span>
      <button className="icon-button" type="button" title="Next page" aria-label="Next page" disabled={page.current_page >= page.last_page} onClick={() => onPageChange(page.current_page + 1)}><ChevronRight size={18} /></button>
    </div>
  </nav>;
}
