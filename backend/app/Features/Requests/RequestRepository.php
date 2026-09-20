<?php

namespace App\Features\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class RequestRepository
{
    private const COLUMNS = ['id', 'request_timestamp', 'cluster', 'region', 'dock_no', 'backlogs', 'backlogs_timestamp', 'ob_fte', 'truck_size', 'truck_type', 'plate_number', 'provide_time', 'linehaul_trip_no', 'docked_time', 'status', 'rejection_remarks', 'driver_id', 'created_by', 'created_at', 'updated_at'];

    public function __construct(private RequestAuthorizer $authorizer) {}

    public function paginate(object $actor, array $filters): LengthAwarePaginator
    {
        $query = DB::table('requests')->select(self::COLUMNS);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('created_by', $actor->id);
        }
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->whereRaw("lower(coalesce(plate_number, '')) like ?", ['%'.strtolower($search).'%']);
        }
        if ($dateFrom = $filters['date_from'] ?? null) {
            $this->whereBusinessDate($query, '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $this->whereBusinessDate($query, '<=', $dateTo);
        }

        $sort = $filters['sort'] ?? 'created_at';
        $direction = $filters['direction'] ?? 'desc';
        $query->orderBy($sort, $direction)->orderByDesc('id');

        return $query->paginate(min((int) ($filters['per_page'] ?? 20), 100));
    }

    public function metrics(object $actor, array $filters = []): Collection
    {
        $query = DB::table('requests')->select('status', DB::raw('count(*) as total'))->groupBy('status');
        $this->scope($query, $actor, $filters);
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->whereRaw("lower(coalesce(plate_number, '')) like ?", ['%'.strtolower($search).'%']);
        }

        return $query->pluck('total', 'status');
    }

    public function analytics(object $actor, array $filters = []): array
    {
        $sizes = DB::table('requests')->select('truck_size', DB::raw('count(*) as total'))->groupBy('truck_size');
        $this->scope($sizes, $actor, $filters);

        $businessTimezone = (string) config('app.business_timezone', 'Asia/Manila');
        $now = CarbonImmutable::now($businessTimezone);
        $shiftStart = $now->hour < 6 || $now->hour >= 18
            ? $now->setTime(18, 0)
            : $now->subDay()->setTime(18, 0);
        if ($now->hour < 6) {
            $shiftStart = $now->subDay()->setTime(18, 0);
        }
        $shiftEnd = $shiftStart->addHours(13);
        $shiftQuery = DB::table('requests')->whereBetween('request_timestamp', [$shiftStart->utc(), $shiftEnd->utc()]);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $shiftQuery->where('created_by', $actor->id);
        }
        if ($dateFrom = $filters['date_from'] ?? null) {
            $this->whereBusinessDate($shiftQuery, '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $this->whereBusinessDate($shiftQuery, '<=', $dateTo);
        }
        $counts = array_fill(0, 13, 0);
        if (DB::connection()->getDriverName() === 'pgsql') {
            $hourly = $shiftQuery
                ->selectRaw('floor(extract(epoch from (request_timestamp - ?::timestamptz)) / 3600)::int as hour_offset, count(*) as total', [$shiftStart->toIso8601String()])
                ->groupBy('hour_offset')->pluck('total', 'hour_offset');
            foreach ($hourly as $hour => $total) {
                if ((int) $hour >= 0 && (int) $hour <= 12) {
                    $counts[(int) $hour] = (int) $total;
                }
            }
        } else {
            foreach ($shiftQuery->pluck('request_timestamp') as $timestamp) {
                $index = (int) $shiftStart->diffInHours(CarbonImmutable::parse($timestamp)->setTimezone($businessTimezone), false);
                if ($index >= 0 && $index <= 12) {
                    $counts[$index]++;
                }
            }
        }

        return [
            'truck_sizes' => $sizes->pluck('total', 'truck_size'),
            'hourly' => collect($counts)->map(fn (int $count, int $hour) => [
                'label' => $shiftStart->addHours($hour)->format('gA'),
                'count' => $count,
            ])->values(),
            'shift_start' => $shiftStart->toIso8601String(),
        ];
    }

    private function scope(Builder $query, object $actor, array $filters): void
    {
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('created_by', $actor->id);
        }
        if ($status = $filters['status'] ?? null) {
            $query->where('status', $status);
        }
        if ($search = trim((string) ($filters['search'] ?? ''))) {
            $query->whereRaw("lower(coalesce(plate_number, '')) like ?", ['%'.strtolower($search).'%']);
        }
        if ($dateFrom = $filters['date_from'] ?? null) {
            $this->whereBusinessDate($query, '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $this->whereBusinessDate($query, '<=', $dateTo);
        }
    }

    public function lock(string $id): object
    {
        return DB::table('requests')->where('id', $id)->lockForUpdate()->firstOrFail();
    }

    public function findVisible(string $id, object $actor): object
    {
        $query = DB::table('requests')->select(self::COLUMNS)->where('id', $id);
        $request = $query->firstOrFail();
        abort_unless($this->authorizer->canView($actor, $request), 403);

        return $request;
    }

    public function events(string $id, object $actor): Collection
    {
        $this->findVisible($id, $actor);

        return DB::table('request_events')->where('request_id', $id)->orderByDesc('created_at')->get();
    }

    public function insert(array $data): object
    {
        DB::table('requests')->insert($data);

        return DB::table('requests')->where('id', $data['id'])->first();
    }

    public function update(string $id, array $data): object
    {
        DB::table('requests')->where('id', $id)->update($data);

        return DB::table('requests')->where('id', $id)->first();
    }

    private function whereBusinessDate(Builder $query, string $operator, string $date): void
    {
        if (DB::connection()->getDriverName() === 'pgsql') {
            $timezone = str_replace("'", "''", (string) config('app.business_timezone', 'Asia/Manila'));
            $query->whereRaw("(request_timestamp AT TIME ZONE '{$timezone}')::date {$operator} ?", [$date]);

            return;
        }

        $timezone = (string) config('app.business_timezone', 'Asia/Manila');
        $businessDate = CarbonImmutable::createFromFormat('!Y-m-d', $date, $timezone);
        $bound = $operator === '>='
            ? $businessDate->startOfDay()->utc()
            : $businessDate->endOfDay()->utc();

        $query->where('request_timestamp', $operator, $bound);
    }
}
