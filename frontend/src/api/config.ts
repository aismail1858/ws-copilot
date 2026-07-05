import type { RuntimeLlmConfig } from './chat';
import { fetchWithAuth } from './core';

export interface CustomLlmProfileBinding {
  id: string;
  label: string;
  model: string;
  url: string;
}

export interface BackendConfigPayload {
  defaultLlmProvider?: string;
  defaultEmbeddingProvider?: string;
  anthropicAllowedModels?: string[];
  openaiAllowedModels?: string[];
  googleAllowedModels?: string[];
  ollamaAllowedModels?: string[];
  customAllowedModels?: string[];
  openaiAllowedEmbeddingModels?: string[];
  customAllowedEmbeddingModels?: string[];
  ollamaAllowedEmbeddingModels?: string[];
  anthropicModel?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  openaiEmbeddingModel?: string;
  googleApiKey?: string;
  googleModel?: string;
  googleEmbeddingModel?: string;
  customLlmUrl?: string;
  customLlmApiKey?: string;
  customLlmModel?: string;
  customEmbeddingUrl?: string;
  customEmbeddingApiKey?: string;
  customEmbeddingModel?: string;
  ollamaUrl?: string;
  ollamaApiKey?: string;
  ollamaModel?: string;
  ollamaEmbeddingModel?: string;
  retrievalMinScore?: number;
  hybridLexicalStrategy?: string;
  hybridCandidatePoolSize?: number;
  hybridFusionRrfK?: number;
  hybridVectorWeight?: number;
  hybridLexicalWeight?: number;
  rerankerEnabled?: boolean;
  rerankerProvider?: string;
  rerankerModel?: string;
  rerankerUrl?: string;
  rerankerApiKey?: string;
  rerankerHttpHeadersTemplate?: string;
  rerankerHttpBodyTemplate?: string;
  rerankerHttpResponseResultsPath?: string;
  rerankerHttpResponseIndexField?: string;
  rerankerHttpResponseScoreField?: string;
  multiQueryEnabled?: boolean;
  multiQueryMinQueries?: number;
  multiQueryMaxQueries?: number;
  multiQueryRrfK?: number;
  multiQueryExpansionProvider?: string;
  multiQueryExpansionTemperature?: number;
  multiQueryFallbackOnError?: boolean;
  // Contextual Prefix
  ingestionContextualPrefixEnabled?: boolean;
  ingestionContextualPrefixProvider?: string;
  ingestionContextualPrefixMaxTokens?: number;
  ingestionContextualPrefixDocumentChars?: number;
  ingestionContextualPrefixChunkChars?: number;
  // HyDE
  retrievalHydeEnabled?: boolean;
  retrievalHydeProvider?: string;
  retrievalHydeTemperature?: number;
  retrievalHydeMaxTokens?: number;
  retrievalHydeFusionWeight?: number;
  ingestionVisionSummaryEnabled?: boolean;
  ingestionVisionSummaryProvider?: string;
  ingestionVisionSummaryModel?: string;
  ingestionVisionSummaryTimeoutSeconds?: number;
  ingestionVisionSummaryMaxChars?: number;
  ingestionVisionSummaryHttpUrl?: string;
  ingestionVisionSummaryHttpApiKey?: string;
  ingestionVisionSummaryHttpHeadersTemplate?: string;
  ingestionVisionSummaryHttpBodyTemplate?: string;
  ingestionVisionSummaryHttpResponseTextPath?: string;
}

