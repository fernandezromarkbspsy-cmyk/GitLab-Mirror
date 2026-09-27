import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { api } from "../lib/api";

type Summary = {
  total: number;
  confirmed: number;
  cancelled: number;
  averageApprovalMinutes: number | null;
};
type Daily = {
  data: Array<{ date: string; total: number; confirmed: number }>;
};
export function Kpi() {
  const summary = useQuery({
    queryKey: ["kpi", "summary"],
    queryFn: () => api<Summary>("/kpi/summary"),
  });
  const daily = useQuery({
    queryKey: ["kpi", "daily"],
    queryFn: () => api<Daily>("/kpi/daily"),
  });
  const max = Math.max(1, ...(daily.data?.data ?? []).map((row) => row.total));
  const cards = [
    {
      label: "Total requests",
      value: summary.data?.total,
      icon: BarChart3,
      tone: "bg-soc5-page text-soc5-muted",
    },
    {
      label: "Confirmed",
      value: summary.data?.confirmed,
      icon: CheckCircle2,
      tone: "bg-status-success-surface text-status-success-ink",
    },
    {
      label: "Cancelled",
      value: summary.data?.cancelled,
      icon: XCircle,
      tone: "bg-status-danger-surface text-status-danger-ink",
    },
    {
      label: "Avg. approval",
      value:
        summary.data?.averageApprovalMinutes == null
          ? undefined
          : `${Math.round(summary.data.averageApprovalMinutes)}m`,
      icon: Clock3,
      tone: "bg-status-info-surface text-status-info-ink",
    },
  ];

  return (
    <div className="min-h-full bg-soc5-page p-4 sm:p-6 lg:p-8">
      <section className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(min(100%,16rem),1fr))] gap-4">
        {cards.map(({ label, value, icon: Icon, tone }) => (
          <article
            className="flex min-h-32 items-center gap-4 rounded-card border border-card-line bg-card-surface p-5 shadow-card"
            key={label}
          >
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${tone}`}
            >
              <Icon className="size-5" />
            </div>
            <div className="grid gap-1">
              <span className="text-sm font-semibold text-soc5-muted">
                {label}
              </span>
              <strong className="text-2xl font-bold tracking-tight text-soc5-ink">
                {value ?? "-"}
              </strong>
            </div>
          </article>
        ))}
      </section>
      <section className="rounded-card border border-card-line bg-card-surface p-5 shadow-card">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-card-heading">
              Daily volume
            </h2>
            <p className="mt-1 text-sm text-soc5-muted">Last 30 days</p>
          </div>
        </div>
        <div className="flex min-h-56 items-end gap-2 overflow-x-auto pb-2">
          {(daily.data?.data ?? []).map((row) => (
            <div
              className="grid min-w-7 flex-1 justify-items-center gap-2"
              key={row.date}
            >
              <span
                className="w-full max-w-8 rounded-t bg-soc5-lime-deep/80"
                style={{ height: `${Math.max(4, (row.total / max) * 180)}px` }}
                title={`${row.date}: ${row.total}`}
              />
              <small className="text-[10px] whitespace-nowrap text-soc5-muted">
                {new Date(row.date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
