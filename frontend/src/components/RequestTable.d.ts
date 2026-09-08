import { type ReactNode } from 'react';
import type { RequestSort, SortDirection, TruckRequest } from '../types';
type Props = {
    rows: TruckRequest[];
    actions?: (request: TruckRequest) => ReactNode;
    emptyMessage?: string;
    emptyAction?: ReactNode;
    sort?: RequestSort;
    direction?: SortDirection;
    onSort?: (sort: RequestSort) => void;
    visibleColumns?: string[];
};
export declare function RequestTable({ rows, actions, emptyMessage, emptyAction, sort, direction, onSort, visibleColumns }: Props): import("react").JSX.Element;
export {};
