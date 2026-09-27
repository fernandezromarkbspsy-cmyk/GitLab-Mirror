import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { buildIdempotencyHeaders } from "../lib/idempotency";
import { requestQueryString, type RequestPayload } from "../lib/requests";
import { useRequestFilters } from "./useRequestFilters";
import type { Page, RequestSort, TruckRequest } from "../types";

export function useOutboundRequests() {
  const queryClient = useQueryClient();
  const { filters, appliedFilters, setFilters, changeFilters, updateSearch } =
    useRequestFilters();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TruckRequest | null>(null);
  const [toast, setToast] = useState("");
  const requests = useQuery({
    queryKey: ["requests", "outbound-all", appliedFilters],
    queryFn: () =>
      api<Page<TruckRequest>>(
        `/requests?${requestQueryString(appliedFilters)}`,
      ),
    placeholderData: (previous) => previous,
  });
  const rows = useMemo(() => requests.data?.data ?? [], [requests.data]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };
  async function refreshData(message: string) {
    showToast(message);
    await queryClient.invalidateQueries({ queryKey: ["requests"] });
  }

  const createRequest = useMutation({
    mutationFn: (payload: RequestPayload) =>
      api<TruckRequest>("/requests", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: buildIdempotencyHeaders("outbound-create", payload),
      }),
    onSuccess: async () => {
      setCreating(false);
      await refreshData("LH request created.");
    },
  });
  const updateRequest = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RequestPayload }) =>
      api<TruckRequest>(`/requests/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: buildIdempotencyHeaders("outbound-update", { id, payload }),
      }),
    onSuccess: async () => {
      setEditing(null);
      await refreshData("LH request updated.");
    },
  });
  const approveRequests = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length > 2) {
        return api<{ data: TruckRequest[] }>("/requests/bulk-approve", {
          method: "POST",
          body: JSON.stringify({ ids }),
        });
      }

      return Promise.all(
        ids.map((id) =>
          api<TruckRequest>(`/requests/${id}/approve`, {
            method: "POST",
            body: JSON.stringify({}),
            headers: buildIdempotencyHeaders("outbound-approve", { id }),
          }),
        ),
      );
    },
    onSuccess: async (_, ids) => {
      await refreshData(
        ids.length > 2
          ? `${ids.length} LH requests bulk approved.`
          : `${ids.length} LH request${ids.length === 1 ? "" : "s"} approved.`,
      );
    },
  });

  function sortBy(sort: RequestSort) {
    setFilters((current) => ({
      ...current,
      sort,
      direction:
        current.sort === sort && current.direction === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }

  return {
    filters,
    setFilters,
    changeFilters,
    requests,
    rows,
    creating,
    setCreating,
    editing,
    setEditing,
    toast,
    showToast,
    createRequest,
    updateRequest,
    approveRequests,
    updateSearch,
    sortBy,
  };
}
