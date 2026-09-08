import { api } from './api';
export const defaultRequestFilters = {
    status: 'ALL',
    search: '',
    dateFrom: '',
    dateTo: '',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
    perPage: 20,
};
export function requestQueryString(filters, overrides = {}) {
    const value = { ...filters, ...overrides };
    const params = new URLSearchParams({
        page: String(value.page),
        per_page: String(value.perPage),
        sort: value.sort,
        direction: value.direction,
    });
    if (value.status !== 'ALL')
        params.set('status', value.status);
    if (value.search.trim())
        params.set('search', value.search.trim());
    if (value.dateFrom)
        params.set('date_from', value.dateFrom);
    if (value.dateTo)
        params.set('date_to', value.dateTo);
    return params.toString();
}
export function requestMetricsQueryString(filters) {
    const params = new URLSearchParams();
    if (filters.search.trim())
        params.set('search', filters.search.trim());
    if (filters.dateFrom)
        params.set('date_from', filters.dateFrom);
    if (filters.dateTo)
        params.set('date_to', filters.dateTo);
    return params.toString();
}
export async function exportRequestsCsv(filters, filename) {
    const all = [];
    let page = 1;
    let lastPage = 1;
    do {
        const result = await api(`/requests?${requestQueryString(filters, { page, perPage: 100 })}`);
        all.push(...result.data);
        lastPage = result.last_page;
        page += 1;
    } while (page <= lastPage);
    const columns = [
        ['Request ID', request => request.id],
        ['Created', request => request.created_at],
        ['Cluster', request => request.cluster],
        ['Region', request => request.region],
        ['Dock', request => request.dock_no],
        ['Backlogs', request => request.backlogs],
        ['Truck Size', request => request.truck_size],
        ['Truck Type', request => request.truck_type],
        ['Plate Number', request => request.plate_number ?? ''],
        ['Status', request => request.status],
        ['Provide Time', request => request.provide_time ?? ''],
        ['Rejection Remarks', request => request.rejection_remarks ?? ''],
    ];
    const escape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.map(([label]) => escape(label)).join(','), ...all.map(request => columns.map(([, read]) => escape(read(request))).join(','))].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
