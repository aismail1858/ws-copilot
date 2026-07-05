/**
 * Main entry point for @ws-copilot/shared package.
 */

// Types
export type {
  ChatAttachment,
  ChatAnswerMode,
  ChatAnswerModeReason,
  ChatStreamError,
  ChatStreamEvent,
  ChatMessage,
  Source,
  ChatRequest,
  RagKnowledgeMode,
  ChatMode,
  KnowledgeMode,
} from './types/chat.js';
export type { LlmProvider, EmbeddingProvider, CustomLlmProfile, BackendConfig, AuthState, Attachment, KnowledgeSource, CodeReviewFinding, ChatHistoryItem, MessageSource } from './types/config.js';
export type { ApiResponse, ApiErrorResponse, StreamEvent } from './types/api.js';

// Classes
export { ApiError } from './utils/errors.js';

// Utilities
export { isApiError, isAuthError, isNetworkError, isRateLimitError, isConfigError, handleApiError, normalizeChatErrorDetail, mapChatError, mapIngestionError } from './utils/errors.js';
export { flushPendingTokens, finishStreaming, clearFlushTimer, scheduleFlush, startStreaming, addToken, completeStream, abortStream, resetStreaming, createDefaultStreamingRefs } from './utils/streaming.js';
export type { StreamingRefs, StreamingCallbacks, FlushOptions } from './utils/streaming.js';
export { dedupeSourcesByPage } from './utils/sourceDedup.js';
export type { MessageSource as MessageSourceDedup } from './utils/sourceDedup.js';

// Constants
export { STREAM_FLUSH_INTERVAL_MS, STREAM_FLUSH_CHARS_PER_TICK, STREAM_INITIAL_BUFFER_MS, MODEL_OPTION_SEPARATOR, DEFAULT_MODELS, PROVIDER_LABELS, PROVIDER_COLORS } from './constants/chat.js';
