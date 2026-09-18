<?php

namespace Tests\Feature;

use App\Http\Middleware\AuthenticateAppwrite;
use App\Http\Middleware\AuthenticateConfigured;
use App\Http\Middleware\AuthenticateSupabase;
use App\Services\AppwriteAuditService;
use App\Services\AppwriteService;
use App\Services\ProfileRepository;
use Illuminate\Http\Request;
use Tests\TestCase;

final class AuthenticateConfiguredProviderIsolationTest extends TestCase
{
    public function test_appwrite_mode_keeps_supabase_issued_fte_sessions_on_supabase_auth(): void
    {
        config()->set([
            'services.auth.provider' => 'appwrite',
            'services.supabase.url' => 'https://project.supabase.co',
            'services.supabase.anon_key' => 'publishable-key',
        ]);

        $payload = rtrim(strtr(base64_encode(json_encode(['iss' => 'https://project.supabase.co/auth/v1'])), '+/', '-_'), '=');
        $token = 'header.'.$payload.'.signature';
        $request = Request::create('/api/auth/me', 'GET');
        $request->headers->set('Authorization', 'Bearer '.$token);
        $configured = new AuthenticateConfigured(
            new AuthenticateSupabase(new ProfileRepository(new AppwriteService)),
            new AuthenticateAppwrite(new AppwriteService, new ProfileRepository(new AppwriteService), new AppwriteAuditService(new AppwriteService)),
        );
        $method = new \ReflectionMethod($configured, 'isSupabaseSession');
        $method->setAccessible(true);

        $this->assertTrue($method->invoke($configured, $request));
    }
}
