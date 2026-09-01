import type { QueueSnapshot } from '../hooks/useQueueNotifications';
import type { User } from '../types';
export declare function OutboundRequests({ user, queue: _queue }: {
    user: User;
    queue: QueueSnapshot;
}): import("react").JSX.Element;
