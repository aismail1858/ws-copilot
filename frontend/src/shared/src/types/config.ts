// Shared configuration types for ws-copilot webapp and extension

import type { ChatMessage } from './chat.js';

export type LlmProvider = 'claude' | 'openai' | 'gemini' | 'ollama' | 'custom';
export type EmbeddingProvider = 'gemini' | 'openai' | 'ollama' | 'custom';

export interface CustomLlmProfile {
  id: string;
  label: string;
  model: string;
  url: string;
  apiKey: string;
}

export interface BackendConfig {
  // LLM Provider Settings
  defaultLlmProvider?: LlmProvider;
  anthropicModel?: string;
  anthropicAllowedModels?: string[];
  openaiModel?: string;
  openaiAllowedModels?: string[];
  googleModel?: string;
  googleAllowedModels?: string[];
  ollamaModel?: string;
  ollamaAllowedModels?: string[];
  customLlmModel?: string;
  customAllowedModels?: string[];

  // Embedding Settings
  defaultEmbeddingProvider?: EmbeddingProvider;

  // RAG Settings
  allowModelKnowledgeFallback?: boolean;

  // Additional settings can be added as needed
  [key: string]: unknown;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    id: string;
    email: string;
    role: 'admin' | 'user';
    displayName?: string | null;
    isActive: boolean;
  };
  isAdmin: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  type: 'local' | 'crawl' | 'url';
  status: 'online' | 'offline';
  url?: string;
}

export interface CodeReviewFinding {
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  line?: number;
  column?: number;
  file?: string;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  messages?: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface MessageSource {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  sourceIndex?: number;
  url?: string;
  hitCount?: number;
  chunkIndex?: number;
  pageNo?: number;
}

// Re-export chat types for convenience
export type { ChatMessage, Source, ChatRequest, RagKnowledgeMode, ChatMode, KnowledgeMode } from './chat.js';
