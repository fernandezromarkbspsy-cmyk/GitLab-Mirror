<?php

namespace App\Features\Users;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Throwable;

final class UserController
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize($request);

        return response()->json(['data' => DB::table('profiles')->select('id', 'name', 'role', 'email', 'ops_id', 'is_active', 'created_at')->orderBy('name')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $actor = $request->attributes->get('actor');
        abort_unless(in_array($actor->role, ['fte_ops', 'fte_mm'], true), 403, 'Only FTE users can create Backroom accounts.');

        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i', Rule::unique('profiles', 'ops_id')],
        ]);
        $opsId = strtolower($data['ops_id']);
        $email = $opsId.'@backroom.soc5.internal';
        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_key');
        $initialPassword = (string) config('services.backroom.initial_password');
        abort_if($url === '' || $key === '' || $initialPassword === '', 503, 'Backroom provisioning is not configured.');

        $response = Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
            ->timeout(10)->post($url.'/auth/v1/admin/users', [
                'email' => $email,
                'password' => $initialPassword,
                'email_confirm' => true,
                'user_metadata' => ['ops_id' => $opsId, 'account_type' => 'backroom'],
            ]);
        if (! $response->successful() || ! $response->json('id')) {
            Log::warning('Unable to create Supabase Backroom user.', [
                'status' => $response->status(),
                'ops_id' => $opsId,
                'body' => $response->json(),
            ]);
            abort(422, 'Unable to create authentication account.');
        }

        $authUserId = $response->json('id');

        try {
            $profile = DB::transaction(function () use ($authUserId, $data, $opsId) {
                $profile = DB::table('profiles')->insertGetId([
                    'id' => $authUserId, 'name' => $data['name'], 'role' => 'ops_pic',
                    'ops_id' => $opsId, 'email' => null, 'is_active' => true,
                    'must_change_password' => true, 'created_at' => now(), 'updated_at' => now(),
                ], 'id');

                if (DB::getSchemaBuilder()->hasTable('user_imports')) {
                    DB::table('user_imports')->whereRaw('lower(ops_id) = ?', [$opsId])->update([
                        'auth_user_id' => $authUserId,
                        'imported_at' => now(),
                    ]);
                }

                return $profile;
            });
        } catch (Throwable $exception) {
            Http::withHeaders(['apikey' => $key, 'Authorization' => 'Bearer '.$key])
                ->timeout(10)->delete($url.'/auth/v1/admin/users/'.$authUserId);
            throw $exception;
        }

        $this->userEvent($profile, $actor->id, 'USER_CREATED', ['name' => $data['name'], 'ops_id' => $opsId]);

        return response()->json(['id' => $profile, 'name' => $data['name'], 'ops_id' => $opsId, 'must_change_password' => true], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorize($request);
        $data = $request->validate(['name' => 'required|string|min:2|max:120', 'role' => ['required', Rule::in(['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer', 'dock_officer'])]]);
        DB::table('profiles')->where('id', $id)->update($data + ['updated_at' => now()]);
        $this->userEvent($id, $request->attributes->get('actor')->id, 'USER_UPDATED', $data);

        return response()->json(DB::table('profiles')->where('id', $id)->firstOrFail());
    }

    public function disable(Request $request, string $id): JsonResponse
    {
        $this->authorize($request);
        abort_if($request->attributes->get('actor')->id === $id, 409, 'You cannot disable your own account.');
        DB::table('profiles')->where('id', $id)->update(['is_active' => false, 'updated_at' => now()]);
        $this->userEvent($id, $request->attributes->get('actor')->id, 'USER_DISABLED');

        return response()->json(['ok' => true]);
    }

    private function authorize(Request $request): void
    {
        abort_unless(in_array($request->attributes->get('actor')->role, ['fte_ops', 'fte_mm'], true), 403, 'Only FTE users can manage users.');
    }

    private function userEvent(string $userId, string $actorId, string $type, array $metadata = []): void
    {
        if (DB::getSchemaBuilder()->hasTable('user_events')) {
            DB::table('user_events')->insert(['user_id' => $userId, 'actor_id' => $actorId, 'event_type' => $type, 'metadata' => json_encode($metadata)]);
        }
    }
}
