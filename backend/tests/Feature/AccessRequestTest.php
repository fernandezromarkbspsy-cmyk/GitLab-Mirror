<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PDO;
use Tests\TestCase;

final class AccessRequestTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for access request tests.');
        }
        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');

        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('request_id')->nullable();
            $table->uuid('user_id')->nullable();
            $table->string('target_role')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
            $table->timestamps();
        });
    }

    public function test_non_fte_access_request_notifies_fte_account_managers(): void
    {
        $this->postJson('/api/access-requests', [
            'name' => 'Jane Doe',
            'ops_id' => 'OPS123',
        ])->assertCreated()->assertJson(['ok' => true]);

        $this->assertDatabaseCount('notifications', 2);
        $this->assertDatabaseHas('notifications', [
            'target_role' => 'fte_ops',
            'event_type' => 'BACKROOM_ACCESS_REQUESTED',
        ]);
        $this->assertDatabaseHas('notifications', [
            'target_role' => 'fte_mm',
            'body' => 'Jane Doe requested Backroom access with Ops ID ops123. Create the account from User Management after verification.',
        ]);
    }

    public function test_access_request_requires_a_valid_ops_id(): void
    {
        $this->postJson('/api/access-requests', [
            'name' => 'Jane Doe',
            'ops_id' => 'SOC5-0000',
        ])->assertUnprocessable()->assertJsonValidationErrors('ops_id');
    }
}
