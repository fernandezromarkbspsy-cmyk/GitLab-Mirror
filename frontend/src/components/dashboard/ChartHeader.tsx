import type { ReactNode } from "react";
import {
  dashboardPanelKickerClass,
  intradayDescriptionClass,
  intradayHeadClass,
  intradayTitleClass,
} from "../../lib/uiClasses";

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
    <div className={intradayHeadClass}>
      <div>
        {kicker ? <p className={dashboardPanelKickerClass}>{kicker}</p> : null}
        <h2 className={intradayTitleClass}>{title}</h2>
        <p className={intradayDescriptionClass}>{description}</p>
      </div>
      {controls}
    </div>
  );
}
