import { CalendarDays, Download, RefreshCw, Search } from 'lucide-react';
import type { RequestFilters as Filters, Status } from '../types';

export const statuses: Array<Status | 'ALL'> = ['ALL', 'PENDING', 'APPROVED', 'REJECTED_BY_MM', 'ASSIGNED', 'FOR_DOCKING', 'DOCKED', 'CONFIRMED', 'CANCELLED'];

type Props = {
  filters: Filters;
  exporting: boolean;
  statusSummary?: Array<{ value: Status | 'ALL'; count: number }>;
  hideStatusFilter?: boolean;
  onChange: (next: Filters) => void;
  onExport: () => void;
  onRefresh: () => void;
};

export function RequestFilters({ filters, exporting, statusSummary = [], hideStatusFilter = false, onChange, onExport, onRefresh }: Props) {
  function change(values: Partial<Filters>) {
    onChange({ ...filters, ...values, page: 1 });
  }

  const tabs = statusSummary.length ? statusSummary : statuses.map(value => ({ value, count: 0 }));
  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = filters.dateFrom || today;

  return <section className="request-controls" aria-label="Request filters">
    <div className="request-status-tabs" role="tablist" aria-label="Request status tabs">
      {tabs.map(tab => {
        const active = filters.status === tab.value;
        return <button key={tab.value} className={`status-tab ${active ? 'active' : ''}`} type="button" onClick={() => change({ status: tab.value as Status | 'ALL' })}>
          <span>{tab.value === 'ALL' ? 'All' : tab.value.replaceAll('_', ' ')}</span>
          <span className="status-tab-badge">{tab.count}</span>
        </button>;
      })}
    </div>
    <div className="request-toolbar">
      <label className="search-field"><Search size={16} /><input aria-label="Search requests" placeholder="Search" value={filters.search} onChange={event => change({ search: event.target.value })} /></label>
      <label className="filter-field date-field"><CalendarDays size={16} /><input type="date" value={selectedDate} onChange={event => change({ dateFrom: event.target.value, dateTo: event.target.value })} /></label>
      {!hideStatusFilter && <label className="filter-field status-filter"><span>Status</span><select value={filters.status} onChange={event => change({ status: event.target.value as Status | 'ALL' })}>{statuses.map(value => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>}
      <div className="control-actions">
        <button className="toolbar-button icon-button" type="button" title="Refresh requests" aria-label="Refresh requests" onClick={onRefresh}><RefreshCw size={16} /></button>
        <button className="toolbar-button export-button" type="button" disabled={exporting} onClick={onExport}><Download size={16} />{exporting ? 'Exporting' : 'CSV'}</button>
      </div>
    </div>
  </section>;
}
