import { ArrowUpDown, ChevronDown, Download, Filter, Plus, Search, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { statuses } from './RequestFilters';
import type { RequestFilters, RequestSort } from '../types';

type Props = {
  filters: RequestFilters;
  exporting?: boolean;
  onChange: (next: RequestFilters) => void;
  onSort: (sort: RequestSort) => void;
  onExport: () => void;
  onRefresh?: () => void;
  onAddNew?: () => void;
  onNotice?: (message: string) => void;
};

export function LinehaulFilterPanel({ filters, exporting = false, onChange, onSort, onExport, onAddNew, onNotice }: Props) {
  const [openMenu, setOpenMenu] = useState<'status' | 'filters' | 'sort' | null>(null);
  const set = (values: Partial<RequestFilters>) => onChange({ ...filters, ...values, page: 1 });

  return <div className="lh-filter-panel flex flex-col gap-3 lg:flex-row lg:items-center">
    <div className="lh-filter-menu-wrap">
      <button className="lh-filter-control flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" type="button" aria-expanded={openMenu === 'status'} onClick={() => setOpenMenu(openMenu === 'status' ? null : 'status')}><Filter size={15} aria-hidden="true" /><span>Status</span><ChevronDown size={14} aria-hidden="true" /></button>
      {openMenu === 'status' && <div className="lh-filter-popover lh-status-popover" role="menu" aria-label="Filter by request status">
        {statuses.map(status => <button key={status} type="button" role="menuitem" onClick={() => { set({ status }); setOpenMenu(null); }}>{status === 'ALL' ? 'All statuses' : status.replaceAll('_', ' ')}</button>)}
      </div>}
    </div>
    <div className="lh-filter-menu-wrap">
      <button className="lh-filter-control flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" type="button" aria-expanded={openMenu === 'filters'} onClick={() => setOpenMenu(openMenu === 'filters' ? null : 'filters')}><Filter size={15} aria-hidden="true" /><span>All filter</span><ChevronDown size={14} aria-hidden="true" /></button>
      {openMenu === 'filters' && <fieldset className="lh-filter-popover" aria-label="Request filter controls">
        <label>Date<input type="date" value={filters.dateFrom} onChange={event => set({ dateFrom: event.target.value, dateTo: event.target.value })} /></label>
      </fieldset>}
    </div>
    <div className="lh-filter-menu-wrap">
      <button className="lh-filter-control flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" type="button" aria-expanded={openMenu === 'sort'} onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}><ArrowUpDown size={15} aria-hidden="true" /><span>Sort by</span><ChevronDown size={14} aria-hidden="true" /></button>
      {openMenu === 'sort' && <div className="lh-filter-popover lh-sort-popover" role="menu" aria-label="Sort requests">
        {(['request_timestamp', 'cluster', 'dock_no', 'backlogs', 'plate_number'] as RequestSort[]).map(sort => <button key={sort} type="button" role="menuitem" onClick={() => { onSort(sort); setOpenMenu(null); }}>{sort.replaceAll('_', ' ')}</button>)}
      </div>}
    </div>
    <div className="relative order-first w-full flex-1 lg:order-none lg:ml-auto lg:max-w-xs"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" aria-hidden="true" /><input aria-label="Search" placeholder="Search requests" className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-gray-300 focus:outline-none" type="text" value={filters.search} onChange={event => set({ search: event.target.value })} /></div>
    <button className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50" type="button" aria-label="Open settings" onClick={() => onNotice?.('Table settings opened')}><Settings2 className="h-4 w-4" aria-hidden="true" /></button>
    <button className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={exporting} onClick={onExport}><Download size={16} />{exporting ? 'Exporting' : 'Export'}</button>
    <button className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700" type="button" onClick={onAddNew ?? (() => onNotice?.('Add new request opened'))}><Plus size={16} />Add new</button>
  </div>;
}
