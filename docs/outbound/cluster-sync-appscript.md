# Google Sheet → Supabase cluster lookup sync

Source range: `cluster!A1:E1000`

Columns:

1. `cluster_name`
2. `region`
3. `dock_number`
4. `backlogs`
5. `backlogs_ts`

The sheet does not contain a separate `hub_name` column, so the sync function derives `hub_name` from `cluster_name`. `cluster_name` is the unique upsert identity used by `sync-clusters`.

## Apps Script

Store the Supabase anon key in Apps Script **Script Properties** as `SUPABASE_ANON_KEY`.

```javascript
const SUPABASE_URL = 'https://jbbqdthptwnlhetwhfng.supabase.co';
const SHEET_NAME = 'cluster';
const SOURCE_RANGE = 'A1:E1000';

function syncClusters() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet not found: ${SHEET_NAME}`);

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

  const anonKey = PropertiesService
    .getScriptProperties()
    .getProperty('SUPABASE_ANON_KEY');

  if (!anonKey) throw new Error('Missing Script Property: SUPABASE_ANON_KEY');

  const response = UrlFetchApp.fetch(
    `${SUPABASE_URL}/functions/v1/sync-clusters`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: `Bearer ${anonKey}`,
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
```

Run `syncClusters()` manually first, then add a time-driven trigger if automatic synchronization is required.
