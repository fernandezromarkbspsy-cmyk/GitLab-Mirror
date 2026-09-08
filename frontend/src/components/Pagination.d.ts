import type { Page } from '../types';
export declare function Pagination({ page, onPageChange }: {
    page: Page<unknown>;
    onPageChange: (page: number) => void;
}): import("react").JSX.Element | null;
