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
      className={`metric-card${primary ? " metric-card--primary" : ""}`}
      onClick={onClick}
    >
      <span className="metric-card-top">
        <span className="metric-icon">{icon}</span>
        <span className="metric-chip">{chip}</span>
      </span>
      <span className="metric-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
      <span className="metric-foot">
        <span>{footnote}</span>
        <ArrowUpRight size={16} />
      </span>
    </button>
  );
}
