import type { ReactNode } from "react";

type PanelProps = {
  kicker: string;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Panel({
  kicker,
  title,
  description,
  action,
  className = "",
  children,
}: PanelProps) {
  return (
    <article className={`panel${className ? ` ${className}` : ""}`}>
      <div className="panel-head">
        <div>
          <p className="panel-kicker">{kicker}</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </div>
      <div className="panel-body">{children}</div>
    </article>
  );
}
