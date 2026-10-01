<?php

namespace Tests\Feature;

use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Tests\TestCase;

final class ApiRulesTest extends TestCase
{
    public function test_versioned_and_legacy_collection_routes_use_the_same_handler(): void
    {
        $versioned = $this->route('GET', '/api/v1/users');
        $legacy = $this->route('GET', '/api/users');

        $this->assertSame($versioned->getActionName(), $legacy->getActionName());
        $this->assertStringContainsString('UserController@index', $versioned->getActionName());
    }

    public function test_versioned_request_routes_preserve_plural_resources_and_methods(): void
    {
        $collection = $this->route('GET', '/api/v1/requests');
        $filtered = $this->route('GET', '/api/v1/requests/metrics');
        $workflow = $this->route('POST', '/api/v1/requests/00000000-0000-0000-0000-000000000000/approve');

        $this->assertSame('api/v1/requests', $collection->uri());
        $this->assertSame('api/v1/requests/metrics', $filtered->uri());
        $this->assertContains('POST', $workflow->methods());
        $this->assertStringContainsString('RequestController@action', $workflow->getActionName());
    }

    private function route(string $method, string $uri): Route
    {
        return app('router')->getRoutes()->match(Request::create($uri, $method));
    }
}
