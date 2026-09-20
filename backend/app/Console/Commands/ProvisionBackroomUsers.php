<?php

namespace App\Console\Commands;

use App\Integrations\SupabaseAdminClient;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class ProvisionBackroomUsers extends Command
{
    protected $signature = 'users:provision-backroom {--ops-id= : Provision one OPS ID} {--all : Provision every active staged Backroom user} {--reset : Reset existing users and require first login again}';

    protected $description = 'Create Supabase Auth identities for staged Backroom users';

    public function __construct(private SupabaseAdminClient $supabaseAdmin)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if (! $this->option('all') && ! $this->option('ops-id')) {
            $this->error('Specify --ops-id=ops12345 or --all.');

            return self::INVALID;
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
            $existingProfile = $authUserId
                ? DB::table('profiles')->where('id', $authUserId)->first(['must_change_password', 'password_reset_at', 'password_changed_at'])
                : null;
            $resetExisting = (bool) $this->option('reset');

            if (! $authUserId) {
                try {
                    $authUserId = $this->supabaseAdmin->createUser($opsId.'@backroom.soc5.internal', $initialPassword, ['ops_id' => $opsId, 'account_type' => 'backroom']);
                } catch (\Throwable $exception) {
                    $this->error($opsId.': Supabase user creation failed');
                    $failed++;

                    continue;
                }
                $created++;
                $this->line($opsId.': initial password '.$initialPassword);
            } else {
                $mustChangePassword = (bool) ($existingProfile?->must_change_password ?? true);
                if ($resetExisting || $mustChangePassword) {
                    try {
                        $this->supabaseAdmin->updatePassword($authUserId, $initialPassword);
                    } catch (\Throwable) {
                        $this->error($opsId.': Supabase user password repair failed');
                        $failed++;

                        continue;
                    }

                    $this->line($opsId.': initial password '.$initialPassword);
                }

                $repaired++;
            }

            DB::transaction(function () use ($user, $authUserId, $opsId, $existingProfile, $resetExisting): void {
                $values = [
                    'id' => $authUserId,
                    'name' => $user->name,
                    'role' => 'ops_pic',
                    'email' => null,
                    'ops_id' => $opsId,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                if ($existingProfile === null || $resetExisting || (bool) $existingProfile->must_change_password) {
                    $values['must_change_password'] = true;
                    $values['password_reset_at'] = now();
                    $values['password_changed_at'] = null;
                }
                DB::table('profiles')->upsert([$values], ['id'], array_keys(array_diff_key($values, ['id' => true, 'created_at' => true])));

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
