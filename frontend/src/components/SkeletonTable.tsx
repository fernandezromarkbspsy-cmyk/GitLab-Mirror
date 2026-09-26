import { Skeleton } from "./Skeleton";

type Props = {
  columns: number;
  rows?: number;
  compact?: boolean;
};

export function SkeletonTable({ columns, rows = 5, compact = false }: Props) {
  const columnCount = Math.max(1, columns);
  const rowCount = Math.max(1, rows);
  return (
    <div
      className={`skeleton-table${compact ? " compact" : ""}`}
      role="status"
      aria-label="Loading table"
      style={{ ["--skeleton-cols" as string]: columnCount }}
    >
      <div className="skeleton-table-head">
        {Array.from({ length: columnCount }).map((_, index) => (
          <Skeleton key={index} variant="head" />
        ))}
      </div>
      <div className="skeleton-table-body">
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columnCount }).map((__, columnIndex) => (
              <Skeleton
                key={columnIndex}
                variant={
                  columnIndex === 0
                    ? "pill"
                    : columnIndex === columnCount - 1
                      ? "short"
                      : undefined
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
