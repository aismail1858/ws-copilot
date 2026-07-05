/**
 * Shared streaming utilities for ws-copilot chat functionality.
 * Handles token buffering, flushing, and completion for SSE streaming.
 */

import type { ChatMessage } from '../types/chat.js';
import { STREAM_FLUSH_INTERVAL_MS, STREAM_FLUSH_CHARS_PER_TICK } from '../constants/chat.js';

/**
 * State refs for streaming operations.
 * In React, these would be useRef hooks; in vanilla JS, these are simple objects.
 */
export interface StreamingRefs {
  /** The ID of the currently streaming assistant message */
  activeAssistantId: string | null;
  /** Buffer for tokens that haven't been flushed yet */
  pendingTokenBuffer: string;
  /** Whether the stream has completed (tokens may still be buffered) */
  streamCompleted: boolean;
  /** Timer reference for the flush interval */
  flushTimeout: ReturnType<typeof setTimeout> | null;
}

/**
 * Create default streaming refs.
 */
export function createDefaultStreamingRefs(): StreamingRefs {
  return {
    activeAssistantId: null,
    pendingTokenBuffer: '',
    streamCompleted: false,
    flushTimeout: null,
  };
}

/**
 * Callbacks for streaming operations.
 * These must be provided by the caller to handle state updates.
 */
export interface StreamingCallbacks {
  /** Update a message in the message list */
  updateMessage: (messageId: string, updater: (message: ChatMessage) => ChatMessage) => void;
  /** Set the loading state */
  setIsLoading: (loading: boolean) => void;
  /** Clear the flush timer */
  clearTimer: () => void;
}

/**
 * Options for flush operations.
 */
export interface FlushOptions {
  /** Maximum number of characters to flush in this call */
  maxChars?: number;
}

/**
 * Flush pending tokens to the active assistant message.
 *
 * @param refs - The streaming refs containing pending tokens
 * @param callbacks - Callbacks for updating state
 * @param options - Optional max chars to flush
 * @returns true if tokens were flushed, false otherwise
 */
export function flushPendingTokens(
  refs: StreamingRefs,
  callbacks: StreamingCallbacks,
  options?: FlushOptions
): boolean {
  const { activeAssistantId, pendingTokenBuffer } = refs;
  const pending = pendingTokenBuffer;

  if (!activeAssistantId || !pending) return false;

  let chunk = pending;
  if (typeof options?.maxChars === 'number' && options.maxChars > 0 && pending.length > options.maxChars) {
    chunk = pending.slice(0, options.maxChars);
    refs.pendingTokenBuffer = pending.slice(options.maxChars);
  } else {
    refs.pendingTokenBuffer = '';
  }

  if (!chunk) return false;

  callbacks.updateMessage(activeAssistantId, (msg) => ({
    ...msg,
    content: msg.content + chunk,
    streaming: true,
  }));

  return true;
}

/**
 * Finish streaming for the current message.
 *
 * @param refs - The streaming refs to reset
 * @param callbacks - Callbacks for updating state
 */
export function finishStreaming(refs: StreamingRefs, callbacks: StreamingCallbacks): void {
  const { activeAssistantId } = refs;

  if (!activeAssistantId) return;

  callbacks.updateMessage(activeAssistantId, (msg) => ({
    ...msg,
    streaming: false,
  }));

  refs.activeAssistantId = null;
  refs.streamCompleted = false;
  refs.pendingTokenBuffer = '';
  callbacks.setIsLoading(false);
}

/**
 * Clear the flush timer.
 *
 * @param refs - The streaming refs containing the timer
 */
export function clearFlushTimer(refs: StreamingRefs): void {
  if (!refs.flushTimeout) return;
  clearTimeout(refs.flushTimeout);
  refs.flushTimeout = null;
}

/**
 * Schedule a flush operation.
 *
 * @param refs - The streaming refs
 * @param callbacks - Callbacks for updating state
 */
export function scheduleFlush(refs: StreamingRefs, callbacks: StreamingCallbacks): void {
  if (refs.flushTimeout) return;

  refs.flushTimeout = setTimeout(() => {
    refs.flushTimeout = null;
    flushPendingTokens(refs, callbacks, { maxChars: STREAM_FLUSH_CHARS_PER_TICK });

    if (refs.pendingTokenBuffer) {
      scheduleFlush(refs, callbacks);
      return;
    }

    if (refs.streamCompleted) {
      finishStreaming(refs, callbacks);
    }
  }, STREAM_FLUSH_INTERVAL_MS);
}

/**
 * Start streaming a new assistant message.
 *
 * @param refs - The streaming refs to initialize
 * @param assistantId - The ID of the assistant message to stream into
 */
export function startStreaming(refs: StreamingRefs, assistantId: string): void {
  refs.activeAssistantId = assistantId;
  refs.streamCompleted = false;
  refs.pendingTokenBuffer = '';
}

/**
 * Add a token to the pending buffer and schedule a flush.
 *
 * @param refs - The streaming refs
 * @param callbacks - Callbacks for updating state
 * @param token - The token to add
 */
export function addToken(refs: StreamingRefs, callbacks: StreamingCallbacks, token: string): void {
  refs.pendingTokenBuffer += token;

  // Immediately flush if no timer is running
  if (!refs.flushTimeout) {
    flushPendingTokens(refs, callbacks, { maxChars: STREAM_FLUSH_CHARS_PER_TICK });
  }

  scheduleFlush(refs, callbacks);
}

/**
 * Mark the stream as completed and schedule final flush.
 *
 * @param refs - The streaming refs
 * @param callbacks - Callbacks for updating state
 */
export function completeStream(refs: StreamingRefs, callbacks: StreamingCallbacks): void {
  refs.streamCompleted = true;
  scheduleFlush(refs, callbacks);
}

/**
 * Abort the current stream and clean up.
 *
 * @param refs - The streaming refs to reset
 * @param callbacks - Callbacks for updating state
 * @param setStreamingFlag - Optional callback to set streaming flag on messages
 */
export function abortStream(
  refs: StreamingRefs,
  callbacks: StreamingCallbacks,
  setStreamingFlag?: (streaming: boolean) => void
): void {
  clearFlushTimer(refs);
  flushPendingTokens(refs, callbacks);

  refs.activeAssistantId = null;
  refs.streamCompleted = false;
  refs.pendingTokenBuffer = '';

  callbacks.setIsLoading(false);

  if (setStreamingFlag) {
    setStreamingFlag(false);
  }
}

/**
 * Reset all streaming refs to default state.
 *
 * @param refs - The streaming refs to reset
 * @param callbacks - Callbacks for updating state
 */
export function resetStreaming(refs: StreamingRefs, callbacks: StreamingCallbacks): void {
  clearFlushTimer(refs);
  refs.activeAssistantId = null;
  refs.streamCompleted = false;
  refs.pendingTokenBuffer = '';
  callbacks.setIsLoading(false);
}