export interface BackendConfigResponse {
  defaultLlmProvider: string;
  defaultEmbeddingProvider: string;
  effectiveEmbeddingProvider: string;
  effectiveEmbeddingModel: string;
  ingestionUrlMaxPages: number;
  runtimeModelConfigurable: boolean;
  anthropicAllowedModels: string[];
  openaiAllowedModels: string[];
  googleAllowedModels: string[];
  customAllowedModels: string[];
  ollamaAllowedModels: string[];
  openaiAllowedEmbeddingModels: string[];
  customAllowedEmbeddingModels: string[];
  ollamaAllowedEmbeddingModels: string[];
  embeddingDimension: number;
  embeddingConfigLocked: boolean;
  embeddingConfigFingerprint: string;
  backendPort: number;
  customLlmUrl: string;
  customLlmModel: string;
  customLlmApiKeySet: boolean;
  customEmbeddingUrl: string;
  customEmbeddingModel: string;
  customEmbeddingApiKeySet: boolean;
  anthropicApiKeySet: boolean;
  anthropicModel: string;
  openaiApiKeySet: boolean;
  openaiModel: string;
  openaiEmbeddingModel: string;
  googleApiKeySet: boolean;
  googleModel: string;
  googleEmbeddingModel: string;
  ollamaUrl: string;
  ollamaApiKeySet: boolean;
  ollamaModel: string;
  ollamaEmbeddingModel: string;
  retrievalMinScore: number;
  hybridLexicalStrategy: string;
  hybridCandidatePoolSize: number;
  hybridFusionRrfK: number;
  hybridVectorWeight: number;
  hybridLexicalWeight: number;
  rerankerEnabled: boolean;
  rerankerProvider: string;
  rerankerModel: string;
  rerankerUrl: string;
  rerankerApiKeySet: boolean;
  rerankerHttpHeadersTemplate: string;
  rerankerHttpBodyTemplate: string;
  rerankerHttpResponseResultsPath: string;
  rerankerHttpResponseIndexField: string;
  rerankerHttpResponseScoreField: string;
  multiQueryEnabled: boolean;
  multiQueryMinQueries: number;
  multiQueryMaxQueries: number;
  multiQueryRrfK: number;
  multiQueryExpansionProvider: string;
  multiQueryExpansionTemperature: number;
  multiQueryFallbackOnError: boolean;
  // Contextual Prefix
  ingestionContextualPrefixEnabled: boolean;
  ingestionContextualPrefixProvider: string;
  ingestionContextualPrefixMaxTokens: number;
  ingestionContextualPrefixDocumentChars: number;
  ingestionContextualPrefixChunkChars: number;
  // HyDE
  retrievalHydeEnabled: boolean;
  retrievalHydeProvider: string;
  retrievalHydeTemperature: number;
  retrievalHydeMaxTokens: number;
  retrievalHydeFusionWeight: number;
  ingestionVisionSummaryEnabled: boolean;
  ingestionVisionSummaryProvider: string;
  ingestionVisionSummaryModel: string;
  ingestionVisionSummaryTimeoutSeconds: number;
  ingestionVisionSummaryMaxChars: number;
  ingestionVisionSummaryHttpUrl: string;
  ingestionVisionSummaryHttpApiKeySet: boolean;
  ingestionVisionSummaryHttpHeadersTemplate: string;
  ingestionVisionSummaryHttpBodyTemplate: string;
  ingestionVisionSummaryHttpResponseTextPath: string;
  ingestionChunkSize?: number;
  ingestionChunkOverlap?: number;
}

