import type { CSSProperties, ReactNode } from "react";

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
};

export function Skeleton({
  width,
  height,
  radius,
  className = "",
}: SkeletonProps) {
  const style: CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(radius !== undefined ? { borderRadius: radius } : {}),
  };

  return <span className={`skeleton-line ${className}`.trim()} style={style} aria-hidden="true" />;
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Loading list">
      {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
        <div className="skeleton-list-row" key={index}>
          <Skeleton className="skeleton-avatar" width={34} height={34} radius="50%" />
          <span className="skeleton-list-copy">
            <Skeleton width={`${58 + (index % 3) * 10}%`} />
            <Skeleton width={`${38 + (index % 2) * 14}%`} className="skeleton-line--subtle" />
          </span>
          <Skeleton width={56} className="skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCardList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-card-list" role="status" aria-label="Loading cards">
      {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
        <article className="skeleton-card" key={index}>
          <Skeleton width="34%" className="skeleton-line--head" />
          <Skeleton width={`${72 - (index % 2) * 8}%`} height={18} />
          <Skeleton width="52%" className="skeleton-line--subtle" />
          <div className="skeleton-card-foot">
            <Skeleton width={72} className="skeleton-line--short" />
            <Skeleton width={48} className="skeleton-line--short" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function SkeletonStatus({ children }: { children?: ReactNode }) {
  return (
    <div className="skeleton-status" role="status" aria-live="polite">
      <span className="sr-only">{children ?? "Loading content"}</span>
    </div>
  );
}

export function SkeletonRequestTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="lh-skeleton-table" role="status" aria-label="Loading requests">
      {Array.from({ length: Math.max(1, rows) }).map((_, rowIndex) => (
        <div className="lh-table-row lh-table-grid" key={rowIndex}>
          <Skeleton width={76} className="skeleton-line--pill" />
          <Skeleton width="74%" />
          <Skeleton width="68%" />
          <Skeleton width="62%" />
          <Skeleton width={44} />
          <Skeleton width={38} />
          <Skeleton width={50} />
          <Skeleton width="62%" />
          <Skeleton width="58%" />
          <Skeleton width="66%" />
          <Skeleton width={22} className="skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}