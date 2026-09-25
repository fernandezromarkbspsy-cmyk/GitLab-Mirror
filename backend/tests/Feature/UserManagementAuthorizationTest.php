<?php

namespace Tests\Feature;

use App\Features\Users\UserController;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use PDO;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;
use Throwable;

final class UserManagementAuthorizationTest extends TestCase
{
    private string $targetId;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            $this->markTestSkipped('The pdo_sqlite extension is required for user management tests.');
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
            $table->string('email')->nullable();
            $table->string('ops_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('must_change_password')->default(false);
            $table->timestamp('password_reset_at')->nullable();
            $table->timestamp('password_changed_at')->nullable();
            $table->timestamps();
        });
        $this->targetId = (string) Str::uuid();
        DB::table('profiles')->insert([
            'id' => $this->targetId,
            'name' => 'Target user',
            'role' => 'ops_pic',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_ops_pic_cannot_manage_users(): void
    {
        try {
            (new UserController)->disable($this->request('ops_pic'), $this->targetId);
            $this->fail('Expected user management authorization to be denied.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
    }

    public function test_profile_change_rolls_back_and_deletes_auth_user_when_audit_fails(): void
    {
        $authUserId = (string) Str::uuid();
        Http::fake([
            'https://test-project.supabase.co/auth/v1/admin/users' => Http::response(['id' => $authUserId]),
            'https://test-project.supabase.co/auth/v1/admin/users/*' => Http::response([], 204),
        ]);

        $request = Request::create('/api/users', 'POST', ['name' => 'New user', 'ops_id' => 'ops999']);
        $request->attributes->set('actor', (object) ['id' => (string) Str::uuid(), 'role' => 'fte_ops']);

        $this->expectException(Throwable::class);
        try {
            (new UserController)->store($request);
        } finally {
            $this->assertDatabaseMissing('profiles', ['id' => $authUserId]);
            Http::assertSent(fn ($sent) => $sent->method() === 'DELETE' && str_ends_with($sent->url(), '/'.$authUserId));
        }
    }

    private function request(string $role): Request
    {
        $request = Request::create('/api/users/'.$this->targetId.'/disable', 'PATCH');
        $request->attributes->set('actor', (object) ['id' => (string) Str::uuid(), 'role' => $role]);

        return $request;
    }
}
