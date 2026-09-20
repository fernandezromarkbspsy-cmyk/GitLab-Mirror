import { supabase } from './supabase';
import { useUiStore } from '../stores/ui';

const base = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  let response: Response;
  try {
    const viewRole = useUiStore.getState().viewRole;
    const method = (init.method ?? 'GET').toUpperCase();
    const idempotencyKey = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
      ? (init.headers instanceof Headers
        ? init.headers.get('Idempotency-Key') ?? crypto.randomUUID()
        : (typeof init.headers === 'object' && init.headers && 'Idempotency-Key' in init.headers
          ? (init.headers as Record<string, string>)['Idempotency-Key'] ?? crypto.randomUUID()
          : crypto.randomUUID()))
      : undefined;
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
    if (viewRole) headers.set('X-View-Role', viewRole);
    if (idempotencyKey) headers.set('Idempotency-Key', idempotencyKey);
    response = await fetch(`${base}${path}`, { ...init, headers });
  } catch {
    throw new ApiError('Network error. Check your connection and try again.', 0);
  }
  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
    ? body.message
    : `Request failed (${response.status})`;
  if (!response.ok) throw new ApiError(message, response.status);
  return body as T;
}
