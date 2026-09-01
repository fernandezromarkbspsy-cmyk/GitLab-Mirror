import type { ReactNode } from 'react';

type ChartHeaderProps = { kicker: string; title: string; description: string; controls: ReactNode };

export function ChartHeader({ kicker, title, description, controls }: ChartHeaderProps) {
  return <div className="intraday-head"><div><p className="panel-kicker">{kicker}</p><h2>{title}</h2><p>{description}</p></div>{controls}</div>;
}
