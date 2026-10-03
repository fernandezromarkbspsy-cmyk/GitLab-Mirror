export const REQUEST_REFRESH_INTERVAL_MS = 30_000;

export type RequestRefreshReason = "manual" | "mutation" | "scheduled";

export function getRequestRefetchInterval(
  visibilityState: DocumentVisibilityState =
    typeof document === "undefined" ? "visible" : document.visibilityState,
) {
  return visibilityState === "visible" ? REQUEST_REFRESH_INTERVAL_MS : false;
}

export function requestQueryKey(scope: string) {
  return ["requests", scope] as const;
}
