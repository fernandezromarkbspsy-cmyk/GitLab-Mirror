import type { ReactNode } from "react";
import { compactEmptyClass, dashboardListClass } from "../../lib/uiClasses";

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
    <div className={`${dashboardListClass}${className ? ` ${className}` : ""}`}>
      {items.length ? (
        items.map(renderItem)
      ) : (
        <p className={compactEmptyClass}>{emptyMessage}</p>
      )}
    </div>
  );
}
