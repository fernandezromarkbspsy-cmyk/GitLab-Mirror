import type { ReactNode } from "react";

type ChartHeaderProps = {
  kicker?: string;
  title: string;
  description: ReactNode;
  controls: ReactNode;
};

export function ChartHeader({
  kicker,
  title,
  description,
  controls,
}: ChartHeaderProps) {
  return (
    <div className="intraday-head">
      <div>
        {kicker ? <p className="panel-kicker">{kicker}</p> : null}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {controls}
    </div>
  );
}
