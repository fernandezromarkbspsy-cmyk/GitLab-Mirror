<?php

namespace App\Integrations\GoogleSheets;

use Closure;
use Google\Client;
use Google\Service\Sheets;
use Google\Service\Sheets\BatchClearValuesRequest;
use Google\Service\Sheets\ValueRange;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class GoogleSheetsRequestSync
{
    private const HEADERS = [
        'Request timestamp',
        'Cluster',
        'Region',
        'Dock #',
        'Backlog',
        'Backlogs Time Stamp',
        'LH Type (Request)',
        'Ops FTE',
        'Plate number',
        'MM FTE',
        'LH size (input by FTE MM)',
        'LH type (input by FTE MM)',
        'Provide Time',
        'Linehaul Trip',
        'Assigned time',
        'Docked Time',
        'Doc Officer',
        'OPS/PIC',
    ];

    public function __construct(private readonly ?Closure $sheetsFactory = null) {}

    public function sync(): int
    {
        $rows = DB::table('requests as r')
            ->leftJoin('profiles as creator', 'creator.id', '=', 'r.created_by')
            ->select([
                'r.id', 'r.request_timestamp', 'r.cluster', 'r.region', 'r.dock_no',
                'r.backlogs', 'r.backlogs_timestamp', 'r.truck_size', 'r.truck_type',
                'r.plate_number', 'r.provide_time', 'r.linehaul_trip_no', 'r.docked_time',
                'creator.name as ops_pic',
            ])
            ->orderBy('r.request_timestamp')
            ->get();
        $maxRows = (int) config('services.google_sheets.max_rows', 50000);
        if ($maxRows < 1 || $rows->count() > $maxRows) {
            throw new RuntimeException("Google Sheets sync exceeds the configured {$maxRows}-row limit.");
        }

        $events = DB::table('request_events as e')
            ->leftJoin('profiles as actor', 'actor.id', '=', 'e.actor_id')
            ->whereIn('e.event_type', ['REQUEST_CREATED', 'REQUEST_APPROVED', 'TRUCK_ASSIGNED', 'REQUEST_CONFIRMED'])
            ->select(['e.request_id', 'e.event_type', 'e.created_at', 'e.metadata', 'actor.name as actor_name'])
            ->orderBy('e.created_at')
            ->get()
            ->groupBy('request_id');

        $values = [self::HEADERS];
        foreach ($rows as $request) {
            $requestEvents = $events->get($request->id, collect())->keyBy('event_type');
            $created = $requestEvents->get('REQUEST_CREATED');
            $approved = $requestEvents->get('REQUEST_APPROVED');
            $assigned = $requestEvents->get('TRUCK_ASSIGNED');
            $confirmed = $requestEvents->get('REQUEST_CONFIRMED');
            $createdMetadata = $this->metadata($created?->metadata);

            $values[] = [
                $request->request_timestamp,
                $request->cluster,
                $request->region,
                $request->dock_no,
                $request->backlogs,
                $request->backlogs_timestamp,
                $createdMetadata['lh_type_request'] ?? $request->truck_type,
                $approved?->actor_name,
                $request->plate_number,
                $assigned?->actor_name,
                $request->truck_size,
                $request->truck_type,
                $request->provide_time,
                $request->linehaul_trip_no,
                $assigned?->created_at,
                $request->docked_time,
                $confirmed?->actor_name,
                $request->ops_pic,
            ];
        }

        $sheets = $this->client();
        $spreadsheetId = (string) config('services.google_sheets.spreadsheet_id');
        $body = new ValueRange(['values' => $values]);
        $sheets->spreadsheets_values->update(
            $spreadsheetId,
            $this->range('A1:R'.max(1, count($values))),
            $body,
            ['valueInputOption' => 'RAW'],
        );

        // Only clear stale cells after the replacement data is safely written.
        // A failed cleanup may leave old trailing rows, but it can no longer
        // erase the current sheet before a transient update failure.
        $firstStaleRow = count($values) + 1;
        $sheets->spreadsheets_values->batchClear(
            $spreadsheetId,
            new BatchClearValuesRequest(['ranges' => [
                $this->range('S1:Z'),
                $this->range("A{$firstStaleRow}:R"),
            ]]),
        );

        return count($rows);
    }

    private function client(): Sheets
    {
        if ($this->sheetsFactory !== null) {
            return ($this->sheetsFactory)();
        }

        $credentials = config('services.google_sheets.credentials_json');
        $credentialsPath = config('services.google_sheets.credentials_path');
        if ($credentialsPath && is_file($credentialsPath)) {
            $credentials = file_get_contents($credentialsPath);
        }
        if (! is_string($credentials) || trim($credentials) === '') {
            throw new RuntimeException('Google Sheets credentials are not configured.');
        }

        $decoded = json_decode($credentials, true);
        if (! is_array($decoded)) {
            throw new RuntimeException('Google Sheets credentials are not valid JSON.');
        }

        $client = new Client;
        $client->setApplicationName(config('app.name'));
        $client->setAuthConfig($decoded);
        $client->setScopes([Sheets::SPREADSHEETS]);

        return new Sheets($client);
    }

    private function range(string $suffix): string
    {
        $sheet = str_replace("'", "''", (string) config('services.google_sheets.sheet_name', 'Sheet1'));

        return "'{$sheet}'!{$suffix}";
    }

    private function metadata(mixed $metadata): array
    {
        if (is_array($metadata)) {
            return $metadata;
        }

        $decoded = json_decode((string) $metadata, true);

        return is_array($decoded) ? $decoded : [];
    }
}
