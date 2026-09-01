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
export declare function LinehaulFilterPanel({ filters, exporting, onChange, onSort, onExport, onAddNew, onNotice }: Props): import("react").JSX.Element;
export {};
