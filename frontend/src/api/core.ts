import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSessionIfRefreshTokenMatches,
} from '@/auth/session';
import type { AppSettings } from '@/types';
import { defaultSettings } from '@/utils/settingsDefaults';
import { normalizeLoadedSettings } from '@/utils/settingsNormalization';

const SETTINGS_KEY = 'ws-copilot-settings';

const DEFAULT_FETCH_TIMEOUT_MS = 30_000;
const SSE_INACTIVITY_TIMEOUT_MS = 120_000;

export { defaultSettings };
export { DEFAULT_FETCH_TIMEOUT_MS, SSE_INACTIVITY_TIMEOUT_MS };

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const merged = { ...defaultSettings, ...parsed } as Partial<AppSettings>;
    return normalizeLoadedSettings(merged);
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function getBackendUrl(): string {
  const raw = (loadSettings().backendUrl || '').trim();
  if (!raw) return defaultSettings.backendUrl;
  if (!/^https?:\/\//i.test(raw)) return defaultSettings.backendUrl;
  return raw.replace(/\/$/, '');
}

export function getBackendBaseCandidates(): string[] {
  const configuredBackendUrl = (loadSettings().backendUrl || '').trim();
  const primary = getBackendUrl().replace(/\/$/, '');
  const candidates: string[] = [];
  if (import.meta.env.DEV && typeof window !== 'undefined' && !configuredBackendUrl) {
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      candidates.push(window.location.origin.replace(/\/$/, ''));
    }
  }
  candidates.push(primary);
  try {
    const parsed = new URL(primary);
    if (parsed.hostname.toLowerCase() === 'localhost') {
      parsed.hostname = '127.0.0.1';
      candidates.push(parsed.toString().replace(/\/$/, ''));
    }
  } catch {
    // Keep primary only if URL parsing fails.
  }
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') {
      candidates.push(window.location.origin.replace(/\/$/, ''));
    }
  }
  return Array.from(new Set(candidates));
}

export type SourceFocusTarget =
  | string
  | {
      documentId?: string;
      excerpt?: string;
      chunkIndex?: number;
      pageNo?: number;
    };

function normalizeSourceFocusTarget(target?: SourceFocusTarget): {
  documentId?: string;
  excerpt?: string;
  chunkIndex?: number;
  pageNo?: number;
} {
  if (typeof target === 'string') {
    const documentId = target.trim();
    return documentId ? { documentId } : {};
  }
  const documentId = (target?.documentId || '').trim();
  const excerpt = (target?.excerpt || '').trim();
  return {
    documentId: documentId || undefined,
    excerpt: excerpt || undefined,
    chunkIndex: typeof target?.chunkIndex === 'number' ? target.chunkIndex : undefined,
    pageNo: typeof target?.pageNo === 'number' ? target.pageNo : undefined,
  };
}

function appendSourceFocusParams(
  url: URL,
  target: {
    chunkIndex?: number;
    pageNo?: number;
  }
): URL {
  if (typeof target.chunkIndex === 'number' && Number.isFinite(target.chunkIndex)) {
    url.searchParams.set('chunk', String(Math.trunc(target.chunkIndex)));
  }
  if (typeof target.pageNo === 'number' && Number.isFinite(target.pageNo) && target.pageNo > 0) {
    url.searchParams.set('page', String(Math.trunc(target.pageNo)));
  }
  return url;
}

export function buildSourceViewHref(target?: SourceFocusTarget): string | undefined {
  const focusTarget = normalizeSourceFocusTarget(target);
  const normalizedDocumentId = (focusTarget.documentId || '').trim();
  if (!normalizedDocumentId || normalizedDocumentId.startsWith('chat-upload:')) {
    return undefined;
  }
  const url = new URL(
    `/source-view/${encodeURIComponent(normalizedDocumentId)}`,
    window.location.origin
  );
  return appendSourceFocusParams(url, focusTarget).toString();
}

export function resolveSourceHref(
  rawUrl?: string,
  target?: SourceFocusTarget
): string | undefined {
  const focusTarget = normalizeSourceFocusTarget(target);
  const value = (rawUrl || '').trim();
  if (!value) return buildSourceViewHref(focusTarget);
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/api/')) {
    return `${getBackendUrl()}${value}`;
  }
  if (value.startsWith('/')) {
    const url = new URL(value, window.location.origin);
    return appendSourceFocusParams(url, focusTarget).toString();
  }
  return buildSourceViewHref(focusTarget);
}

let refreshInFlight: Promise<boolean> | null = null;

