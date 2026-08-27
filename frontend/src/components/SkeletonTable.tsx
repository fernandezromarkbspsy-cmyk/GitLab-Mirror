type Props = {
  columns: number;
  rows?: number;
  compact?: boolean;
};

export function SkeletonTable({ columns, rows = 5, compact = false }: Props) {
  const columnCount = Math.max(1, columns);
  const rowCount = Math.max(1, rows);
  return <div className={`skeleton-table${compact ? ' compact' : ''}`} aria-hidden="true" style={{ ['--skeleton-cols' as string]: columnCount }}>
    <div className="skeleton-table-head">{Array.from({ length: columnCount }).map((_, index) => <span key={index} className="skeleton-line skeleton-line--head" />)}</div>
    <div className="skeleton-table-body">{Array.from({ length: rowCount }).map((_, rowIndex) => <div key={rowIndex} className="skeleton-table-row">{Array.from({ length: columnCount }).map((__, columnIndex) => <span key={columnIndex} className={`skeleton-line${columnIndex === 0 ? ' skeleton-line--pill' : ''}${columnIndex === columnCount - 1 ? ' skeleton-line--short' : ''}`} />)}</div>)}</div>
  </div>;
}
