<?php

namespace Tests\Feature;

use App\Features\Dispatch\DispatchController;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PDO;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class DispatchAuthorizationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for dispatch authorization tests.');
        }

        config()->set('database.default', 'sqlite');
        config()->set('database.connections.sqlite.database', ':memory:');
        DB::purge('sqlite');
        DB::reconnect('sqlite');
        Schema::create('intraday_dispatch', function (Blueprint $table): void {
            $table->id();
            $table->date('dispatch_date');
            $table->integer('hour');
            $table->decimal('order_qty');
            $table->timestamp('synced_at');
        });
    }

    public function test_non_fte_role_cannot_read_intraday_dispatch(): void
    {
        $request = Request::create('/api/dispatch/intraday?date=2026-09-19', 'GET', ['date' => '2026-09-19']);
        $request->attributes->set('actor', (object) ['id' => 'ops-user', 'role' => 'ops_pic']);

        try {
            (new DispatchController)->intraday($request);
            $this->fail('Ops PIC should not be able to read intraday dispatch data.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
    }

    public function test_doc_officer_cannot_read_intraday_dispatch(): void
    {
        $request = Request::create('/api/dispatch/intraday?date=2026-09-19', 'GET', ['date' => '2026-09-19']);
        $request->attributes->set('actor', (object) ['id' => 'doc-user', 'role' => 'doc_officer']);

        try {
            (new DispatchController)->intraday($request);
            $this->fail('Doc Officer should not be able to read intraday dispatch data.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
    }

    public function test_fte_role_can_read_intraday_dispatch(): void
    {
        $request = Request::create('/api/dispatch/intraday?date=2026-09-19', 'GET', ['date' => '2026-09-19']);
        $request->attributes->set('actor', (object) ['id' => 'fte-user', 'role' => 'fte_mm']);

        $response = (new DispatchController)->intraday($request);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(24, $response->getData(true)['data']);
    }

    public function test_fte_ops_role_can_read_intraday_dispatch(): void
    {
        $request = Request::create('/api/dispatch/intraday?date=2026-09-19', 'GET', ['date' => '2026-09-19']);
        $request->attributes->set('actor', (object) ['id' => 'fte-ops-user', 'role' => 'fte_ops']);

        $response = (new DispatchController)->intraday($request);

        $this->assertSame(200, $response->getStatusCode());
        $this->assertCount(24, $response->getData(true)['data']);
    }
}
