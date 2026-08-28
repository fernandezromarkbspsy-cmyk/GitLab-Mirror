import type { ReactNode } from 'react';
type QueuePreviewProps<Item> = {
    items: Item[];
    emptyMessage: string;
    renderItem: (item: Item) => ReactNode;
    className?: string;
};
export declare function QueuePreview<Item>({ items, emptyMessage, renderItem, className }: QueuePreviewProps<Item>): import("react").JSX.Element;
export {};
