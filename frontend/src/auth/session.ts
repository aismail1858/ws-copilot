import type { AuthSession } from '@/types';

const AUTH_SESSION_KEY = 'ws-copilot-auth-session';
const AUTH_CHANGED_EVENT = 'ws-auth-changed';

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function getAuthSessionKey(): string {
  return AUTH_SESSION_KEY;
}

export function getAuthChangedEventName(): string {
  return AUTH_CHANGED_EVENT;
}

export function loadAuthSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function saveAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  notifyAuthChanged();
}

export function saveAuthSessionIfRefreshTokenMatches(
  session: AuthSession,
  expectedRefreshToken: string
): boolean {
  const current = loadAuthSession();
  if (!current) return false;
  if (current.refreshToken !== expectedRefreshToken) return false;
  saveAuthSession(session);
  return true;
}

export function clearAuthSession(): void {
  localStorage.removeItem(AUTH_SESSION_KEY);
  notifyAuthChanged();
}
