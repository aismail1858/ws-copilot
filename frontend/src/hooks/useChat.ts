import { useState, useCallback, useRef, useEffect } from 'react';
import { streamChatMessage } from '@/api/streamChat';
import { createChat } from '@/api/chatsApi';
import type {
  ChatAttachment,
  ChatMessage,
  RagKnowledgeMode,
  SearchMode,
  Source,
} from '@/types';
import { dedupeSourcesByPage } from '../shared/src/utils/sourceDedup.js';
import {
  STREAM_FLUSH_INTERVAL_MS,
  STREAM_FLUSH_CHARS_PER_TICK,
  STREAM_INITIAL_BUFFER_MS,
} from '../shared/src/constants/chat.js';
import {
  CHAT_HISTORY_CHANGED_EVENT,
  CHAT_NEW_REQUESTED_EVENT,
  clearChatMessages,
  deriveFallbackThreadTitle,
  getActiveThreadId,
  loadChatMessages,
  saveChatMessages,
} from '@/chat/history';
import { getSelectedModelId } from '@/chat/selectedModel';
import { sanitizeLoadedChatMessages } from '@/features/chat/utils/messageSanitization';

// Backend ist Source of Truth (ADR-004 / A1 / CONFLICT-001): Der Chat-Stream läuft über
// POST /api/chats/{chatId}/messages/stream (cookie-auth), nicht mehr über den Phantom-Stub
// /api/v1/rag/query. Ein server-seitiger Chat wird beim ersten Senden eines Threads angelegt
// (create-on-first-send, Spiegelung des six-figure-rag-web-Patterns: Chat existiert VOR dem Stream).
// Pro Thread halten wir die server-chatId im localStorage, damit jeder Thread seinen Chat behält.
const THREAD_CHATIDS_KEY = 'ws-copilot-thread-chatids';

function readThreadChatIdMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(THREAD_CHATIDS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function getThreadChatId(threadId: string): string | null {
  return readThreadChatIdMap()[threadId] ?? null;
}

function setThreadChatId(threadId: string, chatId: string): void {
  try {
    const map = readThreadChatIdMap();
    map[threadId] = chatId;
    localStorage.setItem(THREAD_CHATIDS_KEY, JSON.stringify(map));
  } catch {
    // localStorage nicht verfügbar — Chat läuft trotzdem (nur ohne thread-stabiles Mapping).
  }
}

let msgCounter = 0;
function uid() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

export interface SendMessageOptions {
  knowledgeMode?: RagKnowledgeMode;
  searchMode?: SearchMode;
  attachments?: ChatAttachment[];
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => sanitizeLoadedChatMessages(loadChatMessages()));
  const messagesRef = useRef<ChatMessage[]>(messages);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const activeAssistantIdRef = useRef<string | null>(null);
  const activeUserMsgIdRef = useRef<string | null>(null);
  const reasoningBufferRef = useRef('');
  const pendingSourcesRef = useRef<Source[] | null>(null);
  const streamCompletedRef = useRef(false);
  const pendingTokenBufferRef = useRef('');
  const flushTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingTokens = useCallback((maxChars?: number): boolean => {
    const assistantId = activeAssistantIdRef.current;
    const pending = pendingTokenBufferRef.current;
    if (!assistantId || !pending) return false;

    let chunk = pending;
    if (typeof maxChars === 'number' && maxChars > 0 && pending.length > maxChars) {
      // Find the last space within the allowed range to avoid splitting mid-word
      // or detaching a space from its preceding word (causes "missing space" glitch).
      let splitPos = -1;
      for (let i = maxChars; i >= Math.max(1, maxChars - 20); i--) {
        if (pending[i] === ' ') {
          splitPos = i + 1; // include the space in the flushed chunk
          break;
        }
      }
      if (splitPos < 0) splitPos = maxChars;
      chunk = pending.slice(0, splitPos);
      pendingTokenBufferRef.current = pending.slice(splitPos);
    } else {
      pendingTokenBufferRef.current = '';
    }

    if (!chunk) return false;
    setMessages((prev) =>
      prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
    );
    return true;
  }, []);

  const finishStreaming = useCallback(() => {
    const assistantId = activeAssistantIdRef.current;
    const userMsgId = activeUserMsgIdRef.current;
    if (!assistantId) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, streaming: false }
          : m.id === userMsgId && m.role === 'user'
            ? { ...m, status: 'sent' }
            : m
      )
    );
    activeAssistantIdRef.current = null;
    activeUserMsgIdRef.current = null;
    streamCompletedRef.current = false;
    pendingTokenBufferRef.current = '';
    setIsLoading(false);
  }, []);

  const clearFlushTimer = useCallback(() => {
    if (!flushTimeoutRef.current) return;
    clearTimeout(flushTimeoutRef.current);
    flushTimeoutRef.current = null;
  }, []);

  const scheduleFlush = useCallback((delayMs = STREAM_FLUSH_INTERVAL_MS) => {
    if (flushTimeoutRef.current) return;
    flushTimeoutRef.current = setTimeout(() => {
      flushTimeoutRef.current = null;
      flushPendingTokens(STREAM_FLUSH_CHARS_PER_TICK);

      if (pendingTokenBufferRef.current) {
        scheduleFlush();
        return;
      }

      if (streamCompletedRef.current) {
        finishStreaming();
      }
    }, delayMs);
  }, [finishStreaming, flushPendingTokens]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (messages.some((m) => m.streaming)) return;
    saveChatMessages(messages);
  }, [messages]);

  useEffect(() => {
    const onNewChatRequested = () => {
      abortRef.current?.abort();
      clearFlushTimer();
      flushPendingTokens();
      activeAssistantIdRef.current = null;
      streamCompletedRef.current = false;
      pendingTokenBufferRef.current = '';
      reasoningBufferRef.current = '';
      pendingSourcesRef.current = null;
      setMessages(sanitizeLoadedChatMessages(loadChatMessages()));
      setIsLoading(false);
    };

    window.addEventListener(CHAT_NEW_REQUESTED_EVENT, onNewChatRequested);
    return () => window.removeEventListener(CHAT_NEW_REQUESTED_EVENT, onNewChatRequested);
  }, [clearFlushTimer, flushPendingTokens]);

  useEffect(() => {
    const onHistoryChanged = () => {
      // Skip reloading messages while we're actively streaming/chatting
      // The current state is already correct and we don't want to overwrite it
      // with stale data from localStorage (which hasn't been saved yet during streaming)
      if (isLoading) {
        console.log('[useChat onHistoryChanged] Skipping reload during active chat (isLoading=true)');
        return;
      }
      const next = sanitizeLoadedChatMessages(loadChatMessages());
      const currentJson = JSON.stringify(messagesRef.current);
      const nextJson = JSON.stringify(next);
      if (currentJson === nextJson) return;
      console.log('[useChat onHistoryChanged] Reloading messages from history change');
      setMessages(next);
    };

    window.addEventListener(CHAT_HISTORY_CHANGED_EVENT, onHistoryChanged);
    return () => window.removeEventListener(CHAT_HISTORY_CHANGED_EVENT, onHistoryChanged);
  }, [isLoading]);

  useEffect(() => () => clearFlushTimer(), [clearFlushTimer]);

  const sendMessage = useCallback(
    (query: string, options: SendMessageOptions = {}) => {
      if (!query.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: query.trim(),
        attachments: options.attachments && options.attachments.length > 0 ? options.attachments : undefined,
        createdAt: new Date(),
        status: 'pending',
      };
      const assistantId = uid();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt: new Date(),
        streaming: true,
      };
      activeAssistantIdRef.current = assistantId;
      activeUserMsgIdRef.current = userMsg.id;
      streamCompletedRef.current = false;
      pendingTokenBufferRef.current = '';
      reasoningBufferRef.current = '';
      pendingSourcesRef.current = null;

      const nextMessages = [...messages, userMsg, assistantMsg];
      setMessages(nextMessages);
      setIsLoading(true);

      // Force save on the first message of a virtual new chat so it appears in the sidebar immediately
      if (getActiveThreadId() === null) {
        saveChatMessages(nextMessages);
      }

      // Server-seitigen Chat für diesen Thread sicherstellen (create-on-first-send).
      const threadId = getActiveThreadId();
      const stream = async () => {
        let chatId = threadId ? getThreadChatId(threadId) : null;
        if (!chatId) {
          try {
            const created = await createChat({ title: deriveFallbackThreadTitle(query.trim()) });
            chatId = created.id;
            if (threadId) setThreadChatId(threadId, chatId);
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : 'Chat konnte nicht erstellt werden';
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: errMsg, streaming: false }
                  : m.id === userMsg.id
                    ? { ...m, status: 'failed' }
                    : m
              )
            );
            activeAssistantIdRef.current = null;
            activeUserMsgIdRef.current = null;
            setIsLoading(false);
            return;
          }
        }

        abortRef.current = streamChatMessage(
          { chatId, content: query.trim(), model_id: getSelectedModelId() ?? undefined },
          {
            onToken: (token) => {
              const wasEmpty = pendingTokenBufferRef.current.length === 0;
              pendingTokenBufferRef.current += token;
              scheduleFlush(wasEmpty ? STREAM_INITIAL_BUFFER_MS : STREAM_FLUSH_INTERVAL_MS);
            },
            onSources: (sources: Source[]) => {
              const uniqueSources = dedupeSourcesByPage(sources);
              pendingSourcesRef.current = uniqueSources;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, sources: uniqueSources } : m))
              );
            },
            onDone: () => {
              streamCompletedRef.current = true;
              scheduleFlush();
              pendingSourcesRef.current = null;
            },
            onError: (err: string) => {
              clearFlushTimer();
              pendingTokenBufferRef.current = '';
              pendingSourcesRef.current = null;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: err, streaming: false }
                    : m.id === userMsg.id
                      ? { ...m, status: 'failed' }
                      : m
                )
              );
              activeAssistantIdRef.current = null;
              activeUserMsgIdRef.current = null;
              streamCompletedRef.current = false;
              setIsLoading(false);
            },
          }
        );
      };

      void stream();
    },
    [messages, isLoading, scheduleFlush, clearFlushTimer, flushPendingTokens]
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    clearFlushTimer();
    flushPendingTokens();
    const userMsgId = activeUserMsgIdRef.current;
    activeAssistantIdRef.current = null;
    activeUserMsgIdRef.current = null;
    streamCompletedRef.current = false;
    pendingTokenBufferRef.current = '';
    reasoningBufferRef.current = '';
    pendingSourcesRef.current = null;
    setMessages((prev) =>
      prev.map((m) =>
        m.id === userMsgId && m.role === 'user'
          ? { ...m, status: 'sent' }
          : m.streaming
            ? { ...m, streaming: false }
            : m
      )
    );
    setIsLoading(false);
  }, [clearFlushTimer, flushPendingTokens]);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    clearFlushTimer();
    flushPendingTokens();
    activeAssistantIdRef.current = null;
    streamCompletedRef.current = false;
    pendingTokenBufferRef.current = '';
    reasoningBufferRef.current = '';
    pendingSourcesRef.current = null;
    setMessages([]);
    setIsLoading(false);
    clearChatMessages();
  }, [clearFlushTimer, flushPendingTokens]);

  return { messages, isLoading, sendMessage, stopStreaming, clearMessages };
}
