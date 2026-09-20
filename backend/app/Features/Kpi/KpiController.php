<?php

namespace App\Features\Kpi;

use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class KpiController
{
    public function summary(Request $request): JsonResponse
    {
        $this->authorize($request);
        $filters = $request->validate(['date_from' => 'nullable|date_format:Y-m-d', 'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from']);
        $timezone = (string) config('app.business_timezone', 'Asia/Manila');
        $from = isset($filters['date_from'])
            ? CarbonImmutable::createFromFormat('Y-m-d', $filters['date_from'], $timezone)->startOfDay()->utc()
            : CarbonImmutable::now($timezone)->startOfMonth()->utc();
        $to = isset($filters['date_to'])
            ? CarbonImmutable::createFromFormat('Y-m-d', $filters['date_to'], $timezone)->endOfDay()->utc()
            : CarbonImmutable::now($timezone)->endOfDay()->utc();
        $query = DB::table('requests')->whereBetween('request_timestamp', [$from, $to]);
        $total = (clone $query)->count();
        $confirmed = (clone $query)->where('status', 'CONFIRMED')->count();
        $cancelled = (clone $query)->where('status', 'CANCELLED')->count();
        $averageApprovalMinutes = (clone $query)->whereNotNull('approved_at')
            ->selectRaw('avg(extract(epoch from (approved_at - request_timestamp)) / 60) as value')->value('value');

        return response()->json(compact('total', 'confirmed', 'cancelled', 'averageApprovalMinutes'));
    }

    public function daily(Request $request): JsonResponse
    {
        $this->authorize($request);
        $filters = $request->validate(['date_from' => 'nullable|date_format:Y-m-d', 'date_to' => 'nullable|date_format:Y-m-d|after_or_equal:date_from']);
        $timezone = (string) config('app.business_timezone', 'Asia/Manila');
        $from = isset($filters['date_from'])
            ? CarbonImmutable::createFromFormat('Y-m-d', $filters['date_from'], $timezone)->startOfDay()->utc()
            : CarbonImmutable::now($timezone)->subDays(29)->startOfDay()->utc();
        $to = isset($filters['date_to'])
            ? CarbonImmutable::createFromFormat('Y-m-d', $filters['date_to'], $timezone)->endOfDay()->utc()
            : CarbonImmutable::now($timezone)->endOfDay()->utc();
        $dateExpression = DB::connection()->getDriverName() === 'pgsql'
            ? "(request_timestamp AT TIME ZONE '".str_replace("'", "''", $timezone)."')::date"
            : 'date(request_timestamp)';
        $rows = DB::table('requests')->whereBetween('request_timestamp', [$from, $to])
            ->selectRaw("{$dateExpression} as date, count(*) as total")
            ->selectRaw("sum(case when status = 'CONFIRMED' then 1 else 0 end) as confirmed")
            ->groupByRaw($dateExpression)->orderBy('date')->get();

        return response()->json(['data' => $rows]);
    }

    private function authorize(Request $request): void
    {
        abort_unless($request->attributes->get('actor')->role === 'fte_ops', 403, 'Only FTE Ops can view KPI data.');
    }
}
