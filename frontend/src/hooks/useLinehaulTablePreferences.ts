import { useEffect, useState } from "react";

export type TableDensity = "comfortable" | "compact";

type StoredPreferences = {
  columns?: unknown;
  density?: unknown;
};

export function useLinehaulTablePreferences(
  scope: string,
  availableColumns: readonly string[],
  defaultColumns: readonly string[],
) {
  const storageKey = `soc5:linehaul-table:${scope}`;
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() =>
    readColumns(storageKey, availableColumns, defaultColumns),
  );
  const [density, setDensity] = useState<TableDensity>(() =>
    readDensity(storageKey),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({ columns: visibleColumns, density }),
      );
    } catch {
      // Preferences are best-effort and should not block table usage.
    }
  }, [density, storageKey, visibleColumns]);

  function updateColumns(next: string[]) {
    const valid = next.filter((column) => availableColumns.includes(column));
    setVisibleColumns(valid.length ? valid : [defaultColumns[0]]);
  }

  return { visibleColumns, updateColumns, density, setDensity };
}

function readStoredPreferences(storageKey: string): StoredPreferences | null {
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredPreferences) : null;
  } catch {
    return null;
  }
}

function readColumns(
  storageKey: string,
  availableColumns: readonly string[],
  defaultColumns: readonly string[],
) {
  const stored = readStoredPreferences(storageKey)?.columns;
  if (!Array.isArray(stored)) return [...defaultColumns];
  const valid = stored.filter(
    (column): column is string =>
      typeof column === "string" && availableColumns.includes(column),
  );
  return valid.length ? valid : [...defaultColumns];
}

function readDensity(storageKey: string): TableDensity {
  return readStoredPreferences(storageKey)?.density === "compact"
    ? "compact"
    : "comfortable";
}
