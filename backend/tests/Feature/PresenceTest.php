<?php

namespace Tests\Feature;

use App\Features\Approvals\PresenceController;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PDO;
use Tests\TestCase;

final class PresenceTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for isolated presence tests.');
        }
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        Schema::create('profiles', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function test_heartbeat_updates_one_profile_for_multiple_tabs(): void
    {
        $actorId = '11111111-1111-1111-1111-111111111111';
        DB::table('profiles')->insert(['id' => $actorId]);
        $request = Request::create('/api/v1/presence/heartbeat', 'POST');
        $request->attributes->set('actor', (object) ['id' => $actorId, 'role' => 'fte_ops']);

        $response = (new PresenceController)->heartbeat($request);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertNotNull(DB::table('profiles')->where('id', $actorId)->value('last_seen_at'));
        $this->assertSame(1, DB::table('profiles')->count());
    }
}
