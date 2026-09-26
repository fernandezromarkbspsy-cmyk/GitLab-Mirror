import { useQuery } from "@tanstack/react-query";
import { Save, X } from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  buildRequestPayload,
  type RequestPayload,
} from "../lib/requests";
import { api } from "../lib/api";
import type { ClusterLookup, TruckRequest } from "../types";

export function InlineCreateRow({
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (payload: RequestPayload) => void;
}) {
  const [clusterText, setClusterText] = useState("");
  const [selected, setSelected] = useState<ClusterLookup | null>(null);
  const [debouncedClusterSearch, setDebouncedClusterSearch] = useState("");
  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedClusterSearch(clusterText.trim()),
      250,
    );
    return () => window.clearTimeout(timeoutId);
  }, [clusterText]);
  const clusterSearch = debouncedClusterSearch;
  const searchIsCurrent = clusterSearch === clusterText.trim();
  const lookup = useQuery({
    queryKey: ["clusters", clusterSearch],
    queryFn: () =>
      api<{ data: ClusterLookup[] }>(
        `/clusters?search=${encodeURIComponent(clusterSearch)}`,
      ),
    enabled: clusterSearch.trim().length >= 3,
  });

  function pick(cluster: ClusterLookup) {
    setSelected(cluster);
    setClusterText(cluster.cluster_name);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(buildRequestPayload(new FormData(event.currentTarget)));
  }

  return (
    <form className="inline-create-row" onSubmit={submit}>
      <label className="cluster-lookup-field">
        Cluster
        <input
          name="cluster"
          required
          maxLength={120}
          value={clusterText}
          onChange={(event) => {
            setClusterText(event.target.value);
            setSelected(null);
          }}
          placeholder="Type 3 chars"
        />
        {searchIsCurrent &&
          clusterSearch.length >= 3 &&
          lookup.isFetching &&
          !lookup.data && (
            <div className="cluster-suggestions">
              <p>Searching...</p>
            </div>
          )}
        {searchIsCurrent && lookup.isError && (
          <div className="cluster-suggestions">
            <p>Unable to load clusters.</p>
          </div>
        )}
        {searchIsCurrent && lookup.data && !selected && !lookup.isFetching && (
          <div className="cluster-suggestions">
            {lookup.data.data.length ? (
              lookup.data.data.map((cluster) => (
                <button
                  key={cluster.id}
                  type="button"
                  onClick={() => pick(cluster)}
                >
                  <strong>{cluster.cluster_name}</strong>
                  <span>
                    Dock {cluster.dock_number} / {cluster.region}
                  </span>
                </button>
              ))
            ) : (
              <p>No cluster found.</p>
            )}
          </div>
        )}
      </label>
      <label>
        Region
        <input name="region" required readOnly value={selected?.region ?? ""} />
      </label>
      <label>
        Dock No
        <input
          name="dock_no"
          required
          maxLength={50}
          defaultValue={selected?.dock_number ?? ""}
          key={selected?.id ?? "dock"}
        />
      </label>
      <label>
        Backlogs
        <input
          name="backlogs"
          type="number"
          required
          readOnly
          min={0}
          value={selected?.backlogs ?? 0}
        />
      </label>
      <label>
        Backlogs Timestamp
        <input
          readOnly
          value={
            selected?.backlogs_ts
              ? new Date(selected.backlogs_ts).toLocaleString()
              : ""
          }
        />
        <input
          type="hidden"
          name="backlogs_timestamp"
          value={selected?.backlogs_ts ?? ""}
        />
      </label>
      <label>
        Truck Size
        <select name="truck_size" defaultValue="6W">
          <option>4W</option>
          <option>6W</option>
          <option>10W</option>
          <option>6WF</option>
        </select>
      </label>
      {error && <p className="error notice">{error}</p>}
      <div className="inline-create-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          <X size={15} />
          Cancel
        </button>
        <button type="submit" disabled={busy || !selected}>
          <Save size={15} />
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export function InlineEditRow({
  request,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  request: TruckRequest;
  busy: boolean;
  error?: string;
  onCancel: () => void;
  onSubmit: (payload: RequestPayload) => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(buildRequestPayload(new FormData(event.currentTarget)));
  }

  return (
    <form className="inline-create-row" onSubmit={submit}>
      <label>
        Cluster
        <input
          name="cluster"
          required
          maxLength={120}
          defaultValue={request.cluster}
        />
      </label>
      <label>
        Region
        <input
          name="region"
          required
          maxLength={120}
          defaultValue={request.region}
        />
      </label>
      <label>
        Dock No
        <input
          name="dock_no"
          required
          maxLength={50}
          defaultValue={request.dock_no}
        />
      </label>
      <label>
        Backlogs
        <input
          name="backlogs"
          type="number"
          required
          min={0}
          defaultValue={request.backlogs}
        />
      </label>
      <label>
        Truck Size
        <select name="truck_size" defaultValue={request.truck_size}>
          <option>4W</option>
          <option>6W</option>
          <option>10W</option>
          <option>6WF</option>
        </select>
      </label>
      <label>
        Truck Type
        <select name="truck_type" defaultValue={request.truck_type}>
          <option>WETLEASE</option>
          <option>DRYLEASE</option>
        </select>
      </label>
      {error && <p className="error notice">{error}</p>}
      <div className="inline-create-actions">
        <button className="secondary-button" type="button" onClick={onCancel}>
          <X size={15} />
          Cancel
        </button>
        <button type="submit" disabled={busy}>
          <Save size={15} />
          {busy ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}