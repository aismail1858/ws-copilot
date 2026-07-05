// ─── Chat ─────────────────────────────────────────────────────────────────────

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
  /** Transmission state for user messages. Never set on assistant messages. */
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

export type RagKnowledgeMode = KnowledgeMode;
export type SearchMode = 'auto' | 'speed' | 'balanced' | 'deep';

// ─── Ingestion ────────────────────────────────────────────────────────────────

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

export interface IngestFileRequest {
  file: File;
  knowledgeBaseId?: string;
  chunkSize?: number;
  chunkOverlap?: number;
}

export interface IngestUrlRequest {
  url: string;
  knowledgeBaseId?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  maxDepth?: number;
  sameDomain?: boolean;
  mode?: 'crawl' | 'single';
  maxPages?: number;
  useSitemap?: boolean;
  useLlmsTxt?: boolean;
  useNavigation?: boolean;
  maxSeedUrls?: number;
}

export interface CrawlPreviewResult {
  rootUrl: string;
  mode: 'crawl' | 'single';
  urls: string[];
  entries: CrawlPreviewEntry[];
}

export interface CrawlPreviewEntry {
  url: string;
  sources: string[];
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

export interface IngestionWorkerStatus {
  online: boolean;
  workers: string[];
  stage: string;
  status?: 'online' | 'degraded' | 'offline';
  reasonCode?: string;
  probeLatencyMs?: number;
  lastSuccessfulProbeAt?: string;
}

export interface IngestionOperation {
  operationId: string;
  operationType: string;
  source: string;
  documentCount: number;
  chunkCount: number;
  createdAt: string;
}

export interface StoredChunk {
  id: string;
  documentId: string;
  documentTitle: string;
  sourceUrl?: string;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  hasEmbedding?: boolean;
}

export interface OperationDeleteResult {
  operationId: string;
  documentsDeleted: number;
  chunksDeleted: number;
  embeddingsDeleted: number;
}

export interface DocumentDeleteResult {
  documentId: string;
  documentsDeleted: number;
  chunksDeleted: number;
  embeddingsDeleted: number;
}

export interface KnowledgeResetResult {
  documentsDeleted: number;
  chunksDeleted: number;
  operationsDeleted: number;
  embeddingsDeleted: number;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export type LLMProvider = 'claude' | 'openai' | 'gemini' | 'ollama' | 'custom';
export type EmbeddingProvider = 'gemini' | 'openai' | 'ollama' | 'custom';

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
  // Custom / OpenAI-compatible model
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
  // Ollama (LLM + Embeddings)
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
  // Contextual Prefix (Anthropic Pattern)
  ingestionContextualPrefixEnabled: boolean;
  ingestionContextualPrefixProvider: 'gemini' | 'openai' | 'claude' | 'ollama' | 'custom';
  ingestionContextualPrefixMaxTokens: number;
  ingestionContextualPrefixDocumentChars: number;
  ingestionContextualPrefixChunkChars: number;
  // HyDE (Hypothetical Document Embedding)
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

export interface TokenUsageDailyPoint {
  date: string;
  totalTokens: number;
}

export interface TokenUsageCurrentMonth {
  usedTokens: number;
  limitTokens: number | null;
  remainingTokens: number | null;
  utilizationPct: number | null;
}

export interface UserTokenUsageOverview {
  windowDays: number;
  currentMonth: TokenUsageCurrentMonth;
  summary: {
    totalTokens: number;
    avgTokensPerDay: number;
    peakDate: string | null;
    peakTokens: number;
    lowDate: string | null;
    lowTokens: number;
    lastActivityAt: string | null;
  };
  clientBreakdown: TokenUsageClientBreakdownRow[];
  dailyUsage: TokenUsageDailyPoint[];
}

export interface TokenUsageClientBreakdownRow {
  clientOrigin: 'webapp' | 'extension' | 'unknown' | string;
  usedTokens: number;
  sharePct: number;
  projectedMonthTokens?: number;
}

export interface AdminTokenUsageUserRow {
  userId: string;
  email: string;
  displayName?: string | null;
  role: UserRole;
  isActive: boolean;
  monthlyTokenLimit: number | null;
  currentMonthUsedTokens: number;
  remainingTokens: number | null;
  utilizationPct: number | null;
  windowTotalTokens: number;
  avgTokensPerDay: number;
  lastActivityAt: string | null;
}

export interface TokenUsageForecastPoint {
  month: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  perUserTokens: number;
}

export interface TokenUsageForecastConfig {
  method: string;
  status: string;
  confidence: 'low' | 'medium' | 'high' | string;
  historyMonthsUsed: number;
  driftFactor: number;
  userScalingFactor: number;
  baselineUsers: number;
  targetUsers: number;
  horizonMonths: number;
}

export interface AdminTokenUsageModelRow {
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  sharePct: number;
  projectedMonthTokens: number;
  forecastMethod: string;
  forecastConfidence: 'low' | 'medium' | 'high' | string;
  forecast: TokenUsageForecastPoint[];
}

export interface AdminTokenUsageDashboard {
  windowDays: number;
  teamCurrentMonth: {
    usedTokens: number;
    promptTokens: number;
    completionTokens: number;
    userCount: number;
    activeUsersCurrentMonth: number;
    avgTokensPerUser: number;
    averageDailyTokens: number;
    projectedMonthTokens: number;
    peakDate: string | null;
    peakTokens: number;
    lowDate: string | null;
    lowTokens: number;
  };
  forecastConfig: TokenUsageForecastConfig;
  teamForecast: TokenUsageForecastPoint[];
  clientBreakdown: TokenUsageClientBreakdownRow[];
  providerBreakdown: {
    provider: string;
    usedTokens: number;
    sharePct: number;
    projectedMonthTokens: number;
  }[];
  modelBreakdown: AdminTokenUsageModelRow[];
  dailyUsage: TokenUsageDailyPoint[];
  users: AdminTokenUsageUserRow[];
}

export interface UserTokenLimitUpdateResult {
  userId: string;
  email: string;
  displayName?: string | null;
  monthlyTokenLimit: number | null;
  currentMonthUsedTokens: number;
  remainingTokens: number | null;
  utilizationPct: number | null;
}

export interface AdminUserModelUsage {
  userId: string;
  email: string;
  displayName?: string | null;
  role: UserRole;
  isActive: boolean;
  month: string;
  monthStart: string;
  monthEnd: string;
  totalTokens: number;
  models: {
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    sharePct: number;
  }[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  displayName?: string | null;
  isActive: boolean;
  isSuperadmin: boolean;
  monthlyTokenLimit?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  passwordSetupEmailDelivery?: 'sent' | 'logged' | 'failed';
}

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: UserRole;
  displayName?: string;
}

export interface UpdateAdminUserInput {
  role?: UserRole;
  displayName?: string;
  isActive?: boolean;
  monthlyTokenLimit?: number | null;
}

export interface ApiError {
  message: string;
  status: number;
}
