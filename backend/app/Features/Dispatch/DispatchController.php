<?php

namespace App\Features\Dispatch;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

final class DispatchController
{
    public function intraday(Request $request): JsonResponse
    {
        abort_unless(
            in_array($request->attributes->get('actor')->role, ['fte_ops', 'fte_mm'], true),
            403,
            'Only FTE users can view intraday dispatch data.',
        );

        $date = $request->validate(['date' => ['required', 'date_format:Y-m-d']])['date'];
        $rows = DB::table('intraday_dispatch')
            ->where('dispatch_date', $date)
            ->orderBy('hour')
            ->get(['dispatch_date', 'hour', 'order_qty', 'synced_at'])
            ->keyBy('hour');

        $hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5];

        return response()->json(['data' => array_map(static function (int $hour) use ($rows, $date): array {
            $row = $rows->get($hour);

            return [
                'date' => $date,
                'hour' => $hour,
                'orderQty' => $row ? (float) $row->order_qty : 0,
                'syncedAt' => $row?->synced_at,
            ];
        }, $hours)]);
    }
}
