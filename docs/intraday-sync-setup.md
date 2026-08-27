# Intraday Dispatch Sync

The Total Dispatch chart reads from `public.intraday_dispatch` in Supabase. A Google Apps Script reads the Workspace-owned `intraday` tab and posts normalized rows to the `sync-intraday` Supabase Edge Function.

## Supabase setup

1. Apply `supabase/migrations/010_intraday_dispatch.sql`.
2. Deploy the function:

   `supabase functions deploy sync-intraday`

3. Set a function secret:

   `supabase secrets set INTRADAY_SYNC_SECRET="replace-with-a-long-random-value"`

## Google Apps Script

Create a time-driven trigger for this function. It runs with the Workspace user's existing permission to the sheet, so the sheet does not need to be public.

```javascript
function syncIntradayDispatch() {
  const sheet = SpreadsheetApp
    .openById('1Tawt4iSUrSFcRAgCTVg_b-rWRIRByQx_nP-qpS2Yjdc')
    .getSheetByName('intraday');
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).map(row => ({
    date: Utilities.formatDate(new Date(row[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    order_qty: Number(row[3]) || 0,
    hour: Number(row[4]),
  })).filter(row => row.date && Number.isInteger(row.hour) && row.hour >= 0 && row.hour <= 23);

  UrlFetchApp.fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-intraday', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-sync-secret': 'YOUR_INTRADAY_SYNC_SECRET' },
    payload: JSON.stringify(rows),
    muteHttpExceptions: true,
  });
}
```

The script needs access to the spreadsheet and permission to call external requests. Set the trigger frequency according to the required freshness; the dashboard also polls the API every 15 seconds.
