<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

final class ProvisionBackroomUsers extends Command
{
    protected $signature = 'users:provision-backroom {--ops-id= : Provision one OPS ID} {--all : Provision every active staged Backroom user}';

    protected $description = 'Create Supabase Auth identities for staged Backroom users';

    public function handle(): int
    {
        if (! $this->option('all') && ! $this->option('ops-id')) {
            $this->error('Specify --ops-id=ops12345 or --all.');

            return self::INVALID;
        }

        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_key');
        $initialPassword = (string) config('services.backroom.initial_password');
        if ($url === '' || $key === '' || $initialPassword === '') {
            $this->error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and BACKROOM_INITIAL_PASSWORD must be configured.');

            return self::FAILURE;
        }

        $query = DB::table('user_imports')
            ->where('role', 'ops_pic')
            ->where('is_active', true)
            ->orderBy('ops_id');

        if ($opsId = $this->option('ops-id')) {
            $query->whereRaw('lower(ops_id) = ?', [strtolower((string) $opsId)]);
        }

        $users = $query->get(['id', 'name', 'ops_id', 'auth_user_id']);
        if ($users->isEmpty()) {
            $this->error('No matching active staged Backroom users were found.');

            return self::FAILURE;
        }

        $created = 0;
        $repaired = 0;
        $failed = 0;

        foreach ($users as $user) {
            $authUserId = $user->auth_user_id;
            $opsId = strtolower($user->ops_id);

            if (! $authUserId) {
                $response = Http::withHeaders([
                    'apikey' => $key,
                    'Authorization' => 'Bearer '.$key,
                ])->timeout(15)->post($url.'/auth/v1/admin/users', [
                    'email' => $opsId.'@backroom.soc5.internal',
                    'password' => $initialPassword,
                    'email_confirm' => true,
                    'user_metadata' => ['ops_id' => $opsId, 'account_type' => 'backroom'],
                ]);

                if (! $response->successful() || ! $response->json('id')) {
                    $this->error($opsId.': '.($response->json('msg') ?? $response->json('message') ?? 'Supabase user creation failed'));
                    $failed++;

                    continue;
                }

                $authUserId = $response->json('id');
                $created++;
            } else {
                $repaired++;
            }

            DB::transaction(function () use ($user, $authUserId, $opsId): void {
                DB::table('profiles')->upsert([[
                    'id' => $authUserId,
                    'name' => $user->name,
                    'role' => 'ops_pic',
                    'email' => null,
                    'ops_id' => $opsId,
                    'is_active' => true,
                    'must_change_password' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]], ['id'], ['name', 'role', 'ops_id', 'is_active', 'must_change_password', 'updated_at']);

                DB::table('user_imports')->where('id', $user->id)->update([
                    'auth_user_id' => $authUserId,
                    'imported_at' => now(),
                ]);
            });

            $this->info($opsId.': ready');
        }

        $this->line("Created: {$created}; repaired: {$repaired}; failed: {$failed}");

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }
}
