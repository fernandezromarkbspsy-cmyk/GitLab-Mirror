<?php

namespace Tests\Feature;

use App\Support\AuthenticatedProfileCache;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PDO;
use Tests\TestCase;

final class AuthenticatedProfileCacheTest extends TestCase
{
    private const ID = '00000000-0000-0000-0000-000000000001';

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for profile-cache tests.');
        }

        config()->set([
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => ':memory:',
            'services.supabase.profile_cache_ttl' => 5,
        ]);
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        Cache::flush();
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->string('email')->nullable();
            $table->string('ops_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('password_reset_at')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->timestamp('created_at')->nullable();
        });
        DB::table('profiles')->insert([
            'id' => self::ID,
            'name' => 'Cached User',
            'role' => 'ops_pic',
            'is_active' => true,
            'must_change_password' => false,
            'created_at' => now(),
        ]);
    }

    public function test_active_profile_is_loaded_once_within_its_short_cache_ttl(): void
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        $first = AuthenticatedProfileCache::findActive(self::ID);
        $second = AuthenticatedProfileCache::findActive(self::ID);

        $this->assertSame('Cached User', $first->name);
        $this->assertSame('Cached User', $second->name);
        $this->assertCount(1, DB::getQueryLog());
    }

    public function test_invalidation_makes_a_deactivated_profile_unavailable_immediately(): void
    {
        AuthenticatedProfileCache::findActive(self::ID);
        DB::table('profiles')->where('id', self::ID)->update(['is_active' => false]);
        AuthenticatedProfileCache::forget(self::ID);

        $this->assertNull(AuthenticatedProfileCache::findActive(self::ID));
    }
}
