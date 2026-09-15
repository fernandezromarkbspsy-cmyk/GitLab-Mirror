import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function asRows(body: unknown): IncomingRow[] {
  if (Array.isArray(body)) return body as IncomingRow[];
  if (body && typeof body === 'object') {
    const value = body as { rows?: unknown; data?: unknown };
    if (Array.isArray(value.rows)) return value.rows as IncomingRow[];
    if (Array.isArray(value.data)) return value.data as IncomingRow[];
    return [body as IncomingRow];
  }
  return [];
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const expectedSecret = Deno.env.get('INTRADAY_SYNC_SECRET');
    if (!expectedSecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: missing INTRADAY_SYNC_SECRET' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (req.headers.get('x-sync-secret') !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const rows = asRows(await req.json());
    const aggregates = new Map<string, { dispatch_date: string; hour: number; order_qty: number }>();

    for (const row of rows) {
      if (row.status_desc && row.status_desc.trim() !== 'SOC_LHTransporting') continue;

      const dispatchDate = row.c_date_6am ?? row.dispatch_date ?? row.date;
      const hour = Number(row.process_hours ?? row.hour);
      const orderQty = Number(String(row.pkg_vol ?? row.order_qty ?? row.orderQty ?? 0).replaceAll(',', ''));

      if (
        typeof dispatchDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dispatchDate)
        || !Number.isInteger(hour) || hour < 0 || hour > 23
        || !Number.isFinite(orderQty) || orderQty < 0
      ) continue;

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
      return new Response(JSON.stringify({ error: 'No valid intraday rows supplied.' }), { status: 422, headers: { 'Content-Type': 'application/json' } });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { error } = await supabase.from('intraday_dispatch').upsert(normalized, { onConflict: 'dispatch_date,hour' });
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, received: rows.length, processed: normalized.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
});
