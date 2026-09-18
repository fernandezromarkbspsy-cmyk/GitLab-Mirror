<?php

namespace Tests\Unit;

use App\Services\AppwriteService;
use App\Services\ProfileRepository;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Mockery;
use Tests\TestCase;

final class ProfileRepositoryTest extends TestCase
{
    public function test_appwrite_user_id_resolves_to_appwrite_profile_row_id(): void
    {
        config()->set('services.auth.provider', 'appwrite');
        $appwrite = Mockery::mock(AppwriteService::class);
        $appwrite->shouldReceive('profileForUser')->once()->with('appwrite-user-1')->andReturn([
            '$id' => 'appwrite-user-1', 'name' => 'Ops User', 'role' => 'ops_pic', 'is_active' => true,
        ]);

        $profile = (new ProfileRepository($appwrite))->forAuthenticatedUser('appwrite-user-1');

        $this->assertSame('appwrite-user-1', $profile->id);
        $this->assertSame('Ops User', $profile->name);
    }

    public function test_missing_appwrite_profile_returns_null(): void
    {
        config()->set('services.auth.provider', 'appwrite');
        $appwrite = Mockery::mock(AppwriteService::class);
        $appwrite->shouldReceive('profileForUser')->once()->with('missing-user')->andReturn(null);

        $this->assertNull((new ProfileRepository($appwrite))->forAuthenticatedUser('missing-user'));
    }

    public function test_appwrite_password_state_is_updated_in_appwrite_only(): void
    {
        config()->set('services.auth.provider', 'appwrite');
        $appwrite = Mockery::mock(AppwriteService::class);
        $appwrite->shouldReceive('updateRow')->once()->with(
            'profiles',
            'appwrite-user-1',
            Mockery::on(fn (array $data): bool => $data['must_change_password'] === false
                && is_string($data['password_changed_at'])
                && array_key_exists('updated_at', $data))
        );

        $this->assertSame(1, (new ProfileRepository($appwrite))->markPasswordChanged('appwrite-user-1'));
    }

    public function test_supabase_uuid_resolves_to_sql_profile(): void
    {
        $id = (string) Str::uuid();
        $query = $this->mockSqlProfileQuery((object) ['id' => $id, 'name' => 'FTE User', 'role' => 'fte_ops']);
        DB::shouldReceive('table')->once()->with('profiles')->andReturn($query);
        config()->set('services.auth.provider', 'supabase');

        $profile = (new ProfileRepository(Mockery::mock(AppwriteService::class)))->forAuthenticatedUser($id);

        $this->assertSame($id, $profile->id);
        $this->assertSame('FTE User', $profile->name);
    }

    public function test_missing_supabase_sql_profile_returns_null(): void
    {
        $query = $this->mockSqlProfileQuery(null);
        DB::shouldReceive('table')->once()->with('profiles')->andReturn($query);
        config()->set('services.auth.provider', 'supabase');

        $this->assertNull((new ProfileRepository(Mockery::mock(AppwriteService::class)))->forAuthenticatedUser((string) Str::uuid()));
    }

    private function mockSqlProfileQuery(?object $result): Builder
    {
        $query = Mockery::mock(Builder::class);
        $query->shouldReceive('select')->once()->andReturnSelf();
        $query->shouldReceive('where')->once()->with('id', Mockery::type('string'))->andReturnSelf();
        $query->shouldReceive('where')->once()->with('is_active', true)->andReturnSelf();
        $query->shouldReceive('first')->once()->andReturn($result);

        return $query;
    }
}
