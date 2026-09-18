const accessTokenKey = 'soc5.backend.access_token';
const authChangedEvent = 'soc5-backend-auth-changed';

export function getBackendAccessToken(): string | null {
  return window.localStorage.getItem(accessTokenKey);
}

export function setBackendAccessToken(accessToken: string): void {
  window.localStorage.setItem(accessTokenKey, accessToken);
  window.dispatchEvent(new Event(authChangedEvent));
}

export function clearBackendAccessToken(): void {
  window.localStorage.removeItem(accessTokenKey);
  window.dispatchEvent(new Event(authChangedEvent));
}

export function onBackendAuthChange(listener: () => void): () => void {
  window.addEventListener(authChangedEvent, listener);
  return () => window.removeEventListener(authChangedEvent, listener);
}
