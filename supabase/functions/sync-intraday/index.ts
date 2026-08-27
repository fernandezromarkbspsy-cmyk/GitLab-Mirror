import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type IncomingRow = {
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
    const expectedSecret = Deno.env.get('INTRADAY_SYNC_SECRET');
    if (expectedSecret && req.headers.get('x-sync-secret') !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const rows = asRows(await req.json());
    const normalized = rows.map((row) => ({
      dispatch_date: row.dispatch_date ?? row.date,
      hour: Number(row.hour),
      order_qty: Number(String(row.order_qty ?? row.orderQty ?? 0).replaceAll(',', '')),
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
