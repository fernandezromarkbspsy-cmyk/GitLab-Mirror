# Intraday Dispatch Sync

The Total Dispatch chart reads from `public.intraday_dispatch` in Supabase. A Google Apps Script reads the Workspace-owned `intraday` tab and posts normalized rows to the `sync-intraday` Supabase Edge Function.

## Supabase setup

1. Apply `supabase/migrations/010_intraday_dispatch.sql`.
2. Deploy the function:

   `supabase functions deploy sync-intraday`

3. Set a function secret:

  `supabase secrets set SYNC_SECRET="replace-with-a-long-random-value"`

## Google Apps Script

Create these Apps Script **Script Properties** before installing the trigger:

- `SPREADSHEET_ID`: the source spreadsheet ID.
- `SHEET_NAME`: the source tab name, normally `intraday`.
- `SYNC_URL`: the complete deployed `sync-intraday` Edge Function URL.
- `SYNC_SECRET`: the same shared secret configured in Supabase and the cluster Apps Script project.

Create a time-driven trigger for this function. It runs with the Workspace user's existing permission to the sheet, so the sheet does not need to be public and deployment-specific values do not need to be embedded in source.

```javascript
function syncIntradayDispatch() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = requiredProperty(properties, 'SPREADSHEET_ID');
  const sheetName = requiredProperty(properties, 'SHEET_NAME');
  const syncUrl = requiredProperty(properties, 'SYNC_URL');
  const syncSecret = requiredProperty(properties, 'SYNC_SECRET');
  const sheet = SpreadsheetApp
    .openById(spreadsheetId)
    .getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1).map(row => ({
    date: Utilities.formatDate(new Date(row[2]), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    order_qty: Number(row[3]) || 0,
    hour: Number(row[4]),
  })).filter(row => row.date && Number.isInteger(row.hour) && row.hour >= 0 && row.hour <= 23);

  const response = UrlFetchApp.fetch(syncUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-sync-source': 'google-apps-script',
      'x-sync-secret': syncSecret,
    },
    payload: JSON.stringify(rows),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) {
    throw new Error(`Intraday sync failed (${response.getResponseCode()}): ${response.getContentText()}`);
  }
}

function requiredProperty(properties, name) {
  const value = properties.getProperty(name);
  if (!value) throw new Error(`Missing Script Property: ${name}`);
  return value;
}
```

The script needs access to the spreadsheet and permission to call external requests. Set the trigger frequency according to the required freshness; the dashboard also polls the API every 15 seconds.

To rotate the shared sync secret, update `SYNC_SECRET` in Supabase and in both Apps Script projects, then run `syncIntradayDispatch` and `syncClusters` manually to verify both paths. The shared value authorizes writes through both functions, so rotate it everywhere together. Never place the secret in script source or logs.
