// Shared chat types for ws-copilot webapp and extension

export interface Source {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  sourceIndex?: number;
  url?: string;
  filename?: string;
  documentName?: string;
  hitCount?: number;
  chunkIndex?: number;
  pageNo?: number;
  modality?: string;
  imageUrl?: string;
}

export type ChatAnswerMode = 'docs_grounded' | 'insufficient_docs' | 'model_fallback' | 'web_agent_v4';
export type ChatAnswerModeReason =
  | 'supported_context'
  | 'no_relevant_context'
  | 'metadata_only_match'
  | 'insufficient_support'
  | 'document_refusal'
  | 'unsupported_answer'
  | 'fallback_disabled'
  | 'web_search'
  | 'web_search_no_results'
  | 'web_search_speed'
  | 'web_search_balanced'
  | 'web_search_quality'
  | 'agentic_navigation';

export type KnowledgeMode = 'docs_only' | 'docs_plus_model' | 'search';
export type RagKnowledgeMode = KnowledgeMode;
export type ChatMode = 'ask' | 'complete';

export interface ChatStreamError {
  code: string;
  message: string;
  recoverable: boolean;
}

export type ChatStreamEvent =
  | { type: 'status'; status: string }
  | { type: 'answer_mode'; answer_mode: ChatAnswerMode; reason?: ChatAnswerModeReason }
  | { type: 'mode_override'; from: KnowledgeMode; to: KnowledgeMode; reason?: string }
  | { type: 'token'; content: string }
  | { type: 'reasoning'; reasoning?: string; reasoning_end?: boolean }
  | { type: 'sources'; sources: Source[] }
  | { type: 'title'; content: string }
  | { type: 'title_fallback'; original_message: string }
  | { type: 'done' }
  | { type: 'error'; message?: string; error: ChatStreamError };

export interface ChatAttachment {
  kind: 'chat_upload';
  documentId?: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  excerpt?: string;
  sourceUrl?: string;
  previewImageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  sources?: Source[];
  answerMode?: ChatAnswerMode;
  answerModeReason?: ChatAnswerModeReason;
  reasoning?: string;
  timestamp?: number;
  createdAt?: Date;
  isStreaming?: boolean;
  streaming?: boolean;
}

export interface ChatRequest {
  query: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  promptAddition?: string;
  knowledgeMode?: RagKnowledgeMode;
  allowModelKnowledgeFallback?: boolean;
  retrievalRoute?: 'auto' | 'fast' | 'deep';
}
