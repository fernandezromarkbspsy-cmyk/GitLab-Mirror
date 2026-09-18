<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

final class IdempotencyMiddleware
{
    private const RETENTION_HOURS = 24;

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->headers->has('Idempotency-Key')) {
            return $next($request);
        }

        $key = trim((string) $request->header('Idempotency-Key'));
        abort_if($key === '' || strlen($key) > 255, 422, 'Idempotency-Key must be between 1 and 255 characters.');

        $actor = $request->attributes->get('actor');
        abort_unless($actor && filled($actor->id), 401, 'Authentication required.');

        $actorId = (string) $actor->id;
        $method = $request->method();
        $path = $request->path();
        $requestHash = $this->requestHash($request, $method, $path);

        return DB::transaction(function () use ($request, $next, $actorId, $key, $method, $path, $requestHash): Response {
            $now = now();
            DB::table('idempotency_keys')
                ->where('actor_id', $actorId)
                ->where('key', $key)
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', $now)
                ->delete();

            DB::table('idempotency_keys')->insertOrIgnore([
                'key' => $key,
                'actor_id' => $actorId,
                'method' => $method,
                'path' => $path,
                'request_hash' => $requestHash,
                'response_status' => null,
                'response_body' => null,
                'created_at' => $now,
                'expires_at' => $now->copy()->addHours(self::RETENTION_HOURS),
            ]);

            $record = DB::table('idempotency_keys')
                ->where('actor_id', $actorId)
                ->where('key', $key)
                ->lockForUpdate()
                ->first();

            abort_unless($record, 409, 'Unable to reserve the idempotency key.');

            if ((string) $record->request_hash !== $requestHash) {
                return response()->json(['message' => 'Idempotency key was already used with a different request.'], 409);
            }

            if ($record->response_status !== null) {
                return response()->json(
                    json_decode((string) $record->response_body, true, 512, JSON_THROW_ON_ERROR),
                    (int) $record->response_status
                );
            }

            $response = $next($request);
            if ($response->getStatusCode() >= 400) {
                DB::table('idempotency_keys')->where('id', $record->id)->delete();

                return $response;
            }

            try {
                $body = json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
                $encodedBody = json_encode($body, JSON_THROW_ON_ERROR);
            } catch (Throwable) {
                DB::table('idempotency_keys')->where('id', $record->id)->delete();

                return $response;
            }

            DB::table('idempotency_keys')->where('id', $record->id)->update([
                'response_status' => $response->getStatusCode(),
                'response_body' => $encodedBody,
                'expires_at' => $now->copy()->addHours(self::RETENTION_HOURS),
            ]);

            return $response;
        });
    }

    private function requestHash(Request $request, string $method, string $path): string
    {
        return hash('sha256', json_encode([
            'method' => $method,
            'path' => $path,
            'payload' => $this->normalize($request->all()),
        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    private function normalize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        if (array_is_list($value)) {
            return array_map(fn (mixed $item): mixed => $this->normalize($item), $value);
        }

        ksort($value);

        return array_map(fn (mixed $item): mixed => $this->normalize($item), $value);
    }
}
