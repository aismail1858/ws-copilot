/**
 * Shared error handling utilities for ws-copilot webapp and extension.
 * Provides user-friendly error messages for chat and ingestion operations.
 */
/**
 * Custom API error class with status code and details.
 */
export class ApiError extends Error {
    constructor(message, statusCode, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = 'ApiError';
    }
}
/**
 * Backend client error with optional status and original error.
 */
export class BackendClientError extends Error {
    constructor(message, status, originalError) {
        super(message);
        this.status = status;
        this.originalError = originalError;
        this.name = 'BackendClientError';
    }
}
/**
 * Type guard to check if an error is an ApiError.
 */
export function isApiError(error) {
    return error instanceof ApiError;
}
/**
 * Type guard to check if an error is an authentication error.
 */
export function isAuthError(error) {
    if (isApiError(error)) {
        return error.statusCode === 401 || error.statusCode === 403;
    }
    return false;
}
/**
 * Type guard to check if an error is a network error.
 */
export function isNetworkError(error) {
    if (isApiError(error)) {
        return error.statusCode === 0 || error.statusCode >= 500;
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (message.includes('network') ||
            message.includes('fetch') ||
            message.includes('backend nicht erreichbar') ||
            message.includes('cors'));
    }
    return false;
}
/**
 * Type guard to check if an error is a rate limit error.
 */
export function isRateLimitError(error) {
    if (isApiError(error)) {
        return error.statusCode === 429;
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (message.includes('rate limit') ||
            message.includes('too many requests') ||
            message.includes('quota exceeded') ||
            message.includes('resourceexhausted'));
    }
    return false;
}
/**
 * Type guard to check if an error is a configuration error.
 */
export function isConfigError(error) {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (message.includes('not configured') ||
            message.includes('usable key/url') ||
            message.includes('configure the selected provider') ||
            message.includes('api-key') ||
            message.includes('api key') ||
            message.includes('authentifizierung'));
    }
    return false;
}
/**
 * Handle API errors by throwing a never-returning error.
 * This function is used to ensure all error paths are handled.
 */
export function handleApiError(error) {
    if (isApiError(error)) {
        throw error;
    }
    if (error instanceof Error) {
        throw new ApiError(error.message, 0, error.message);
    }
    throw new ApiError('Unknown error occurred', 0);
}
/**
 * Normalize chat error details from various formats.
 */
export function normalizeChatErrorDetail(raw) {
    const trimmed = (raw || '').trim();
    if (!trimmed)
        return '';
    try {
        const parsed = JSON.parse(trimmed);
        if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
            return parsed.detail.trim();
        }
        if (typeof parsed.message === 'string' && parsed.message.trim()) {
            return parsed.message.trim();
        }
    }
    catch {
        // Not a JSON payload.
    }
    const httpMatch = trimmed.match(/^HTTP\s+(\d+)\s*:?\s*(.*)$/i);
    if (httpMatch) {
        return (httpMatch[2] || '').trim();
    }
    return trimmed;
}
/**
 * Map HTTP status and error details to user-friendly chat error messages.
 */
export function mapChatError(status, rawDetail, requestId) {
    const detail = normalizeChatErrorDetail(rawDetail);
    const normalized = detail.toLowerCase();
    let message;
    // Authentication errors
    if (status === 401 ||
        normalized.includes('nicht eingeloggt') ||
        normalized.includes('session expired') ||
        normalized.includes('not authenticated')) {
        message = 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.';
    }
    // Rate limit errors
    else if (status === 429 && normalized.includes('monatliches tokenlimit erreicht')) {
        message = detail;
    }
    else if (status === 429 ||
        normalized.includes('resourceexhausted') ||
        normalized.includes('quota exceeded') ||
        normalized.includes('quota-limit') ||
        normalized.includes('rate limit') ||
        normalized.includes('too many requests')) {
        message =
            'Das ausgewählte Modell ist aktuell am Anfrage- oder Quota-Limit. ' +
                'Bitte später erneut versuchen oder einen anderen Provider wählen.';
    }
    // Configuration errors
    else if (normalized.includes('not configured') ||
        normalized.includes('usable key/url') ||
        normalized.includes('configure the selected provider') ||
        normalized.includes('api-key') ||
        normalized.includes('api key') ||
        normalized.includes('authentifizierung')) {
        message =
            'Der ausgewählte LLM-Provider ist nicht korrekt konfiguriert oder lehnt die ' +
                'Authentifizierung ab. Bitte prüfe Modell, URL und API-Key.';
    }
    // Network/Server errors
    else if (status === 503 ||
        normalized.includes('token usage store unavailable') ||
        normalized.includes('timeout') ||
        normalized.includes('timed out') ||
        normalized.includes('backend nicht erreichbar') ||
        normalized.includes('failed to fetch') ||
        normalized.includes('networkerror')) {
        message = 'Der Chat-Server oder der ausgewählte LLM-Provider ist aktuell nicht erreichbar. Bitte später erneut versuchen.';
    }
    // Empty response
    else if (normalized === 'no response body') {
        message = 'Der Chat-Server hat keine gültige Antwort geliefert. Bitte erneut versuchen.';
    }
    // Return detail if available
    else if (detail) {
        message = detail;
    }
    // Generic status error
    else if (typeof status === 'number') {
        message = `Die Chat-Anfrage ist fehlgeschlagen (HTTP ${status}).`;
    }
    else {
        message = 'Die Chat-Anfrage ist fehlgeschlagen. Bitte erneut versuchen.';
    }
    if (requestId) {
        message += ` [Ref: ${requestId.slice(0, 8)}]`;
    }
    return message;
}
/**
 * Map HTTP status and error details to user-friendly ingestion error messages.
 */
export function mapIngestionError(status, detail) {
    const normalized = detail.toLowerCase();
    // Storage service unavailable
    if (status === 503 &&
        (normalized.includes('storage temporarily unavailable') ||
            normalized.includes('minio_unavailable_inline_limit_exceeded'))) {
        return ('Upload aktuell nicht möglich: Der Storage-Dienst (MinIO) ist gerade nicht erreichbar ' +
            'und die Datei ist für den Inline-Fallback zu groß. Bitte später erneut versuchen oder eine kleinere Datei hochladen.');
    }
    // File too large
    if (status === 413 && normalized.includes('file too large')) {
        return `Upload abgelehnt: ${detail}`;
    }
    // Content too long
    if (status === 422 && normalized.includes('content too long')) {
        return `Dokument zu lang: ${detail}`;
    }
    // Duplicate document (409)
    if (status === 409) {
        if (normalized.includes('bereits hochgeladen') || normalized.includes('duplikat')) {
            return detail;
        }
        if (normalized.includes('läuft gerade')) {
            return detail;
        }
        return `Dokument bereits vorhanden: ${detail}`;
    }
    // Generic error
    return `HTTP ${status}: ${detail}`;
}
/**
 * Read and parse error details from an HTTP response.
 */
export async function readHttpErrorDetail(res) {
    const text = await res.text();
    if (!text)
        return 'Unbekannter Fehler';
    try {
        const parsed = JSON.parse(text);
        if (typeof parsed.detail === 'string' && parsed.detail.trim())
            return parsed.detail.trim();
        if (typeof parsed.message === 'string' && parsed.message.trim())
            return parsed.message.trim();
    }
    catch {
        // Non-JSON error payload.
    }
    return text;
}
//# sourceMappingURL=errors.js.map