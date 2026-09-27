import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  chip: string;
  footnote: ReactNode;
  primary?: boolean;
  onClick: () => void;
};

export function MetricCard({
  label,
  value,
  icon,
  chip,
  footnote,
  primary = false,
  onClick,
}: MetricCardProps) {
  return (
    <button
      type="button"
      className="relative grid h-full min-h-[138px] min-w-0 gap-2 rounded-xl border-0 bg-white p-5 text-left text-soc5-ink shadow-none transition-colors duration-200 hover:bg-[#fbfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-soc5-lime-deep/40"
      data-primary={primary || undefined}
      onClick={onClick}
    >
      <span className="mb-1.5 flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-lg bg-[#f7ffdf] text-[#a2c500]">
          {icon}
        </span>
        <span className="hidden">{chip}</span>
      </span>
      <span className="flex min-h-0 flex-col items-start justify-center gap-1.5">
        <small className="font-[var(--font-display)] text-[15px] leading-tight font-[750] tracking-[.01em] text-[#4b4e52]">
          {label}
        </small>
        <strong className="font-mono text-[26px] leading-[1.1] font-[650] tracking-[-.45px] text-[#242528]">
          {value}
        </strong>
      </span>
      <span className="mt-2.5 flex items-center justify-between gap-1.5 text-[11px] leading-[1.35] text-soc5-muted">
        <span>{footnote}</span>
        <ArrowUpRight className="hidden" size={16} />
      </span>
    </button>
  );
}
