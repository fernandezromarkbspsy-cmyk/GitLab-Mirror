<?php

namespace Tests\Feature;

use App\Features\Users\UserController;
use Illuminate\Database\QueryException;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

final class UserAuditAtomicityTest extends TestCase
{
    private string $userId;

    private string $actorId;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for user audit tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        config()->set('services.supabase.url', 'https://test-project.supabase.co');
        config()->set('services.supabase.service_key', 'test-service-key');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        $this->userId = (string) Str::uuid();
        $this->actorId = (string) Str::uuid();
        DB::table('profiles')->insert([
            'id' => $this->userId,
            'name' => 'Original name',
            'role' => 'ops_pic',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_profile_update_rolls_back_when_audit_insert_fails(): void
    {
        $this->expectException(QueryException::class);

        try {
            (new UserController)->update($this->request(), $this->userId);
        } finally {
            $this->assertDatabaseHas('profiles', [
                'id' => $this->userId,
                'name' => 'Original name',
                'role' => 'ops_pic',
            ]);
        }
    }

    public function test_profile_update_and_audit_commit_together(): void
    {
        Schema::create('user_events', function (Blueprint $table): void {
            $table->id();
            $table->uuid('user_id');
            $table->uuid('actor_id');
            $table->string('event_type');
            $table->text('metadata');
        });

        (new UserController)->update($this->request(), $this->userId);

        $this->assertDatabaseHas('profiles', ['id' => $this->userId, 'name' => 'Updated name']);
        $this->assertDatabaseHas('user_events', [
            'user_id' => $this->userId,
            'actor_id' => $this->actorId,
            'event_type' => 'USER_UPDATED',
        ]);
    }

    private function request(): Request
    {
        $request = Request::create('/api/users/'.$this->userId, 'PUT', [
            'name' => 'Updated name',
            'role' => 'fte_mm',
        ]);
        $request->attributes->set('actor', (object) ['id' => $this->actorId, 'role' => 'fte_ops']);

        return $request;
    }
}
