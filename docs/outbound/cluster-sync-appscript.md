# Google Sheet → Supabase cluster lookup sync

Source range: `cluster!A1:E1000`

Columns:

1. `cluster_name`
2. `region`
3. `dock_number`
4. `backlogs`
5. `backlogs_ts`

The sheet does not contain a separate `hub_name` column, so the sync function derives `hub_name` from `cluster_name`. `cluster_name` is the unique upsert identity used by `sync-clusters`.

After the cluster rows are upserted, the database trigger
`sync_cluster_backlogs_to_requests` propagates `backlogs` and `backlogs_ts` to
matching `public.requests` rows using `requests.cluster = cluster_name`. It
updates only those two backlog fields; request status and workflow fields are
preserved.

## Apps Script

Set these values in Apps Script **Script Properties**. Use the same `SYNC_SECRET` value as the intraday sync project and Supabase function secret.

- `SPREADSHEET_ID`: the source spreadsheet ID.
- `SHEET_NAME`: `cluster`.
- `SYNC_URL`: the complete deployed Edge Function URL, ending in `/functions/v1/sync-clusters`.
- `SYNC_SECRET`: the shared secret configured in Supabase.

```javascript
const SOURCE_RANGE = 'A1:E1000';

function syncClusters() {
  const properties = PropertiesService.getScriptProperties();
  const spreadsheetId = requiredProperty(properties, 'SPREADSHEET_ID');
  const sheetName = requiredProperty(properties, 'SHEET_NAME');
  const syncUrl = requiredProperty(properties, 'SYNC_URL');
  const secret = requiredProperty(properties, 'SYNC_SECRET');
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);

  const values = sheet.getRange(SOURCE_RANGE).getValues();
  const headers = values.shift().map(String);
  const expectedHeaders = [
    'cluster_name',
    'region',
    'dock_number',
    'backlogs',
    'backlogs_ts',
  ];

  if (headers.join('|') !== expectedHeaders.join('|')) {
    throw new Error(`Unexpected headers: ${headers.join(', ')}`);
  }

  const rows = values
    .filter(row => String(row[0]).trim() !== '')
    .map(row => ({
      cluster_name: String(row[0]).trim(),
      region: String(row[1]).trim(),
      dock_number: String(row[2]).trim() || null,
      backlogs: row[3] === '' ? 0 : Number(row[3]),
      backlogs_ts: row[4] instanceof Date
        ? row[4].toISOString()
        : (row[4] === '' ? null : String(row[4])),
    }));

  const response = UrlFetchApp.fetch(
    syncUrl,
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'x-sync-source': 'google-apps-script',
        'x-sync-secret': secret,
      },
      payload: JSON.stringify(rows),
      muteHttpExceptions: true,
    }
  );

  const status = response.getResponseCode();
  const body = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error(`sync-clusters failed (${status}): ${body}`);
  }

  console.log(body);
  return JSON.parse(body);
}

function requiredProperty(properties, name) {
  const value = properties.getProperty(name);
  if (!value) throw new Error(`Missing Script Property: ${name}`);
  return value;
}
```

Set `SYNC_SECRET` to the same value in both Apps Script projects and in Supabase. Run `syncClusters()` manually first, then add a time-driven trigger if automatic synchronization is required.
