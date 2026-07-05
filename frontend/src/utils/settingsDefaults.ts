/**
 * Central default constants for application settings.
 * This file can be independently deleted and replaced with a different defaults provider.
 */

import type { AppSettings, CustomLlmProfile } from '@/types';

/**
 * Default settings object used when no settings are stored or when validation fails.
 */
export const defaultSettings: AppSettings = {
  llmProvider: 'gemini' as const,
  completionLlmProvider: 'gemini' as const,
  titleLlmProvider: 'gemini' as const,
  embeddingProvider: 'gemini' as const,
  anthropicApiKey: '',
  anthropicModel: '',
  anthropicKnownModels: [],
  anthropicCompletionModel: '',
  anthropicTitleModel: '',
  openaiApiKey: '',
  openaiModel: '',
  openaiKnownModels: [],
  openaiCompletionModel: '',
  openaiTitleModel: '',
  openaiEmbeddingModel: '',
  openaiEmbeddingKnownModels: [],
  googleApiKey: '',
  googleModel: '',
  googleKnownModels: [],
  googleCompletionModel: '',
  googleTitleModel: '',
  googleEmbeddingModel: '',
  googleEmbeddingKnownModels: [],
  customLlmUrl: '',
  customLlmApiKey: '',
  customLlmModelFamily: '',
  customKnownModelFamilies: [],
  customLlmModel: '',
  customKnownModels: [],
  customCompletionModel: '',
  customTitleModel: '',
  customLlmProfiles: [
    {
      id: 'custom-default',
      label: 'Custom',
      model: '',
      url: '',
      apiKey: '',
    },
  ],
  activeCustomLlmProfileId: 'custom-default',
  customUserAddedProfileIds: [],
  customEmbeddingUrl: '',
  customEmbeddingApiKey: '',
  customEmbeddingModel: '',
  customEmbeddingKnownModels: [],
  ollamaUrl: 'http://localhost:11434',
  ollamaApiKey: '',
  ollamaModel: '',
  ollamaKnownModels: [],
  ollamaCompletionModel: '',
  ollamaTitleModel: '',
  ollamaEmbeddingModel: '',
  ollamaEmbeddingKnownModels: [],
  allowModelKnowledgeFallback: true,
  systemPromptAddition: '',
  temperature: 0.7,
  retrievalMinScore: 0.3,
  hybridLexicalStrategy: 'bm25',
  hybridCandidatePoolSize: 50,
  hybridFusionRrfK: 40,
  hybridVectorWeight: 1,
  hybridLexicalWeight: 1,
  rerankerEnabled: false,
  rerankerProvider: 'cross_encoder',
  rerankerModel: '',
  rerankerUrl: '',
  rerankerApiKey: '',
  rerankerHttpHeadersTemplate: '{}',
  rerankerHttpBodyTemplate:
    '{"query":"{{query}}","documents":"{{documents}}","top_n":"{{top_n}}","model":"{{model}}","return_documents":false}',
  rerankerHttpResponseResultsPath: 'results',
  rerankerHttpResponseIndexField: 'index',
  rerankerHttpResponseScoreField: 'relevance_score',
  rerankerKnownModels: [],
  multiQueryEnabled: false,
  multiQueryMinQueries: 2,
  multiQueryMaxQueries: 4,
  multiQueryRrfK: 60,
  multiQueryExpansionProvider: 'gemini',
  multiQueryExpansionTemperature: 0.3,
  multiQueryFallbackOnError: true,
  // Contextual Prefix (Anthropic Pattern)
  ingestionContextualPrefixEnabled: false,
  ingestionContextualPrefixProvider: 'gemini',
  ingestionContextualPrefixMaxTokens: 120,
  ingestionContextualPrefixDocumentChars: 12000,
  ingestionContextualPrefixChunkChars: 2000,
  // HyDE (Hypothetical Document Embedding)
retrievalHydeEnabled: false,
  retrievalHydeProvider: 'gemini',
  retrievalHydeTemperature: 0.0,
  retrievalHydeMaxTokens: 220,
  retrievalHydeFusionWeight: 0.8,
  ingestionChunkSize: 1024,
  ingestionChunkOverlap: 128,
  ingestionVisionSummaryEnabled: false,
  ingestionVisionSummaryProvider: 'gemini',
  ingestionVisionSummaryModel: '',
  ingestionVisionSummaryKnownModels: [],
  ingestionVisionSummaryTimeoutSeconds: 45,
  ingestionVisionSummaryMaxChars: 280,
  ingestionVisionSummaryHttpUrl: '',
  ingestionVisionSummaryHttpApiKey: '',
  ingestionVisionSummaryHttpHeadersTemplate: '{}',
  ingestionVisionSummaryHttpBodyTemplate:
    '{"model":"{{model}}","prompt":"{{prompt}}","image":"{{image_base64}}"}',
  ingestionVisionSummaryHttpResponseTextPath: 'text',
  backendUrl: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000',
};

/**
 * Default custom profile used when no valid profiles exist.
 */
export const defaultCustomProfile: CustomLlmProfile = {
  id: 'custom-default',
  label: 'Custom',
  model: '',
  url: '',
  apiKey: '',
};

/**
 * Valid provider sets for validation.
 */
export const validLlmProviders = new Set(['claude', 'openai', 'gemini', 'ollama', 'custom']);
export const validEmbeddingProviders = new Set(['gemini', 'openai', 'ollama', 'custom']);
export const validVisionProviders = new Set(['gemini', 'openai', 'ollama', 'custom', 'http']);
