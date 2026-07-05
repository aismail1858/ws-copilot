export interface User {
  id: string;
  email: string;
  display_name: string;
  role?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface ProjectSettings {
  embedding_model: string;
  rag_strategy: string;
  agent_type: string;
  chunks_per_search: number;
  final_context_size: number;
  similarity_threshold: number;
  number_of_queries: number;
  reranking_enabled: boolean;
  reranking_model: string;
  vector_weight: number;
  keyword_weight: number;
}

export interface FileInfo {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  created_at: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  chunk_index: number;
  page_number?: number;
  char_count: number;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
}

export interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  citations?: unknown[];
  trace_id?: string;
  created_at: string;
}

export type ProcessingStatus =
  | "uploading"
  | "pending"
  | "queued"
  | "processing"
  | "partitioning"
  | "chunking"
  | "summarising"
  | "vectorization"
  | "completed";

export interface UploadUrlResponse {
  upload_url: string;
  file_id: string;
}

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
export type SearchMode = 'auto' | 'speed' | 'balanced' | 'deep';

export interface ChatStreamError {
  code: string;
  message: string;
  recoverable: boolean;
}

export interface RetrievalDiagnostic {
  gate: string;
  reason: string;
  queryPreview: string;
  sourcesBefore: number;
  sourcesAfter: number;
  scores?: Record<string, number>;
  requestedRoute?: string;
  route?: string;
  durationMs?: number;
}

export interface RetrievalStageTimings {
  route: string;
  queryPreview: string;
  stages: Record<string, number>;
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
  | { type: 'retrieval_diagnostic'; gate: string; reason: string; query_preview: string; sources_before: number; sources_after: number; scores?: Record<string, number>; route?: string; duration_ms?: number }
  | { type: 'route_decision'; requested_route: string; route: string; retrieval_profile?: string; reason: string }
  | { type: 'retrieval_stage_timings'; route: string; query_preview: string; stages: Record<string, number> }
  | { type: 'done' }
  | { type: 'error'; message?: string; error?: ChatStreamError };

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
  role: 'user' | 'assistant';
  content: string;
  attachments?: ChatAttachment[];
  sources?: Source[];
  answerMode?: ChatAnswerMode;
  answerModeReason?: ChatAnswerModeReason;
  reasoning?: string;
  createdAt: Date;
  streaming?: boolean;
  status?: 'pending' | 'sent' | 'failed';
  diagnostic?: RetrievalDiagnostic;
  stageTimings?: RetrievalStageTimings;
}

export interface ChatRequest {
  query: string;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  promptAddition?: string;
  knowledgeMode?: RagKnowledgeMode;
  allowModelKnowledgeFallback?: boolean;
  retrievalRoute?: 'auto' | 'fast' | 'deep';
}

export interface Document {
  id: string;
  title: string;
  sourceType: 'upload' | 'url' | 'wikijs' | 'github';
  sourceUrl?: string;
  sourceHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  chunkCount?: number;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'canceled';
  progress?: number;
  stage?: string;
  result?: unknown;
  error?: string;
  attempts?: number;
  excerpt?: string;
  sourceUrl?: string;
  documentId?: string;
}

export type LLMProvider = 'claude' | 'openai' | 'gemini' | 'ollama' | 'custom';
export type EmbeddingProvider = 'gemini' | 'openai' | 'ollama' | 'custom';
export type LlmPurpose = 'chat' | 'mini' | 'embeddings' | 'embeddings_llm';

export interface CustomLlmProfile {
  id: string;
  label: string;
  model: string;
  url: string;
  apiKey: string;
}

