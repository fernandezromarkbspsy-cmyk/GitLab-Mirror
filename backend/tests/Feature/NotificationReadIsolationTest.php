<?php

namespace Tests\Feature;

use App\Features\Notifications\NotificationController;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class NotificationReadIsolationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for notification receipt tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        Schema::create('notifications', function (Blueprint $table): void {
            $table->id();
            $table->uuid('user_id')->nullable();
            $table->string('target_role')->nullable();
            $table->uuid('request_id')->nullable();
            $table->string('event_type');
            $table->string('title');
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });
        Schema::create('notification_reads', function (Blueprint $table): void {
            $table->unsignedBigInteger('notification_id');
            $table->uuid('user_id');
            $table->timestamp('read_at');
            $table->primary(['notification_id', 'user_id']);
        });
    }

    public function test_reading_a_role_notification_does_not_mark_it_read_for_a_colleague(): void
    {
        $notificationId = DB::table('notifications')->insertGetId([
            'target_role' => 'fte_ops',
            'event_type' => 'REQUEST_CREATED',
            'title' => 'New request',
            'body' => 'A request needs review.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $controller = new NotificationController;

        $controller->read($this->request('fte-one'), $notificationId);

        $first = $controller->index($this->request('fte-one'))->getData(true);
        $second = $controller->index($this->request('fte-two'))->getData(true);
        $this->assertNotNull($first['data'][0]['read_at']);
        $this->assertSame(0, $first['unread']);
        $this->assertNull($second['data'][0]['read_at']);
        $this->assertSame(1, $second['unread']);
        $this->assertDatabaseCount('notification_reads', 1);
    }

    private function request(string $id): Request
    {
        $request = Request::create('/api/notifications', 'GET');
        $request->attributes->set('actor', (object) ['id' => $id, 'role' => 'fte_ops']);

        return $request;
    }
}
