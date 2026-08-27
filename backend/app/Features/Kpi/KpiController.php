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
        $filters = $request->validate(['date_from' => 'nullable|date', 'date_to' => 'nullable|date|after_or_equal:date_from']);
        $from = isset($filters['date_from']) ? CarbonImmutable::parse($filters['date_from'])->startOfDay() : CarbonImmutable::now()->startOfMonth();
        $to = isset($filters['date_to']) ? CarbonImmutable::parse($filters['date_to'])->endOfDay() : CarbonImmutable::now()->endOfDay();
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
        $filters = $request->validate(['date_from' => 'nullable|date', 'date_to' => 'nullable|date|after_or_equal:date_from']);
        $from = isset($filters['date_from']) ? CarbonImmutable::parse($filters['date_from'])->startOfDay() : CarbonImmutable::now()->subDays(29)->startOfDay();
        $to = isset($filters['date_to']) ? CarbonImmutable::parse($filters['date_to'])->endOfDay() : CarbonImmutable::now()->endOfDay();
        $rows = DB::table('requests')->whereBetween('request_timestamp', [$from, $to])
            ->selectRaw('date(request_timestamp) as date, count(*) as total')
            ->selectRaw("sum(case when status = 'CONFIRMED' then 1 else 0 end) as confirmed")
            ->groupByRaw('date(request_timestamp)')->orderBy('date')->get();

        return response()->json(['data' => $rows]);
    }

    private function authorize(Request $request): void
    {
        abort_unless($request->attributes->get('actor')->role === 'fte_ops', 403, 'Only FTE Ops can view KPI data.');
    }
}
