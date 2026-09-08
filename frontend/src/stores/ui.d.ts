import type { Role } from '../types';
interface UiState {
    sidebarOpen: boolean;
    soundEnabled: boolean;
    search: string;
    dateFrom: string;
    dateTo: string;
    viewRole: Role | null;
    setViewRole: (viewRole: Role | null) => void;
    setSearch: (search: string) => void;
    setDateRange: (dateFrom: string, dateTo: string) => void;
    resetDateRange: () => void;
    toggleSidebar: () => void;
    toggleSound: () => void;
}
export declare const useUiStore: import("zustand").UseBoundStore<import("zustand").StoreApi<UiState>>;
export {};
