import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_FIELDS = new Set([
  "cluster_name",
  "region",
  "dock_number",
  "backlogs",
  "backlogs_ts",
]);

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expectedSecret = Deno.env.get("CLUSTER_SYNC_SECRET");
    if (!expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Server misconfigured: missing CLUSTER_SYNC_SECRET" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (req.headers.get("x-sync-secret") !== expectedSecret) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const inputRows = Array.isArray(body) ? body : [body];

    const rows = inputRows
      .filter((row) => row && typeof row === "object")
      .map((row) => {
        const clusterName = String(row.cluster_name ?? "").trim();
        const region = String(row.region ?? "").trim();
        const dockNumber = String(row.dock_number ?? "").trim() || null;
        const rawBacklogs = row.backlogs;
        const backlogs =
          rawBacklogs === "" || rawBacklogs == null
            ? 0
            : Number(rawBacklogs);

        if (!clusterName || !region) {
          throw new Error("cluster_name and region are required");
        }

        if (!Number.isInteger(backlogs) || backlogs < 0) {
          throw new Error(`Invalid backlogs for cluster: ${clusterName}`);
        }

        const backlogsTs =
          row.backlogs_ts === "" || row.backlogs_ts == null
            ? null
            : new Date(row.backlogs_ts).toISOString();

        return {
          cluster_name: clusterName,
          // The Google Sheet has no separate hub_name column. The lookup
          // identity is therefore cluster_name for this source.
          hub_name: clusterName,
          region,
          dock_number: dockNumber,
          backlogs,
          backlogs_ts: backlogsTs,
        };
      });

    const uniqueRows = [
      ...new Map(rows.map((row) => [row.cluster_name, row])).values(),
    ];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error } = await supabase
      .from("clusters")
      .upsert(uniqueRows, {
        onConflict: "cluster_name",
        ignoreDuplicates: false,
      });

    if (error) {
      return new Response(JSON.stringify(error), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        received: inputRows.length,
        processed: uniqueRows.length,
        duplicatesRemoved: inputRows.length - uniqueRows.length,
        source: "cluster!A1:E1000",
        fields: [...ALLOWED_FIELDS],
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
