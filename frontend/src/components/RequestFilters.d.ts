import type { RequestFilters as Filters, Status } from '../types';
export declare const statuses: Array<Status | 'ALL'>;
type Props = {
    filters: Filters;
    exporting: boolean;
    statusSummary?: Array<{
        value: Status | 'ALL';
        count: number;
    }>;
    hideStatusFilter?: boolean;
    onChange: (next: Filters) => void;
    onExport: () => void;
    onRefresh: () => void;
};
export declare function RequestFilters({ filters, exporting, statusSummary, hideStatusFilter, onChange, onExport, onRefresh }: Props): import("react").JSX.Element;
export {};
