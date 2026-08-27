<?php

namespace App\Features\Requests;

use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class RequestRepository
{
    private const COLUMNS = ['id', 'request_timestamp', 'cluster', 'region', 'dock_no', 'backlogs', 'backlogs_timestamp', 'ob_fte', 'truck_size', 'truck_type', 'plate_number', 'provide_time', 'linehaul_trip_no', 'docked_time', 'status', 'rejection_remarks', 'driver_id', 'created_by', 'created_at', 'updated_at'];

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
            $query->whereDate('request_timestamp', '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('request_timestamp', '<=', $dateTo);
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

        $now = CarbonImmutable::now('Asia/Manila');
        $shiftStart = $now->hour < 6
            ? $now->subDay()->setTime(18, 0)
            : $now->setTime(18, 0);
        $shiftEnd = $shiftStart->addHours(13);
        $shiftQuery = DB::table('requests')->whereBetween('request_timestamp', [$shiftStart->utc(), $shiftEnd->utc()]);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $shiftQuery->where('created_by', $actor->id);
        }
        $timestamps = $shiftQuery->pluck('request_timestamp');
        $counts = array_fill(0, 13, 0);
        foreach ($timestamps as $timestamp) {
            $index = $shiftStart->diffInHours(CarbonImmutable::parse($timestamp)->setTimezone('Asia/Manila'), false);
            if ($index >= 0 && $index <= 12) {
                $counts[$index]++;
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

    private function scope($query, object $actor, array $filters): void
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
            $query->whereDate('request_timestamp', '>=', $dateFrom);
        }
        if ($dateTo = $filters['date_to'] ?? null) {
            $query->whereDate('request_timestamp', '<=', $dateTo);
        }
    }

    public function lock(string $id): object
    {
        return DB::table('requests')->where('id', $id)->lockForUpdate()->firstOrFail();
    }

    public function findVisible(string $id, object $actor): object
    {
        $query = DB::table('requests')->select(self::COLUMNS)->where('id', $id);
        if ($actor->role === 'ops_pic' && ! ($actor->is_admin ?? false)) {
            $query->where('created_by', $actor->id);
        }

        return $query->firstOrFail();
    }

    public function events(string $id, object $actor): Collection
    {
        $this->findVisible($id, $actor);

        return DB::table('request_events')->where('request_id', $id)->orderByDesc('created_at')->get();
    }

    public function insert(array $data): object
    {
        $id = DB::table('requests')->insertGetId($data, 'id');

        return DB::table('requests')->where('id', $id)->first();
    }

    public function update(string $id, array $data): object
    {
        DB::table('requests')->where('id', $id)->update($data);

        return DB::table('requests')->where('id', $id)->first();
    }
}
