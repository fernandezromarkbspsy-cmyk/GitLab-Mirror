<?php

namespace App\Integrations;

use Illuminate\Support\Facades\Http;
use Throwable;

final class SupabaseAdminClient
{
    private string $url;

    private string $key;

    public function __construct()
    {
        $this->url = rtrim((string) config('services.supabase.url'), '/');
        $this->key = (string) config('services.supabase.service_key');

        if ($this->url === '' || $this->key === '') {
            throw new SupabaseAdminException('Supabase admin credentials are not configured.');
        }
    }

    public function createUser(string $email, string $password, array $metadata = []): string
    {
        $response = $this->request('post', '/auth/v1/admin/users', [
            'email' => $email,
            'password' => $password,
            'email_confirm' => true,
            'user_metadata' => $metadata,
        ]);
        $id = $response->json('id');

        if (! is_string($id) || $id === '') {
            throw new SupabaseAdminException('Supabase did not return an authentication user ID.', $response->status());
        }

        return $id;
    }

    public function updatePassword(string $userId, string $password): void
    {
        $this->request('put', '/auth/v1/admin/users/'.$userId, ['password' => $password]);
    }

    public function deleteUser(string $userId): void
    {
        $this->request('delete', '/auth/v1/admin/users/'.$userId);
    }

    private function request(string $method, string $path, array $payload = [])
    {
        try {
            $request = Http::withHeaders([
                'apikey' => $this->key,
                'Authorization' => 'Bearer '.$this->key,
            ])
                ->withOptions(SupabaseHttpOptions::guzzle())
                ->withOptions(['verify' => config('services.supabase.ca_bundle') ?: true])
                ->connectTimeout(config('services.supabase.connect_timeout', 5))
                ->timeout(config('services.supabase.timeout', 10));

            $response = $method === 'delete'
                ? $request->delete($this->url.$path)
                : $request->{$method}($this->url.$path, $payload);
        } catch (Throwable $exception) {
            throw new SupabaseAdminException('Unable to reach Supabase Admin API.', 0, $exception);
        }

        if (! $response->successful()) {
            throw new SupabaseAdminException('Supabase Admin API rejected the request.', $response->status());
        }

        return $response;
    }
}
