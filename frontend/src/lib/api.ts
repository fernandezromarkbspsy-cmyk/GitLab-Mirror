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
    response = await fetch(`${base}${path}`, { ...init, headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(viewRole ? { 'X-View-Role': viewRole } : {}), ...init.headers } });
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
