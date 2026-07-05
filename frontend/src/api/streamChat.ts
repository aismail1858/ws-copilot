import type { Source } from '../lib/types';

export interface StreamChatPayload {
  chatId: string;
  content: string;
  model_id?: string;
}

export interface StreamChatDonePayload {
  userMessage?: unknown;
  aiMessage?: {
    id?: string;
    content?: string;
    citations?: BackendCitation[];
    [key: string]: unknown;
  };
}

export interface StreamChatCallbacks {
  onToken: (token: string) => void;
  onStatus?: (status: string) => void;
  onSources?: (sources: Source[]) => void;
  onDone?: (payload: StreamChatDonePayload) => void;
  onError: (message: string) => void;
}

interface BackendCitation {
  chunk_id?: string;
  document_id?: string;
  filename?: string;
  page?: number | string;
}

const SSE_INACTIVITY_TIMEOUT_MS = 120_000;

function toNumber(value: unknown): number | undefined {
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
}

export function mapCitationsToSources(citations: unknown): Source[] {
  if (!Array.isArray(citations)) return [];
  return citations
    .filter((c): c is BackendCitation => typeof c === 'object' && c !== null)
    .map((c) => {
      const filename = typeof c.filename === 'string' ? c.filename : 'Unknown Document';
      return {
        documentId: typeof c.document_id === 'string' ? c.document_id : '',
        title: filename,
        documentName: filename,
        filename,
        excerpt: '',
        score: 0,
        pageNo: toNumber(c.page),
        chunkIndex: undefined,
      };
    })
    .filter((s) => s.documentId || s.filename);
}

export function streamChatMessage(payload: StreamChatPayload, callbacks: StreamChatCallbacks): AbortController {
  const controller = new AbortController();

  void (async () => {
    let inactivityTimer: ReturnType<typeof setTimeout> | null = null;

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        try { controller.abort(); } catch { /* noop */ }
        callbacks.onError(
          'Stream-Inaktivitaets-Timeout: keine Daten vom Server fuer ueber '
          + `${Math.round(SSE_INACTIVITY_TIMEOUT_MS / 1000)}s. Bitte erneut versuchen.`
        );
      }, SSE_INACTIVITY_TIMEOUT_MS);
    };

    try {
      resetInactivityTimer();

      const res = await fetch(
        `/api/chats/${payload.chatId}/messages/stream`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content: payload.content, model_id: payload.model_id }),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => res.statusText);
        callbacks.onError(`Fehler ${res.status}: ${detail}`);
        return;
      }

      if (!res.body) {
        callbacks.onError('Kein Response-Body vom Server.');
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        resetInactivityTimer();

        buffer += decoder.decode(value, { stream: true });
        const eventBlocks = buffer.split('\n\n');
        buffer = eventBlocks.pop() ?? '';

        for (const block of eventBlocks) {
          const parsed = parseSseBlock(block);
          if (!parsed) continue;
          const stop = dispatchEvent(parsed.event, parsed.data, callbacks);
          if (stop) return;
        }
      }

      callbacks.onDone?.({});
    } catch (err: unknown) {
      if ((err as { name?: string }).name === 'AbortError') return;
      callbacks.onError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (inactivityTimer) clearTimeout(inactivityTimer);
    }
  })();

  return controller;
}

function parseSseBlock(block: string): { event: string; data: unknown } | null {
  let event = 'message';
  const dataParts: string[] = [];

  for (const rawLine of block.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataParts.push(line.slice(5).replace(/^\s/, ''));
    }
  }

  if (dataParts.length === 0) return null;
  const dataStr = dataParts.join('\n').trim();
  if (!dataStr || dataStr === '[DONE]') return { event, data: null };

  try {
    return { event, data: JSON.parse(dataStr) };
  } catch {
    return { event, data: dataStr };
  }
}

function dispatchEvent(
  event: string,
  data: unknown,
  callbacks: StreamChatCallbacks
): boolean {
  const obj = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;

  if (event === 'token') {
    const content = typeof obj.content === 'string' ? obj.content : '';
    if (content) callbacks.onToken(content);
    return false;
  }
  if (event === 'status') {
    const status = typeof obj.status === 'string' ? obj.status : '';
    if (status) callbacks.onStatus?.(status);
    return false;
  }
  if (event === 'error') {
    const message = typeof obj.message === 'string' ? obj.message : 'Stream error';
    callbacks.onError(message);
    return true;
  }
  if (event === 'done') {
    const aiMessage = obj.aiMessage as StreamChatDonePayload['aiMessage'] | undefined;
    const citations = aiMessage?.citations;
    if (citations) callbacks.onSources?.(mapCitationsToSources(citations));
    callbacks.onDone?.({ userMessage: obj.userMessage, aiMessage });
    return true;
  }
  return false;
}
