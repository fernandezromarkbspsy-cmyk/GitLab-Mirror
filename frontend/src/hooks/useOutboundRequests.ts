import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { buildIdempotencyHeaders } from "../lib/idempotency";
import {
  defaultRequestFilters,
  requestQueryString,
  type RequestPayload,
} from "../lib/requests";
import { useUiStore } from "../stores/ui";
import type {
  Page,
  RequestFilters,
  RequestSort,
  TruckRequest,
} from "../types";

export function useOutboundRequests() {
  const queryClient = useQueryClient();
  const globalSearch = useUiStore((state) => state.search);
  const setGlobalSearch = useUiStore((state) => state.setSearch);
  const [filters, setFilters] = useState<RequestFilters>(() => ({
    ...defaultRequestFilters,
    search: globalSearch,
  }));
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<TruckRequest | null>(null);
  const [toast, setToast] = useState("");
  const requests = useQuery({
    queryKey: ["requests", "outbound-all", filters],
    queryFn: () =>
      api<Page<TruckRequest>>(`/requests?${requestQueryString(filters)}`),
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

  function updateSearch(value: string) {
    setFilters((current) => ({ ...current, search: value, page: 1 }));
    setGlobalSearch(value);
  }
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
    updateSearch,
    sortBy,
  };
}