export interface AppSettings {
  llmProvider: LLMProvider;
  completionLlmProvider: LLMProvider;
  titleLlmProvider: LLMProvider;
  embeddingProvider: EmbeddingProvider;
  anthropicApiKey: string;
  anthropicModel: string;
  anthropicKnownModels: string[];
  anthropicCompletionModel: string;
  anthropicTitleModel: string;
  openaiApiKey: string;
  openaiModel: string;
  openaiKnownModels: string[];
  openaiCompletionModel: string;
  openaiTitleModel: string;
  openaiEmbeddingModel: string;
  openaiEmbeddingKnownModels: string[];
  googleApiKey: string;
  googleModel: string;
  googleKnownModels: string[];
  googleCompletionModel: string;
  googleTitleModel: string;
  googleEmbeddingModel: string;
  googleEmbeddingKnownModels: string[];
  customLlmUrl: string;
  customLlmApiKey: string;
  customLlmModelFamily: string;
  customKnownModelFamilies: string[];
  customLlmModel: string;
  customKnownModels: string[];
  customCompletionModel: string;
  customTitleModel: string;
  customLlmProfiles: CustomLlmProfile[];
  activeCustomLlmProfileId: string;
  customUserAddedProfileIds: string[];
  customEmbeddingUrl: string;
  customEmbeddingApiKey: string;
  customEmbeddingModel: string;
  customEmbeddingKnownModels: string[];
  ollamaUrl: string;
  ollamaApiKey: string;
  ollamaModel: string;
  ollamaKnownModels: string[];
  ollamaCompletionModel: string;
  ollamaTitleModel: string;
  ollamaEmbeddingModel: string;
  ollamaEmbeddingKnownModels: string[];
  allowModelKnowledgeFallback: boolean;
  systemPromptAddition: string;
  temperature: number;
  retrievalMinScore: number;
  hybridLexicalStrategy: 'bm25' | 'fts';
  hybridCandidatePoolSize: number;
  hybridFusionRrfK: number;
  hybridVectorWeight: number;
  hybridLexicalWeight: number;
  rerankerEnabled: boolean;
  rerankerProvider: 'cross_encoder' | 'http' | 'custom';
  rerankerModel: string;
  rerankerUrl: string;
  rerankerApiKey: string;
  rerankerHttpHeadersTemplate: string;
  rerankerHttpBodyTemplate: string;
  rerankerHttpResponseResultsPath: string;
  rerankerHttpResponseIndexField: string;
  rerankerHttpResponseScoreField: string;
  rerankerKnownModels: string[];
  multiQueryEnabled: boolean;
  multiQueryMinQueries: number;
  multiQueryMaxQueries: number;
  multiQueryRrfK: number;
  multiQueryExpansionProvider: LLMProvider;
  multiQueryExpansionTemperature: number;
  multiQueryFallbackOnError: boolean;
  ingestionContextualPrefixEnabled: boolean;
  ingestionContextualPrefixProvider: 'gemini' | 'openai' | 'claude' | 'ollama' | 'custom';
  ingestionContextualPrefixMaxTokens: number;
  ingestionContextualPrefixDocumentChars: number;
  ingestionContextualPrefixChunkChars: number;
  retrievalHydeEnabled: boolean;
  ingestionChunkSize: number;
  ingestionChunkOverlap: number;
  retrievalHydeProvider: 'gemini' | 'openai' | 'claude' | 'ollama' | 'custom';
  retrievalHydeTemperature: number;
  retrievalHydeMaxTokens: number;
  retrievalHydeFusionWeight: number;
  ingestionVisionSummaryEnabled: boolean;
  ingestionVisionSummaryProvider: 'gemini' | 'openai' | 'ollama' | 'custom' | 'http';
  ingestionVisionSummaryModel: string;
  ingestionVisionSummaryKnownModels: string[];
  ingestionVisionSummaryTimeoutSeconds: number;
  ingestionVisionSummaryMaxChars: number;
  ingestionVisionSummaryHttpUrl: string;
  ingestionVisionSummaryHttpApiKey: string;
  ingestionVisionSummaryHttpHeadersTemplate: string;
  ingestionVisionSummaryHttpBodyTemplate: string;
  ingestionVisionSummaryHttpResponseTextPath: string;
  backendUrl: string;
}

export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  tier?: string;
  displayName?: string | null;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface ApiError {
  message: string;
  status: number;
}