function toHeadersRecord(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function combineAbortSignals(left: AbortSignal, right: AbortSignal): AbortSignal {
  const signalCtor = AbortSignal as typeof AbortSignal & {
    any?: (signals: AbortSignal[]) => AbortSignal;
  };
  if (typeof signalCtor.any === 'function') {
    return signalCtor.any([left, right]);
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  if (left.aborted || right.aborted) {
    controller.abort();
    return controller.signal;
  }
  left.addEventListener('abort', abort, { once: true });
  right.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

async function refreshAuthSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = loadAuthSession();
    if (!session) return false;
    const expectedRefreshToken = session.refreshToken;

    let res: Response | null = null;
    for (const base of getBackendBaseCandidates()) {
      try {
        res = await fetch(`${base}/api/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
        break;
      } catch {
        // Try the next backend candidate (e.g. localhost -> 127.0.0.1).
      }
    }

    if (!res) {
      return false;
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearAuthSession();
      }
      return false;
    }

    const next = await res.json();
    return saveAuthSessionIfRefreshTokenMatches(next, expectedRefreshToken);
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

export async function fetchWithAuth(
  path: string,
  init: RequestInit = {},
  retry = true,
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  // Auth läuft primär über das Session-Cookie (gesetzt von /api/auth/login, siehe AuthContext).
  // Der Bearer aus localStorage ist optionales Legacy; das Backend akzeptiert beides
  // (jwtAuth._decode_token: Cookie zuerst, dann Bearer). Ein fehlender localStorage-Token
  // darf NICHT hart werfen — sonst ist jeder Cookie-Login "Not authenticated" (OQ-ARCH-001).
  const session = loadAuthSession();
  const headers = toHeadersRecord(init.headers);
  if (session?.accessToken) {
    headers.Authorization = `Bearer ${session.accessToken}`;
  }

  const ownController = new AbortController();
  const timeoutId = setTimeout(() => ownController.abort(), timeoutMs);

  let combinedSignal: AbortSignal;
  if (init.signal) {
    combinedSignal = combineAbortSignals(init.signal, ownController.signal);
  } else {
    combinedSignal = ownController.signal;
  }

  const backendBases = getBackendBaseCandidates();
  let res: Response | null = null;
  let lastError: unknown = null;
  for (const base of backendBases) {
    try {
      res = await fetch(`${base}${path}`, {
        ...init,
        headers,
        credentials: 'include',
        signal: combinedSignal,
      });
      break;
    } catch (err) {
      lastError = err;
      console.warn('[api] fetch candidate failed', { base, path, error: String(err) });
    }
  }

  clearTimeout(timeoutId);

  if (!res) {
    if (ownController.signal.aborted) {
      throw new DOMException('Request timed out', 'TimeoutError');
    }
    console.error('[api] all backend candidates failed', {
      path,
      candidates: backendBases,
      lastError: String(lastError),
    });
    throw new Error(
      `Backend nicht erreichbar oder CORS blockiert (${backendBases.map((base) => `${base}${path}`).join(' | ')}).`
    );
  }

  if (!res.ok && res.status !== 401) {
    console.warn('[api] request returned non-ok status', {
      path,
      status: res.status,
      statusText: res.statusText,
      url: res.url,
    });
  }

  if (res.status === 401 && retry) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      return fetchWithAuth(path, init, false, timeoutMs);
    }
  }
  if (res.status === 401) {
    clearAuthSession();
  }
  return res;
}

export type UploadProgressCallback = (progressPercent: number) => void;

function parseXhrResponseHeaders(rawHeaders: string): Headers {
  const headers = new Headers();
  const lines = rawHeaders.trim().split(/\r?\n/);
  for (const line of lines) {
    const delimiterIndex = line.indexOf(':');
    if (delimiterIndex <= 0) continue;
    const key = line.slice(0, delimiterIndex).trim();
    const value = line.slice(delimiterIndex + 1).trim();
    if (!key) continue;
    headers.append(key, value);
  }
  return headers;
}

export async function postFormWithAuthProgress(
  path: string,
  body: FormData,
  onUploadProgress?: UploadProgressCallback,
  retry = true
): Promise<Response> {
  // Auth via Session-Cookie (siehe fetchWithAuth); Bearer optional. Cookie wird über
  // withCredentials zuverlässig gesendet (same-origin dev proxy UND cross-origin prod).
  const session = loadAuthSession();
  const backendBases = getBackendBaseCandidates();
  let res: Response | null = null;
  for (const base of backendBases) {
    try {
      res = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${base}${path}`);
        xhr.withCredentials = true;
        xhr.responseType = 'text';
        if (session?.accessToken) {
          xhr.setRequestHeader('Authorization', `Bearer ${session.accessToken}`);
        }

        if (onUploadProgress) {
          xhr.upload.onprogress = (event) => {
            if (!event.lengthComputable || event.total <= 0) return;
            const ratio = event.loaded / event.total;
            const percent = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
            onUploadProgress(percent);
          };
        }

        xhr.onerror = () => reject(new Error('Network request failed'));
        xhr.onabort = () => reject(new Error('Upload aborted'));
        xhr.onload = () => {
          if (xhr.status === 0) {
            reject(new Error('Network request failed'));
            return;
          }
          resolve(
            new Response(xhr.responseText ?? '', {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: parseXhrResponseHeaders(xhr.getAllResponseHeaders()),
            })
          );
        };

        xhr.send(body);
      });
      break;
    } catch {
      // Try next backend host candidate (localhost <-> 127.0.0.1).
    }
  }

  if (!res) {
    throw new Error(
      `Backend nicht erreichbar oder CORS blockiert (${backendBases.map((base) => `${base}${path}`).join(' | ')}).`
    );
  }

  if (res.status === 401 && retry) {
    const refreshed = await refreshAuthSession();
    if (refreshed) {
      return postFormWithAuthProgress(path, body, onUploadProgress, false);
    }
  }
  if (res.status === 401) {
    clearAuthSession();
  }
  return res;
}
