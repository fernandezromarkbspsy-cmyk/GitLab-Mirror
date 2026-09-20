<?php

namespace App\Console\Commands;

use App\Integrations\SupabaseAdminClient;
use App\Integrations\SupabaseAdminException;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ProvisionBackroomUsers extends Command
{
    protected $signature = 'users:provision-backroom {--ops-id= : Provision one OPS ID} {--all : Provision every active staged Backroom user}';

    protected $description = 'Create Supabase Auth identities for staged Backroom users';

    private ?SupabaseAdminClient $supabaseAdmin = null;

    public function __construct()
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if (! $this->option('all') && ! $this->option('ops-id')) {
            $this->error('Specify --ops-id=ops12345 or --all.');

            return self::INVALID;
        }

        $url = rtrim((string) config('services.supabase.url'), '/');
        $key = (string) config('services.supabase.service_key');
        if ($url === '' || $key === '') {
            $this->error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.');

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
            $initialPassword = Str::password(20);
            $existingProfile = $authUserId ? DB::table('profiles')->where('id', $authUserId)->first(['must_change_password', 'password_reset_at']) : null;
            $shouldRepairPassword = false;

            if (! $authUserId) {
                try {
                    $authUserId = $this->supabaseAdmin()->createUser($opsId.'@backroom.soc5.internal', $initialPassword, ['ops_id' => $opsId, 'account_type' => 'backroom']);
                    $created++;
                    $this->line($opsId.': initial password '.$initialPassword);
                } catch (SupabaseAdminException $exception) {
                    $this->error($opsId.': '.($exception->getMessage() ?: 'Supabase user creation failed'));
                    $failed++;

                    continue;
                }
            } else {
                $mustChangePassword = $existingProfile === null || (bool) $existingProfile->must_change_password;

                if ($mustChangePassword) {
                    try {
                        $this->supabaseAdmin()->updatePassword($authUserId, $initialPassword);
                        $shouldRepairPassword = true;
                        $this->line($opsId.': initial password '.$initialPassword);
                    } catch (SupabaseAdminException $exception) {
                        $this->error($opsId.': Supabase user password repair failed');
                        $failed++;

                        continue;
                    }
                }

                if ($shouldRepairPassword) {
                    $repaired++;
                }
            }

            $resetFirstLogin = $existingProfile === null || $shouldRepairPassword;
            DB::transaction(function () use ($user, $authUserId, $opsId, $existingProfile, $resetFirstLogin): void {
                $profileValues = [
                    'id' => $authUserId,
                    'name' => $user->name,
                    'role' => 'ops_pic',
                    'email' => null,
                    'ops_id' => $opsId,
                    'is_active' => true,
                    'must_change_password' => $resetFirstLogin ? true : (bool) $existingProfile->must_change_password,
                    'password_reset_at' => $resetFirstLogin ? now() : $existingProfile->password_reset_at,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                DB::table('profiles')->upsert([$profileValues], ['id'], ['name', 'role', 'ops_id', 'is_active', 'must_change_password', 'password_reset_at', 'updated_at']);

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

    private function supabaseAdmin(): SupabaseAdminClient
    {
        return $this->supabaseAdmin ??= new SupabaseAdminClient;
    }
}
