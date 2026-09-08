import type { AppView } from "../types";

const paths: Record<AppView, string> = {
  overview: "/dashboard",
  "lh-request": "/outbound/lh-request",
  "truck-request": "/midmile/truck-request",
  docking: "/docking",
  kpi: "/kpi",
  users: "/users",
};

const viewsByPath = Object.fromEntries(
  Object.entries(paths).map(([view, path]) => [path, view]),
) as Record<string, AppView>;

export function getAppPath(view: AppView): string {
  return paths[view];
}

export function getAppView(pathname: string): AppView {
  return viewsByPath[pathname] ?? "overview";
}
