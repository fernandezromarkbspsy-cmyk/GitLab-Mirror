import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.116.0";

const ALLOWED_SYNC_SOURCES = new Set(["google-apps-script"]);
const MAX_BODY_BYTES = 1_000_000;
const MAX_ROWS = 1_000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

type IncomingRow = {
  status_desc?: string;
  c_date_6am?: string;
  pkg_vol?: number | string;
  process_hours?: number | string;
  date?: string;
  dispatch_date?: string;
  hour?: number | string;
  order_qty?: number | string;
  orderQty?: number | string;
};

function asRows(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === 'object') {
    const value = body as { rows?: unknown; data?: unknown };
    if (Array.isArray(value.rows)) return value.rows;
    if (Array.isArray(value.data)) return value.data;
    return [body];
  }
  return [];
}

export async function handleRequest(req: Request): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return json({ error: "Method not allowed" }, 405);
    }

    const syncSource = (req.headers.get('x-sync-source') ?? '').trim().toLowerCase();
    if (!syncSource || !ALLOWED_SYNC_SOURCES.has(syncSource)) {
      return json({ error: "Forbidden: unknown sync source" }, 403);
    }

    const expectedSecret = Deno.env.get('INTRADAY_SYNC_SECRET')?.trim();
    if (!expectedSecret) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const providedSecret = (req.headers.get('x-sync-secret') ?? '').trim();
    if (providedSecret !== expectedSecret) {
      return json({ error: "Unauthorized" }, 401);
    }

    const rows = asRows(await readBody(req));
    if (rows.length > MAX_ROWS) return json({ error: "Too many rows supplied." }, 413);
    const aggregates = new Map<string, { dispatch_date: string; hour: number; order_qty: number }>();
    let rejected = 0;

    for (const input of rows) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) {
        rejected++;
        continue;
      }
      const row = input as IncomingRow;
      if (row.status_desc !== undefined && typeof row.status_desc !== 'string') {
        rejected++;
        continue;
      }
      if (row.status_desc && row.status_desc.trim() !== 'SOC_LHTransporting') continue;

      const dispatchDate = row.c_date_6am ?? row.dispatch_date ?? row.date;
      const hour = Number(row.process_hours ?? row.hour);
      const orderQty = Number(String(row.pkg_vol ?? row.order_qty ?? row.orderQty ?? 0).replaceAll(',', ''));

      if (
        typeof dispatchDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dispatchDate)
        || !Number.isInteger(hour) || hour < 0 || hour > 23
        || !Number.isFinite(orderQty) || orderQty < 0
      ) {
        rejected++;
        continue;
      }

      const key = `${dispatchDate}:${hour}`;
      const current = aggregates.get(key);
      if (current) current.order_qty += orderQty;
      else aggregates.set(key, { dispatch_date: dispatchDate, hour, order_qty: orderQty });
    }

    const normalized = Array.from(aggregates.values()).map((row) => ({
      ...row,
      synced_at: new Date().toISOString(),
    })).filter((row) => (
      typeof row.dispatch_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.dispatch_date)
      && Number.isInteger(row.hour) && row.hour >= 0 && row.hour <= 23
      && Number.isFinite(row.order_qty) && row.order_qty >= 0
    ));

    if (!normalized.length) {
      return json({ error: "No valid intraday rows supplied.", received: rows.length, rejected }, 422);
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
    const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim();
    if (!serviceRoleKey || !supabaseUrl) return json({ error: "Server misconfigured" }, 500);
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from('intraday_dispatch').upsert(normalized, { onConflict: 'dispatch_date,hour' });
    if (error) {
      console.error("Intraday sync database write failed", error);
      return json({ error: "Unable to persist intraday dispatch data." }, 502);
    }

    return json({ success: true, received: rows.length, processed: normalized.length, rejected });
  } catch (error) {
    if (error instanceof Error && error.message === "PAYLOAD_TOO_LARGE") return json({ error: "Payload too large." }, 413);
    console.error("Intraday sync request failed", error);
    return json({ error: "Unable to process intraday sync request." }, 400);
  }
}

if (import.meta.main) {
  serve(handleRequest);
}
