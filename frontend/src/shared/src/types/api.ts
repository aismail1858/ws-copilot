// Shared API response types for ws-copilot

import type { Source } from './chat.js';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  detail?: string;
  message?: string;
}

export interface ApiErrorResponse {
  message: string;
  status: number;
  details?: string;
}

export interface StreamEvent {
  type: 'token' | 'sources' | 'error' | 'done' | 'reasoning';
  token?: string;
  sources?: Source[];
  error?: string;
  reasoning?: string;
  reasoning_end?: boolean;
}

// Re-export Source type for convenience
export type { Source } from './chat.js';
