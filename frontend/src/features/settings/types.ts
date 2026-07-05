import type { CustomLlmProfile, EmbeddingProvider, LLMProvider } from '@/types';

export type VisionProvider = 'gemini' | 'openai' | 'ollama' | 'custom' | 'http';
export type TabId = 'tab-api' | 'tab-llm' | 'tab-lab';
export type SyncStatus = 'idle' | 'pending' | 'syncing' | 'synced' | 'error';
export type NewCustomProfileDraft = Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>;

export const DEFAULT_CUSTOM_PROFILE_ID = 'custom-default';
export const LLM_PROVIDERS: LLMProvider[] = ['claude', 'openai', 'gemini', 'ollama', 'custom'];
export const EMBEDDING_PROVIDERS: EmbeddingProvider[] = ['gemini', 'openai', 'ollama', 'custom'];
export const VISION_PROVIDERS: VisionProvider[] = ['gemini', 'openai', 'ollama', 'custom', 'http'];
