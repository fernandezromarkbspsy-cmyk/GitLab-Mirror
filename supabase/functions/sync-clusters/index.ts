import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.116.0";

const ALLOWED_FIELDS = new Set(["cluster_name", "region", "dock_number", "backlogs", "backlogs_ts"]);
const ALLOWED_SYNC_SOURCES = new Set(["google-apps-script"]);
const MAX_BODY_BYTES = 1_000_000;
const MAX_ROWS = 1_000;

type ClusterRow = {
  cluster_name: string;
  hub_name: string;
  region: string;
  dock_number: string | null;
  backlogs: number;
  backlogs_ts: string | null;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

async function readBody(req: Request): Promise<unknown> {
  const reader = req.body?.getReader();
  if (!reader) return JSON.parse("null");

  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = value ?? new Uint8Array();
      total += chunk.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new Error("PAYLOAD_TOO_LARGE");
      }

      chunks.push(chunk);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") throw error;
    await reader.cancel();
    throw error;
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const text = new TextDecoder().decode(combined);
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) throw new Error("PAYLOAD_TOO_LARGE");
  return JSON.parse(text);
}

export async function handleRequest(req: Request): Promise<Response> {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const syncSource = (req.headers.get("x-sync-source") ?? "").trim().toLowerCase();
    if (!ALLOWED_SYNC_SOURCES.has(syncSource)) return json({ error: "Forbidden: unknown sync source" }, 403);
    const expectedSecret = Deno.env.get("CLUSTER_SYNC_SECRET")?.trim();
    if (!expectedSecret) return json({ error: "Server misconfigured" }, 500);
    if ((req.headers.get("x-sync-secret") ?? "").trim() !== expectedSecret) return json({ error: "Unauthorized" }, 401);

    const body = await readBody(req);
    const inputRows = Array.isArray(body) ? body : [body];
    if (inputRows.length > MAX_ROWS) return json({ error: "Too many rows supplied." }, 413);

    let rejected = 0;
    const rows: ClusterRow[] = [];
    for (const input of inputRows) {
      try {
        if (!input || typeof input !== "object") throw new Error("invalid row");
        const row = input as Record<string, unknown>;
        const clusterName = String(row.cluster_name ?? "").trim();
        const region = String(row.region ?? "").trim();
        const rawBacklogs = row.backlogs;
        const backlogs = rawBacklogs === "" || rawBacklogs == null ? 0 : Number(rawBacklogs);
        if (!clusterName || !region || !Number.isInteger(backlogs) || backlogs < 0) throw new Error("invalid row");
        const rawTimestamp = row.backlogs_ts;
        const backlogsTs = rawTimestamp === "" || rawTimestamp == null ? null : new Date(String(rawTimestamp)).toISOString();
        rows.push({
          cluster_name: clusterName,
          hub_name: clusterName,
          region,
          dock_number: String(row.dock_number ?? "").trim() || null,
          backlogs,
          backlogs_ts: backlogsTs,
        });
      } catch {
        rejected++;
      }
    }

    const uniqueRows = [...new Map(rows.map((row) => [row.cluster_name, row])).values()];
    if (!uniqueRows.length) return json({ error: "No valid cluster rows supplied.", received: inputRows.length, rejected }, 422);
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
    if (!serviceRoleKey || !supabaseUrl) return json({ error: "Server misconfigured" }, 500);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from("clusters").upsert(uniqueRows, { onConflict: "cluster_name", ignoreDuplicates: false });
    if (error) {
      console.error("Cluster sync database write failed", error);
      return json({ error: "Unable to persist cluster data." }, 502);
    }

    return json({
      success: true,
      received: inputRows.length,
      processed: uniqueRows.length,
      rejected,
      duplicatesRemoved: rows.length - uniqueRows.length,
      source: "cluster!A1:E1000",
      fields: [...ALLOWED_FIELDS],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return json({ error: "Payload too large." }, 413);
    console.error("Cluster sync request failed", error);
    return json({ error: "Unable to process cluster sync request." }, 400);
  }
}

if (import.meta.main) {
  serve(handleRequest);
}
