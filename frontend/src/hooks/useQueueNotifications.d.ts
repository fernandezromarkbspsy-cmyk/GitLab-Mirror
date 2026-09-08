import type { Status, TruckRequest, User } from '../types';
export type QueueSnapshot = {
    status: Status | null;
    rows: TruckRequest[];
    alerts: TruckRequest[];
    count: number;
    isPending: boolean;
    error: Error | null;
    refetch: () => void;
    acknowledge: (id: string) => void;
};
export declare function useQueueNotifications(user: User): QueueSnapshot;
