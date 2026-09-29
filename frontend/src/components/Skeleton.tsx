import type { CSSProperties, ReactNode } from "react";

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  variant?: "head" | "subtle" | "short" | "pill" | "avatar";
};

const variantClasses = {
  head: "min-h-3",
  subtle: "opacity-[.72]",
  short: "max-w-[72px]",
  pill: "rounded-[99px]",
  avatar: "flex-none",
} as const;

export function Skeleton({
  width,
  height,
  radius,
  className = "",
  variant,
}: SkeletonProps) {
  const style: CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(radius !== undefined ? { borderRadius: radius } : {}),
  };

  return (
    <span
      className={`block min-h-2.5 rounded-[5px] bg-[linear-gradient(90deg,var(--color-skeleton-base)_0%,var(--color-skeleton-highlight)_48%,var(--color-skeleton-base)_100%)] bg-[length:220%_100%] animate-[skeleton-shimmer_1.8s_ease-in-out_infinite] motion-reduce:animate-none${variant ? ` ${variantClasses[variant]}` : ""}${className ? ` ${className}` : ""}`}
      style={style}
      aria-hidden="true"
    />
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="grid gap-0" role="status" aria-label="Loading list">
      {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
        <div
          className="flex min-h-[62px] items-center gap-3 border-b border-soc5-line py-2.5"
          key={index}
        >
          <Skeleton variant="avatar" width={34} height={34} radius="50%" />
          <span className="grid flex-1 gap-[7px]">
            <Skeleton width={`${58 + (index % 3) * 10}%`} />
            <Skeleton width={`${38 + (index % 2) * 14}%`} variant="subtle" />
          </span>
          <Skeleton width={56} variant="short" className="shrink-0 basis-14" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCardList({ rows = 3 }: { rows?: number }) {
  return (
    <div
      className="grid gap-3"
      role="status"
      aria-label="Loading cards"
    >
      {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
        <article
          className="grid min-h-[138px] gap-2.5 rounded-card border border-card-line bg-card-surface p-4"
          key={index}
        >
          <Skeleton width="34%" variant="head" />
          <Skeleton width={`${72 - (index % 2) * 8}%`} height={18} />
          <Skeleton width="52%" variant="subtle" />
          <div className="mt-auto flex justify-between gap-3">
            <Skeleton width={72} variant="short" />
            <Skeleton width={48} variant="short" />
          </div>
        </article>
      ))}
    </div>
  );
}

export function SkeletonStatus({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-px" role="status" aria-live="polite">
      <span className="sr-only">{children ?? "Loading content"}</span>
    </div>
  );
}

export function SkeletonRequestTable({
  rows = 5,
  columns = 11,
}: {
  rows?: number;
  columns?: number;
}) {
  const columnCount = Math.max(1, columns);
  const columnWidths = [72, 82, 58, 64, 48, 76, 55];

  return (
    <div
      className="lh-table-skeleton [&_.lh-table-row]:pointer-events-none [&_.lh-table-row>span]:self-center"
      role="status"
      aria-label="Loading requests"
    >
      {Array.from({ length: Math.max(1, rows) }).map((_, rowIndex) => (
        <div className="lh-table-row lh-table-grid lh-skeleton-row" key={rowIndex}>
          {Array.from({ length: columnCount }).map((_, columnIndex) => {
            const width = columnWidths[(rowIndex + columnIndex) % columnWidths.length];
            const isActionsColumn = columnIndex === columnCount - 1;

            return (
              <span className="lh-skeleton-cell" key={columnIndex}>
                {isActionsColumn ? (
                  <Skeleton width={20} height={20} radius={5} />
                ) : columnIndex === 0 ? (
                  <>
                    <Skeleton width={13} height={13} radius="50%" />
                    <Skeleton width={`${width}%`} height={18} variant="pill" />
                  </>
                ) : (
                  <Skeleton width={`${width}%`} height={10} />
                )}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
