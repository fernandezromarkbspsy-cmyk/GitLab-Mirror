<?php

namespace App\Features\Users;

use App\Integrations\SupabaseAdminClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Throwable;

final class UserController
{
    private SupabaseAdminClient $supabaseAdmin;

    public function __construct(?SupabaseAdminClient $supabaseAdmin = null)
    {
        $this->supabaseAdmin = $supabaseAdmin ?? new SupabaseAdminClient;
    }

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
            'ops_id' => ['required', 'string', 'max:40', 'regex:/^ops[0-9]+$/i'],
        ]);
        $opsId = strtolower(trim($data['ops_id']));
        abort_if(DB::table('profiles')->whereRaw('lower(ops_id) = ?', [$opsId])->exists(), 422, 'That Ops ID is already registered.');
        $email = $opsId.'@backroom.soc5.internal';

        $initialPassword = Str::password(20);
        try {
            $authUserId = $this->supabaseAdmin->createUser($email, $initialPassword, ['ops_id' => $opsId, 'account_type' => 'backroom']);
        } catch (Throwable $exception) {
            Log::warning('Unable to create Supabase Backroom user.', [
                'ops_id' => $opsId,
                'error' => $exception->getMessage(),
            ]);
            abort(422, 'Unable to create authentication account.');
        }

        try {
            $profile = DB::transaction(function () use ($authUserId, $data, $opsId, $actor) {
                $profile = DB::table('profiles')->insertGetId([
                    'id' => $authUserId, 'name' => $data['name'], 'role' => 'ops_pic',
                    'ops_id' => $opsId, 'email' => null, 'is_active' => true,
                    'must_change_password' => true, 'password_reset_at' => now(), 'created_at' => now(), 'updated_at' => now(),
                ], 'id');

                if (DB::getSchemaBuilder()->hasTable('user_imports')) {
                    DB::table('user_imports')->whereRaw('lower(ops_id) = ?', [$opsId])->update([
                        'auth_user_id' => $authUserId,
                        'imported_at' => now(),
                    ]);
                }

                $this->userEvent($profile, $actor->id, 'USER_CREATED', ['name' => $data['name'], 'ops_id' => $opsId]);

                return $profile;
            });
        } catch (Throwable $exception) {
            try {
                $this->supabaseAdmin->deleteUser($authUserId);
            } catch (Throwable $compensationException) {
                Log::critical('Supabase user compensation failed after profile creation rollback.', [
                    'user_id' => $authUserId,
                    'ops_id' => $opsId,
                    'error' => $compensationException->getMessage(),
                ]);
            }
            throw $exception;
        }

        return response()->json([
            'id' => $profile,
            'name' => $data['name'],
            'ops_id' => $opsId,
            'must_change_password' => true,
            'initial_password' => $initialPassword,
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorize($request);
        abort_if($request->attributes->get('actor')->id === $id, 409, 'You cannot change your own role.');
        $data = $request->validate(['name' => 'required|string|min:2|max:120', 'role' => ['required', Rule::in(['ops_pic', 'fte_ops', 'fte_mm', 'doc_officer'])]]);
        DB::transaction(function () use ($id, $data, $request): void {
            $updated = DB::table('profiles')->where('id', $id)->update($data + ['updated_at' => now()]);
            abort_unless($updated, 404, 'User not found.');
            $this->userEvent($id, $request->attributes->get('actor')->id, 'USER_UPDATED', $data);
        });

        return response()->json(DB::table('profiles')->where('id', $id)->firstOrFail());
    }

    public function disable(Request $request, string $id): JsonResponse
    {
        $this->authorize($request);
        abort_if($request->attributes->get('actor')->id === $id, 409, 'You cannot disable your own account.');
        DB::transaction(function () use ($id, $request): void {
            $updated = DB::table('profiles')->where('id', $id)->update(['is_active' => false, 'updated_at' => now()]);
            abort_unless($updated, 404, 'User not found.');
            $this->userEvent($id, $request->attributes->get('actor')->id, 'USER_DISABLED');
        });

        return response()->json(['ok' => true]);
    }

    public function resetPassword(Request $request, string $id): JsonResponse
    {
        $this->authorize($request);
        $profile = DB::table('profiles')->where('id', $id)->where('role', 'ops_pic')->where('is_active', true)->first(['id', 'ops_id', 'must_change_password', 'password_changed_at', 'password_reset_at']);
        abort_unless($profile, 404, 'Active Backroom user not found.');

        $newPassword = Str::password(20);
        $resetAt = now();
        DB::table('profiles')->where('id', $profile->id)->update([
            'must_change_password' => true,
            'password_changed_at' => null,
            'password_reset_at' => $resetAt,
            'updated_at' => $resetAt,
        ]);

        $restoreResetState = function () use ($profile): void {
            $restored = DB::table('profiles')->where('id', $profile->id)->update([
                'must_change_password' => $profile->must_change_password,
                'password_changed_at' => $profile->password_changed_at,
                'password_reset_at' => $profile->password_reset_at,
                'updated_at' => now(),
            ]);
            if (! $restored) {
                Log::critical('Backroom password reset rollback failed.', ['user_id' => $profile->id, 'ops_id' => $profile->ops_id]);
            }
        };

        try {
            $this->supabaseAdmin->updatePassword($profile->id, $newPassword);
        } catch (Throwable $exception) {
            $restoreResetState();
            Log::warning('Unable to reach Supabase during Backroom password reset.', ['user_id' => $profile->id, 'error' => $exception->getMessage()]);
            abort(502, 'Unable to reset the Backroom password.');
        }

        try {
            DB::transaction(function () use ($profile, $request): void {
                $this->userEvent($profile->id, $request->attributes->get('actor')->id, 'PASSWORD_RESET', ['ops_id' => $profile->ops_id]);
            });
        } catch (Throwable $exception) {
            Log::critical('Backroom password reset audit failed after Supabase update.', ['user_id' => $profile->id, 'error' => $exception->getMessage()]);
            throw $exception;
        }

        return response()->json(['ok' => true, 'initial_password' => $newPassword]);
    }

    private function authorize(Request $request): void
    {
        abort_unless(in_array($request->attributes->get('actor')->role, ['fte_ops', 'fte_mm'], true), 403, 'Only FTE users can manage users.');
    }

    private function userEvent(string $userId, string $actorId, string $type, array $metadata = []): void
    {
        DB::table('user_events')->insert(['user_id' => $userId, 'actor_id' => $actorId, 'event_type' => $type, 'metadata' => json_encode($metadata)]);
    }
}
