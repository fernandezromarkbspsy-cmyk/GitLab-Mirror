<?php

namespace Tests\Feature;

use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/** @group postgres */
final class PostgresSchemaHardeningTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (getenv('POSTGRES_TESTS') !== '1' || ! in_array('pgsql', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('PostgreSQL integration tests are enabled only in the PostgreSQL CI job.');
        }

        config()->set('database.default', 'pgsql');
        DB::purge('pgsql');
        DB::reconnect('pgsql');
        Schema::dropIfExists('user_events');
        Schema::dropIfExists('user_imports');
        Schema::dropIfExists('profiles');
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('ops_id')->nullable();
        });
        Schema::create('user_imports', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('ops_id')->nullable();
        });
        Schema::create('user_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('actor_id')->nullable();
            $table->string('event_type');
        });
    }

    protected function tearDown(): void
    {
        if (getenv('POSTGRES_TESTS') === '1' && in_array('pgsql', \PDO::getAvailableDrivers(), true)) {
            Schema::dropIfExists('user_events');
            Schema::dropIfExists('user_imports');
            Schema::dropIfExists('profiles');
        }

        parent::tearDown();
    }

    public function test_identity_migration_enforces_case_insensitive_ops_ids_and_audit_events(): void
    {
        $migration = dirname(base_path()).'/supabase/migrations/019_identity_and_audit_hardening.sql';
        DB::unprepared((string) file_get_contents($migration));

        DB::table('profiles')->insert(['id' => '00000000-0000-0000-0000-000000000001', 'ops_id' => 'OPS123']);
        DB::table('user_events')->insert([
            'user_id' => '00000000-0000-0000-0000-000000000001',
            'event_type' => 'PASSWORD_RESET',
        ]);
        $this->assertDatabaseHas('user_events', ['event_type' => 'PASSWORD_RESET']);
        $this->expectException(QueryException::class);
        DB::table('profiles')->insert(['id' => '00000000-0000-0000-0000-000000000002', 'ops_id' => 'ops123']);
    }
}