export async function pushConfigToBackend(
  payload: BackendConfigPayload,
  persist = false
): Promise<BackendConfigResponse> {
  const res = await fetchWithAuth(`/api/v1/config?persist=${persist}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error(`[config] PUT /api/v1/config failed (${res.status}):`, text, '\nPayload:', JSON.stringify(payload, null, 2));
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<BackendConfigResponse>;
}

export async function fetchBackendConfig(): Promise<BackendConfigResponse> {
  const res = await fetchWithAuth('/api/v1/config');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<BackendConfigResponse>;
}

export interface MyLlmConfigPayload {
  defaultLlmProvider?: string;
  completionLlmProvider?: string;
  allowModelKnowledgeFallback?: boolean;
  systemPromptAddition?: string;
  temperature?: number;
  anthropicAllowedModels?: string[];
  openaiAllowedModels?: string[];
  googleAllowedModels?: string[];
  ollamaAllowedModels?: string[];
  customAllowedModels?: string[];
  anthropicModel?: string;
  openaiModel?: string;
  googleModel?: string;
  ollamaModel?: string;
  customLlmModel?: string;
  customLlmUrl?: string;
  customLlmProfiles?: CustomLlmProfileBinding[];
  ollamaUrl?: string;
  anthropicCompletionModel?: string;
  openaiCompletionModel?: string;
  googleCompletionModel?: string;
  ollamaCompletionModel?: string;
  customCompletionModel?: string;
  titleLlmProvider?: string;
  anthropicTitleModel?: string;
  openaiTitleModel?: string;
  googleTitleModel?: string;
  ollamaTitleModel?: string;
  customTitleModel?: string;
}

export interface MyLlmConfigResponse {
  defaultLlmProvider: string;
  completionLlmProvider: string;
  titleLlmProvider: string;
  allowModelKnowledgeFallback: boolean;
  systemPromptAddition: string;
  temperature: number;
  runtimeModelConfigurable: boolean;
  anthropicAllowedModels: string[];
  openaiAllowedModels: string[];
  googleAllowedModels: string[];
  ollamaAllowedModels: string[];
  customAllowedModels: string[];
  anthropicModel: string;
  openaiModel: string;
  googleModel: string;
  ollamaModel: string;
  customLlmModel: string;
  customLlmUrl: string;
  customLlmProfiles: CustomLlmProfileBinding[];
  ollamaUrl: string;
  anthropicCompletionModel: string;
  openaiCompletionModel: string;
  googleCompletionModel: string;
  ollamaCompletionModel: string;
  customCompletionModel: string;
  anthropicTitleModel: string;
  openaiTitleModel: string;
  googleTitleModel: string;
  ollamaTitleModel: string;
  customTitleModel: string;
}

export async function fetchMyLlmConfig(): Promise<MyLlmConfigResponse> {
  const res = await fetchWithAuth('/api/v1/me/llm-config');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<MyLlmConfigResponse>;
}

export async function saveMyLlmConfig(
  payload: MyLlmConfigPayload
): Promise<MyLlmConfigResponse> {
  const res = await fetchWithAuth('/api/v1/me/llm-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<MyLlmConfigResponse>;
}

export interface MyLlmSecretsPayload {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  googleApiKey?: string;
  customLlmApiKey?: string;
  customLlmApiKeysByProfile?: Record<string, string>;
  ollamaApiKey?: string;
}

export interface MyLlmSecretsResponse {
  anthropicApiKey: string;
  openaiApiKey: string;
  googleApiKey: string;
  customLlmApiKey: string;
  customLlmApiKeysByProfile: Record<string, string>;
  ollamaApiKey: string;
  anthropicApiKeySet: boolean;
  openaiApiKeySet: boolean;
  googleApiKeySet: boolean;
  customLlmApiKeySet: boolean;
  ollamaApiKeySet: boolean;
}

export interface LlmModelTestPayload {
  llmConfig: RuntimeLlmConfig;
  prompt?: string;
}

export interface LlmModelTestResponse {
  provider: string;
  model: string;
  ok: boolean;
  message: string;
  responsePreview: string;
  durationMs: number;
}

export interface OllamaModelsResponse {
  url: string;
  reachable: boolean;
  models: string[];
  rerankerModels: string[];
  error: string;
}

export interface RagLabVariantPayload {
  label: string;
  llmConfig?: RuntimeLlmConfig;
  temperature?: number;
  retrievalMinScore?: number;
  hybridLexicalStrategy?: 'bm25' | 'fts';
  hybridCandidatePoolSize?: number;
  hybridFusionRrfK?: number;
  hybridVectorWeight?: number;
  hybridLexicalWeight?: number;
  rerankerEnabled?: boolean;
  rerankerProvider?: 'cross_encoder' | 'http' | 'custom';
  rerankerModel?: string;
  rerankerUrl?: string;
  rerankerApiKey?: string;
  rerankerHttpHeadersTemplate?: string;
  rerankerHttpBodyTemplate?: string;
  rerankerHttpResponseResultsPath?: string;
  rerankerHttpResponseIndexField?: string;
  rerankerHttpResponseScoreField?: string;
  multiQueryEnabled?: boolean;
  multiQueryMinQueries?: number;
  multiQueryMaxQueries?: number;
  multiQueryRrfK?: number;
  multiQueryExpansionProvider?: RuntimeLlmConfig['provider'];
  multiQueryExpansionTemperature?: number;
  multiQueryFallbackOnError?: boolean;
  // Contextual Prefix
  ingestionContextualPrefixEnabled?: boolean;
  ingestionContextualPrefixProvider?: string;
  ingestionContextualPrefixMaxTokens?: number;
  ingestionContextualPrefixDocumentChars?: number;
  ingestionContextualPrefixChunkChars?: number;
  // HyDE
  retrievalHydeEnabled?: boolean;
  retrievalHydeProvider?: string;
  retrievalHydeTemperature?: number;
  retrievalHydeMaxTokens?: number;
  retrievalHydeFusionWeight?: number;
}

export interface RagLabComparePayload {
  query: string;
  llmConfig: RuntimeLlmConfig;
  promptAddition?: string;
  knowledgeMode?: 'docs_only' | 'docs_plus_model' | 'search';
  knowledgeBaseId?: string;
  allowModelKnowledgeFallback?: boolean;
  variants: RagLabVariantPayload[];
}

export interface RagLabCandidateResponse {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  selected: boolean | null;
  selectionReason: string | null;
  rank: number | null;
  sourceQueries: string[];
  rankBeforeRerank: number | null;
  rankAfterRerank: number | null;
  rankDelta: number | null;
  vectorScore: number;
  lexicalScore: number;
  rerankScore: number | null;
  url?: string;
  filename?: string;
  chunkIndex?: number;
  pageNo?: number;
  modality?: string;
  sourceUrl?: string;
  metadata: Record<string, unknown>;
}

export interface RagLabQueryRunResponse {
  query: string;
  candidateCount: number;
  candidates: RagLabCandidateResponse[];
}

export interface RagLabFusionStageResponse {
  candidateCount: number;
  candidates: RagLabCandidateResponse[];
}

export interface RagLabRerankStageResponse {
  enabled: boolean;
  applied: boolean;
  provider: string;
  model: string;
  inputCount: number;
  outputCount: number;
  fallbackReason: string | null;
  candidates: RagLabCandidateResponse[];
}

export interface RagLabSelectionStageResponse {
  selectedCount: number;
  rejectedCount: number;
  selectedChunks: RagLabCandidateResponse[];
  rejectedChunks: RagLabCandidateResponse[];
  contextPreview: string;
}

export interface RagLabSourceResponse {
  documentId: string;
  title: string;
  excerpt: string;
  score: number;
  url?: string;
  filename?: string;
  hitCount?: number;
  chunkIndex?: number;
  pageNo?: number;
  modality?: string;
  imageUrl?: string;
}

export interface RagLabVariantResultResponse {
  label: string;
  llm: {
    provider: string;
    model: string;
    temperature: number;
  };
  retrieval: {
    mode: string;
    queryVariants: string[];
    knowledgeBaseIds: string[];
    retrievalLimit: number;
    selectedSourceCount: number;
    candidateCount: number;
    skippedBelowThreshold: number;
    skippedRelevance: number;
    nonOverlapFloor: number;
    contextCharCount: number;
    candidates: RagLabCandidateResponse[];
    queryRuns: RagLabQueryRunResponse[];
    fusion: RagLabFusionStageResponse;
    rerank: RagLabRerankStageResponse;
    selection: RagLabSelectionStageResponse;
    sources: RagLabSourceResponse[];
  };
  generation: {
    systemPromptPreview: string;
    promptAddition: string;
    usedNoContextFallback: boolean;
    noContextDecision: string | null;
    durationMs: number;
  };
  telemetry: {
    expansionMs: number;
    retrievalMs: number;
    rerankMs: number;
    selectionMs: number;
    generationMs: number;
  };
  effectiveSettings: {
    temperature: number;
    retrievalMinScore: number;
    hybridLexicalStrategy: string;
    hybridCandidatePoolSize: number;
    hybridFusionRrfK: number;
    hybridVectorWeight: number;
    hybridLexicalWeight: number;
    multiQueryEnabled: boolean;
    multiQueryMinQueries: number;
    multiQueryMaxQueries: number;
    multiQueryRrfK: number;
    multiQueryExpansionProvider: string;
    multiQueryExpansionTemperature: number;
    multiQueryFallbackOnError: boolean;
    rerankerEnabled: boolean;
    rerankerProvider: string;
    rerankerModel: string;
    rerankerUrlSet: boolean;
  };
  answer: {
    text: string;
    error: string;
    ok: boolean;
  };
  durationMs: number;
}

export interface RagLabCompareResponse {
  query: string;
  variantCount: number;
  results: RagLabVariantResultResponse[];
}

export async function fetchMyLlmSecrets(): Promise<MyLlmSecretsResponse> {
  const res = await fetchWithAuth('/api/v1/me/llm-secrets');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<MyLlmSecretsResponse>;
}

export async function saveMyLlmSecrets(
  payload: MyLlmSecretsPayload
): Promise<MyLlmSecretsResponse> {
  const res = await fetchWithAuth('/api/v1/me/llm-secrets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<MyLlmSecretsResponse>;
}

export async function testLlmModel(
  payload: LlmModelTestPayload
): Promise<LlmModelTestResponse> {
  const res = await fetchWithAuth('/api/v1/me/llm-test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<LlmModelTestResponse>;
}

export async function fetchMyOllamaModels(): Promise<OllamaModelsResponse> {
  const res = await fetchWithAuth('/api/v1/me/ollama/models');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<OllamaModelsResponse>;
}

export async function compareRagLabVariants(
  payload: RagLabComparePayload
): Promise<RagLabCompareResponse> {
  const res = await fetchWithAuth('/api/v1/admin/rag-lab/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<RagLabCompareResponse>;
}

export interface UserIngestionConfigPayload {
  chunkSize?: number;
  chunkOverlap?: number;
  semanticChunking?: boolean;
}

export interface UserIngestionConfigResponse {
  chunkSize: number;
  chunkOverlap: number;
  semanticChunking: boolean;
}

export async function fetchMyIngestionConfig(): Promise<UserIngestionConfigResponse> {
  const res = await fetchWithAuth('/api/v1/me/ingestion-config');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<UserIngestionConfigResponse>;
}

export async function saveMyIngestionConfig(
  payload: UserIngestionConfigPayload
): Promise<UserIngestionConfigResponse> {
  const res = await fetchWithAuth('/api/v1/me/ingestion-config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<UserIngestionConfigResponse>;
}
