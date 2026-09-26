import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultRequestFilters, syncRequestSearch } from "../lib/requests";
import { useUiStore } from "../stores/ui";
import type { RequestFilters } from "../types";

type RequestFilterState = {
  filters: RequestFilters;
  appliedFilters: RequestFilters;
  setFilters: Dispatch<SetStateAction<RequestFilters>>;
  changeFilters: (next: RequestFilters) => void;
  updateSearch: (search: string) => void;
};

export function useRequestFilters(): RequestFilterState {
  const globalSearch = useUiStore((state) => state.search);
  const setGlobalSearch = useUiStore((state) => state.setSearch);
  const [filters, setFilters] = useState<RequestFilters>(() => ({
    ...defaultRequestFilters,
    search: globalSearch,
  }));
  const deferredSearch = useDeferredValue(filters.search);

  useEffect(() => {
    setFilters((current) => syncRequestSearch(current, globalSearch));
  }, [globalSearch]);

  const changeFilters = useCallback(
    (next: RequestFilters) => {
      setFilters(next);
      if (next.search !== globalSearch) setGlobalSearch(next.search);
    },
    [globalSearch, setGlobalSearch],
  );

  const updateSearch = useCallback(
    (search: string) => {
      setFilters((current) => syncRequestSearch(current, search));
      if (search !== globalSearch) setGlobalSearch(search);
    },
    [globalSearch, setGlobalSearch],
  );

  const appliedFilters = useMemo(
    () => ({ ...filters, search: deferredSearch }),
    [deferredSearch, filters],
  );

  return { filters, appliedFilters, setFilters, changeFilters, updateSearch };
}
