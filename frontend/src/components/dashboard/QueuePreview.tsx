import type { ReactNode } from "react";

type QueuePreviewProps<Item> = {
  items: Item[];
  emptyMessage: string;
  renderItem: (item: Item) => ReactNode;
  className?: string;
};

export function QueuePreview<Item>({
  items,
  emptyMessage,
  renderItem,
  className = "",
}: QueuePreviewProps<Item>) {
  return (
    <div className={`dashboard-list${className ? ` ${className}` : ""}`}>
      {items.length ? (
        items.map(renderItem)
      ) : (
        <p className="compact-empty">{emptyMessage}</p>
      )}
    </div>
  );
}
