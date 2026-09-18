<?php

use App\Features\Auth\BackroomController;
use App\Features\Auth\SeatalkController;
use App\Features\Dispatch\DispatchController;
use App\Features\Kpi\KpiController;
use App\Features\Notifications\NotificationController;
use App\Features\Requests\RequestController;
use App\Features\Users\AccessRequestController;
use App\Features\Users\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/auth/status', function () {
    abort_unless(
        filled(config('services.supabase.url')) && filled(config('services.supabase.anon_key')),
        503,
        'Authentication service is not configured.'
    );

    return response()->json(['configured' => true]);
});

// SeaTalk login routes are public only for the short-lived QR transaction.
Route::post('/auth/seatalk/transactions', [SeatalkController::class, 'createLoginTransaction'])->middleware('throttle:10,1');
Route::post('/auth/backroom/login', [BackroomController::class, 'login'])->middleware('throttle:backroom');
Route::get('/auth/seatalk/transactions/{transactionId}', [SeatalkController::class, 'transactionStatus'])
    ->whereUuid('transactionId')
    ->middleware('throttle:60,1');
Route::get('/auth/seatalk/callback', [SeatalkController::class, 'callback'])->middleware('throttle:10,1');
Route::post('/access-requests', [AccessRequestController::class, 'store'])->middleware('throttle:3,10');

Route::middleware(['supabase.auth', 'throttle:api'])->group(function (): void {
    Route::get('/auth/me', fn (Request $r) => response()->json($r->attributes->get('actor')));
    Route::post('/auth/password-changed', function (Request $request) {
        $actor = $request->attributes->get('actor');
        abort_unless($actor->role === 'ops_pic', 403, 'Only Backroom accounts use this flow.');
        abort_unless($actor->must_change_password && $actor->password_reset_at, 409, 'Change your password before continuing.');
        $updated = DB::table('profiles')
            ->where('id', $actor->id)
            ->where('must_change_password', true)
            ->update(['must_change_password' => false, 'password_changed_at' => now(), 'updated_at' => now()]);
        abort_unless($updated, 409, 'Password change could not be verified.');

        return response()->json(['ok' => true]);
    });
});

Route::middleware(['supabase.auth', 'throttle:api'])->group(function (): void {
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::patch('/users/{id}/disable', [UserController::class, 'disable']);
    Route::post('/users/{id}/reset-password', [UserController::class, 'resetPassword']);
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'readAll']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'read']);
    Route::get('/clusters', function (Request $request) {
        $data = $request->validate(['search' => 'required|string|min:3|max:80']);
        $search = strtolower($data['search']);

        return response()->json(['data' => DB::table('clusters')
            ->select('id', 'cluster_name', 'hub_name', 'region', 'dock_number', 'backlogs', 'backlogs_ts')
            ->where(function ($query) use ($search): void {
                $query->whereRaw('lower(cluster_name) like ?', ["%{$search}%"])
                    ->orWhereRaw('lower(hub_name) like ?', ["%{$search}%"]);
            })
            ->where(function ($query): void {
                $query->where('active', true)->orWhereNull('active');
            })
            ->orderBy('cluster_name')
            ->limit(12)
            ->get()]);
    });
    Route::get('/kpi/summary', [KpiController::class, 'summary']);
    Route::get('/kpi/daily', [KpiController::class, 'daily']);
    Route::get('/dispatch/intraday', [DispatchController::class, 'intraday']);
    Route::get('/requests/metrics', [RequestController::class, 'metrics']);
    Route::get('/requests/analytics', [RequestController::class, 'analytics']);
    Route::get('/requests', [RequestController::class, 'index']);
    Route::post('/requests', [RequestController::class, 'store'])->middleware('idempotency');
    Route::post('/requests/bulk-approve', [RequestController::class, 'bulkApprove']);
    Route::get('/requests/{id}', [RequestController::class, 'show']);
    Route::get('/requests/{id}/events', [RequestController::class, 'events']);
    Route::put('/requests/{id}', [RequestController::class, 'update'])->middleware('idempotency');
    Route::post('/requests/{id}/{action}', [RequestController::class, 'action'])->middleware('idempotency')
        ->whereIn('action', ['approve', 'reject-ops', 'cancel', 'reject-mm', 'assign-truck', 'mark-docked', 'confirm']);
});
