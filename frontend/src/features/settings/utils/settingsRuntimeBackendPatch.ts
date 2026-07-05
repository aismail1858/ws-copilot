import type { BackendConfigResponse } from '@/api/client';
import {
  mergedKnownModels,
  sameStringArray,
  toKnownEmbeddingProvider,
  toKnownLlmProvider,
  toKnownVisionProvider,
} from '@/features/settings/utils/customProfiles';
import type { AppSettings } from '@/types';

interface EmbeddingSyncState {
  provider: AppSettings['embeddingProvider'];
  googleModel: string;
  googleKnownModels: string[];
  openaiModel: string;
  openaiKnownModels: string[];
  ollamaModel: string;
  ollamaKnownModels: string[];
  customUrl: string;
  customModel: string;
  customKnownModels: string[];
}

interface RetrievalSyncState {
  retrievalMinScore: number;
  hybridLexicalStrategy: AppSettings['hybridLexicalStrategy'];
  hybridCandidatePoolSize: number;
  hybridFusionRrfK: number;
  hybridVectorWeight: number;
  hybridLexicalWeight: number;
  rerankerEnabled: boolean;
  rerankerProvider: AppSettings['rerankerProvider'];
  rerankerModel: string;
  rerankerUrl: string;
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
  multiQueryExpansionProvider: AppSettings['multiQueryExpansionProvider'];
  multiQueryExpansionTemperature: number;
  multiQueryFallbackOnError: boolean;
  // Contextual Prefix
  ingestionContextualPrefixEnabled: boolean;
  ingestionContextualPrefixProvider: AppSettings['ingestionContextualPrefixProvider'];
  ingestionContextualPrefixMaxTokens: number;
  ingestionContextualPrefixDocumentChars: number;
  ingestionContextualPrefixChunkChars: number;
  // HyDE
  retrievalHydeEnabled: boolean;
  retrievalHydeProvider: AppSettings['retrievalHydeProvider'];
  retrievalHydeTemperature: number;
  retrievalHydeMaxTokens: number;
  retrievalHydeFusionWeight: number;
}

interface VisionSyncState {
  enabled: boolean;
  provider: AppSettings['ingestionVisionSummaryProvider'];
  model: string;
  knownModels: string[];
  timeoutSeconds: number;
  maxChars: number;
  httpUrl: string;
  httpHeadersTemplate: string;
  httpBodyTemplate: string;
  httpResponseTextPath: string;
}

export function buildPatchFromBackendConfig(
  latestSettings: AppSettings,
  config: BackendConfigResponse
): Partial<AppSettings> | null {
  const embedding = deriveEmbeddingSyncState(latestSettings, config);
  const retrieval = deriveRetrievalSyncState(latestSettings, config);
  const vision = deriveVisionSyncState(latestSettings, config);

  if (!hasBackendConfigChanges(latestSettings, embedding, retrieval, vision)) {
    return null;
  }

  return {
    ...buildEmbeddingPatch(embedding),
    ...buildRetrievalPatch(retrieval),
    ...buildVisionPatch(vision),
  };
}

function deriveEmbeddingSyncState(
  latestSettings: AppSettings,
  config: BackendConfigResponse
): EmbeddingSyncState {
  const googleModel = (config.googleEmbeddingModel || latestSettings.googleEmbeddingModel).trim();
  const openaiModel = (config.openaiEmbeddingModel || latestSettings.openaiEmbeddingModel).trim();
  const ollamaModel = (config.ollamaEmbeddingModel || latestSettings.ollamaEmbeddingModel).trim();
  const customUrl = (config.customEmbeddingUrl || latestSettings.customEmbeddingUrl).trim();
  const customModel = (config.customEmbeddingModel || latestSettings.customEmbeddingModel).trim();

  return {
    provider: toKnownEmbeddingProvider(
      config.defaultEmbeddingProvider || latestSettings.embeddingProvider,
      latestSettings.embeddingProvider
    ),
    googleModel,
    googleKnownModels: mergedKnownModels([googleModel], googleModel, latestSettings.googleEmbeddingKnownModels),
    openaiModel,
    openaiKnownModels: mergedKnownModels(
      config.openaiAllowedEmbeddingModels,
      openaiModel,
      latestSettings.openaiEmbeddingKnownModels
    ),
    ollamaModel,
    ollamaKnownModels: mergedKnownModels(
      config.ollamaAllowedEmbeddingModels,
      ollamaModel,
      latestSettings.ollamaEmbeddingKnownModels
    ),
    customUrl,
    customModel,
    customKnownModels: mergedKnownModels(
      config.customAllowedEmbeddingModels,
      customModel,
      latestSettings.customEmbeddingKnownModels
    ),
  };
}

function deriveRetrievalSyncState(
  latestSettings: AppSettings,
  config: BackendConfigResponse
): RetrievalSyncState {
  const minRaw = toBoundedInteger(config.multiQueryMinQueries, latestSettings.multiQueryMinQueries, 1, 10);
  const maxRaw = toBoundedInteger(config.multiQueryMaxQueries, latestSettings.multiQueryMaxQueries, 1, 10);
  const rerankerModel = (config.rerankerModel || latestSettings.rerankerModel).trim();

  return {
    retrievalMinScore: toBoundedDecimal(config.retrievalMinScore, latestSettings.retrievalMinScore, 0, 2),
    hybridLexicalStrategy: config.hybridLexicalStrategy === 'fts' ? 'fts' : 'bm25',
    hybridCandidatePoolSize: toBoundedInteger(config.hybridCandidatePoolSize, latestSettings.hybridCandidatePoolSize, 1, 100),
    hybridFusionRrfK: toBoundedInteger(config.hybridFusionRrfK, latestSettings.hybridFusionRrfK, 1, 200),
    hybridVectorWeight: toBoundedDecimal(config.hybridVectorWeight, latestSettings.hybridVectorWeight, 0, 5),
    hybridLexicalWeight: toBoundedDecimal(config.hybridLexicalWeight, latestSettings.hybridLexicalWeight, 0, 5),
    rerankerEnabled: typeof config.rerankerEnabled === 'boolean' ? config.rerankerEnabled : latestSettings.rerankerEnabled,
    rerankerProvider: config.rerankerProvider === 'http' || config.rerankerProvider === 'custom' ? 'custom' : 'cross_encoder',
    rerankerModel,
    rerankerUrl: (config.rerankerUrl || latestSettings.rerankerUrl).trim(),
    rerankerHttpHeadersTemplate: config.rerankerHttpHeadersTemplate || latestSettings.rerankerHttpHeadersTemplate,
    rerankerHttpBodyTemplate: config.rerankerHttpBodyTemplate || latestSettings.rerankerHttpBodyTemplate,
    rerankerHttpResponseResultsPath: (config.rerankerHttpResponseResultsPath || latestSettings.rerankerHttpResponseResultsPath).trim(),
    rerankerHttpResponseIndexField: (config.rerankerHttpResponseIndexField || latestSettings.rerankerHttpResponseIndexField).trim(),
    rerankerHttpResponseScoreField: (config.rerankerHttpResponseScoreField || latestSettings.rerankerHttpResponseScoreField).trim(),
    rerankerKnownModels: mergedKnownModels([rerankerModel], rerankerModel, latestSettings.rerankerKnownModels),
    multiQueryEnabled: typeof config.multiQueryEnabled === 'boolean' ? config.multiQueryEnabled : latestSettings.multiQueryEnabled,
    multiQueryMinQueries: Math.min(minRaw, maxRaw),
    multiQueryMaxQueries: Math.max(minRaw, maxRaw),
    multiQueryRrfK: toBoundedInteger(config.multiQueryRrfK, latestSettings.multiQueryRrfK, 1, 200),
    multiQueryExpansionProvider: toKnownLlmProvider(
      config.multiQueryExpansionProvider || latestSettings.multiQueryExpansionProvider,
      latestSettings.multiQueryExpansionProvider
    ),
    multiQueryExpansionTemperature: toBoundedDecimal(
      config.multiQueryExpansionTemperature,
      latestSettings.multiQueryExpansionTemperature,
      0,
      2
    ),
    multiQueryFallbackOnError: typeof config.multiQueryFallbackOnError === 'boolean'
      ? config.multiQueryFallbackOnError
      : latestSettings.multiQueryFallbackOnError,
    // Contextual Prefix
    ingestionContextualPrefixEnabled: typeof config.ingestionContextualPrefixEnabled === 'boolean'
      ? config.ingestionContextualPrefixEnabled
      : latestSettings.ingestionContextualPrefixEnabled,
    ingestionContextualPrefixProvider: toKnownLlmProvider(
      config.ingestionContextualPrefixProvider || latestSettings.ingestionContextualPrefixProvider,
      latestSettings.ingestionContextualPrefixProvider
    ),
    ingestionContextualPrefixMaxTokens: toBoundedInteger(
      config.ingestionContextualPrefixMaxTokens,
      latestSettings.ingestionContextualPrefixMaxTokens,
      50,
      500
    ),
    ingestionContextualPrefixDocumentChars: toBoundedInteger(
      config.ingestionContextualPrefixDocumentChars,
      latestSettings.ingestionContextualPrefixDocumentChars,
      1000,
      50000
    ),
    ingestionContextualPrefixChunkChars: toBoundedInteger(
      config.ingestionContextualPrefixChunkChars,
      latestSettings.ingestionContextualPrefixChunkChars,
      500,
      10000
    ),
    // HyDE
    retrievalHydeEnabled: typeof config.retrievalHydeEnabled === 'boolean'
      ? config.retrievalHydeEnabled
      : latestSettings.retrievalHydeEnabled,
    retrievalHydeProvider: toKnownLlmProvider(
      config.retrievalHydeProvider || latestSettings.retrievalHydeProvider,
      latestSettings.retrievalHydeProvider
    ),
    retrievalHydeTemperature: toBoundedDecimal(
      config.retrievalHydeTemperature,
      latestSettings.retrievalHydeTemperature,
      0,
      2
    ),
    retrievalHydeMaxTokens: toBoundedInteger(
      config.retrievalHydeMaxTokens,
      latestSettings.retrievalHydeMaxTokens,
      50,
      500
    ),
    retrievalHydeFusionWeight: toBoundedDecimal(
      config.retrievalHydeFusionWeight,
      latestSettings.retrievalHydeFusionWeight,
      0.1,
      2.0
    ),
  };
}

function deriveVisionSyncState(
  latestSettings: AppSettings,
  config: BackendConfigResponse
): VisionSyncState {
  const model = (config.ingestionVisionSummaryModel ?? latestSettings.ingestionVisionSummaryModel).trim();

  return {
    enabled: typeof config.ingestionVisionSummaryEnabled === 'boolean'
      ? config.ingestionVisionSummaryEnabled
      : latestSettings.ingestionVisionSummaryEnabled,
    provider: toKnownVisionProvider(
      config.ingestionVisionSummaryProvider || latestSettings.ingestionVisionSummaryProvider,
      latestSettings.ingestionVisionSummaryProvider
    ),
    model,
    knownModels: mergedKnownModels([model], model, latestSettings.ingestionVisionSummaryKnownModels),
    timeoutSeconds: toBoundedInteger(
      config.ingestionVisionSummaryTimeoutSeconds,
      latestSettings.ingestionVisionSummaryTimeoutSeconds,
      5,
      180
    ),
    maxChars: toBoundedInteger(
      config.ingestionVisionSummaryMaxChars,
      latestSettings.ingestionVisionSummaryMaxChars,
      40,
      2000
    ),
    httpUrl: (config.ingestionVisionSummaryHttpUrl || latestSettings.ingestionVisionSummaryHttpUrl).trim(),
    httpHeadersTemplate:
      config.ingestionVisionSummaryHttpHeadersTemplate ||
      latestSettings.ingestionVisionSummaryHttpHeadersTemplate,
    httpBodyTemplate:
      config.ingestionVisionSummaryHttpBodyTemplate ||
      latestSettings.ingestionVisionSummaryHttpBodyTemplate,
    httpResponseTextPath: (
      config.ingestionVisionSummaryHttpResponseTextPath ||
      latestSettings.ingestionVisionSummaryHttpResponseTextPath
    ).trim(),
  };
}

function hasBackendConfigChanges(
  latestSettings: AppSettings,
  embedding: EmbeddingSyncState,
  retrieval: RetrievalSyncState,
  vision: VisionSyncState
) {
  return (
    hasEmbeddingChanges(latestSettings, embedding) ||
    hasRetrievalChanges(latestSettings, retrieval) ||
    hasVisionChanges(latestSettings, vision)
  );
}

function hasEmbeddingChanges(latestSettings: AppSettings, embedding: EmbeddingSyncState) {
  return !(
    latestSettings.embeddingProvider === embedding.provider &&
    latestSettings.googleEmbeddingModel === embedding.googleModel &&
    sameStringArray(latestSettings.googleEmbeddingKnownModels || [], embedding.googleKnownModels) &&
    latestSettings.openaiEmbeddingModel === embedding.openaiModel &&
    sameStringArray(latestSettings.openaiEmbeddingKnownModels || [], embedding.openaiKnownModels) &&
    latestSettings.ollamaEmbeddingModel === embedding.ollamaModel &&
    sameStringArray(latestSettings.ollamaEmbeddingKnownModels || [], embedding.ollamaKnownModels) &&
    latestSettings.customEmbeddingUrl === embedding.customUrl &&
    latestSettings.customEmbeddingModel === embedding.customModel &&
    sameStringArray(latestSettings.customEmbeddingKnownModels || [], embedding.customKnownModels)
  );
}

function hasRetrievalChanges(latestSettings: AppSettings, retrieval: RetrievalSyncState) {
  return !(
    latestSettings.retrievalMinScore === retrieval.retrievalMinScore &&
    latestSettings.hybridLexicalStrategy === retrieval.hybridLexicalStrategy &&
    latestSettings.hybridCandidatePoolSize === retrieval.hybridCandidatePoolSize &&
    latestSettings.hybridFusionRrfK === retrieval.hybridFusionRrfK &&
    latestSettings.hybridVectorWeight === retrieval.hybridVectorWeight &&
    latestSettings.hybridLexicalWeight === retrieval.hybridLexicalWeight &&
    latestSettings.rerankerEnabled === retrieval.rerankerEnabled &&
    latestSettings.rerankerProvider === retrieval.rerankerProvider &&
    latestSettings.rerankerModel === retrieval.rerankerModel &&
    latestSettings.rerankerUrl === retrieval.rerankerUrl &&
    latestSettings.rerankerHttpHeadersTemplate === retrieval.rerankerHttpHeadersTemplate &&
    latestSettings.rerankerHttpBodyTemplate === retrieval.rerankerHttpBodyTemplate &&
    latestSettings.rerankerHttpResponseResultsPath === retrieval.rerankerHttpResponseResultsPath &&
    latestSettings.rerankerHttpResponseIndexField === retrieval.rerankerHttpResponseIndexField &&
    latestSettings.rerankerHttpResponseScoreField === retrieval.rerankerHttpResponseScoreField &&
    sameStringArray(latestSettings.rerankerKnownModels || [], retrieval.rerankerKnownModels) &&
    latestSettings.multiQueryEnabled === retrieval.multiQueryEnabled &&
    latestSettings.multiQueryMinQueries === retrieval.multiQueryMinQueries &&
    latestSettings.multiQueryMaxQueries === retrieval.multiQueryMaxQueries &&
    latestSettings.multiQueryRrfK === retrieval.multiQueryRrfK &&
    latestSettings.multiQueryExpansionProvider === retrieval.multiQueryExpansionProvider &&
    latestSettings.multiQueryExpansionTemperature === retrieval.multiQueryExpansionTemperature &&
    latestSettings.multiQueryFallbackOnError === retrieval.multiQueryFallbackOnError &&
    // Contextual Prefix
    latestSettings.ingestionContextualPrefixEnabled === retrieval.ingestionContextualPrefixEnabled &&
    latestSettings.ingestionContextualPrefixProvider === retrieval.ingestionContextualPrefixProvider &&
    latestSettings.ingestionContextualPrefixMaxTokens === retrieval.ingestionContextualPrefixMaxTokens &&
    latestSettings.ingestionContextualPrefixDocumentChars === retrieval.ingestionContextualPrefixDocumentChars &&
    latestSettings.ingestionContextualPrefixChunkChars === retrieval.ingestionContextualPrefixChunkChars &&
    // HyDE
    latestSettings.retrievalHydeEnabled === retrieval.retrievalHydeEnabled &&
    latestSettings.retrievalHydeProvider === retrieval.retrievalHydeProvider &&
    latestSettings.retrievalHydeTemperature === retrieval.retrievalHydeTemperature &&
    latestSettings.retrievalHydeMaxTokens === retrieval.retrievalHydeMaxTokens &&
    latestSettings.retrievalHydeFusionWeight === retrieval.retrievalHydeFusionWeight
  );
}

function hasVisionChanges(latestSettings: AppSettings, vision: VisionSyncState) {
  return !(
    latestSettings.ingestionVisionSummaryEnabled === vision.enabled &&
    latestSettings.ingestionVisionSummaryProvider === vision.provider &&
    latestSettings.ingestionVisionSummaryModel === vision.model &&
    sameStringArray(latestSettings.ingestionVisionSummaryKnownModels || [], vision.knownModels) &&
    latestSettings.ingestionVisionSummaryTimeoutSeconds === vision.timeoutSeconds &&
    latestSettings.ingestionVisionSummaryMaxChars === vision.maxChars &&
    latestSettings.ingestionVisionSummaryHttpUrl === vision.httpUrl &&
    latestSettings.ingestionVisionSummaryHttpHeadersTemplate === vision.httpHeadersTemplate &&
    latestSettings.ingestionVisionSummaryHttpBodyTemplate === vision.httpBodyTemplate &&
    latestSettings.ingestionVisionSummaryHttpResponseTextPath === vision.httpResponseTextPath
  );
}

function buildEmbeddingPatch(embedding: EmbeddingSyncState): Partial<AppSettings> {
  return {
    embeddingProvider: embedding.provider,
    googleEmbeddingModel: embedding.googleModel,
    googleEmbeddingKnownModels: embedding.googleKnownModels,
    openaiEmbeddingModel: embedding.openaiModel,
    openaiEmbeddingKnownModels: embedding.openaiKnownModels,
    ollamaEmbeddingModel: embedding.ollamaModel,
    ollamaEmbeddingKnownModels: embedding.ollamaKnownModels,
    customEmbeddingUrl: embedding.customUrl,
    customEmbeddingModel: embedding.customModel,
    customEmbeddingKnownModels: embedding.customKnownModels,
  };
}

function buildRetrievalPatch(retrieval: RetrievalSyncState): Partial<AppSettings> {
  return {
    retrievalMinScore: retrieval.retrievalMinScore,
    hybridLexicalStrategy: retrieval.hybridLexicalStrategy,
    hybridCandidatePoolSize: retrieval.hybridCandidatePoolSize,
    hybridFusionRrfK: retrieval.hybridFusionRrfK,
    hybridVectorWeight: retrieval.hybridVectorWeight,
    hybridLexicalWeight: retrieval.hybridLexicalWeight,
    rerankerEnabled: retrieval.rerankerEnabled,
    rerankerProvider: retrieval.rerankerProvider,
    rerankerModel: retrieval.rerankerModel,
    rerankerUrl: retrieval.rerankerUrl,
    rerankerHttpHeadersTemplate: retrieval.rerankerHttpHeadersTemplate,
    rerankerHttpBodyTemplate: retrieval.rerankerHttpBodyTemplate,
    rerankerHttpResponseResultsPath: retrieval.rerankerHttpResponseResultsPath,
    rerankerHttpResponseIndexField: retrieval.rerankerHttpResponseIndexField,
    rerankerHttpResponseScoreField: retrieval.rerankerHttpResponseScoreField,
    rerankerKnownModels: retrieval.rerankerKnownModels,
    multiQueryEnabled: retrieval.multiQueryEnabled,
    multiQueryMinQueries: retrieval.multiQueryMinQueries,
    multiQueryMaxQueries: retrieval.multiQueryMaxQueries,
    multiQueryRrfK: retrieval.multiQueryRrfK,
    multiQueryExpansionProvider: retrieval.multiQueryExpansionProvider,
    multiQueryExpansionTemperature: retrieval.multiQueryExpansionTemperature,
    multiQueryFallbackOnError: retrieval.multiQueryFallbackOnError,
    // Contextual Prefix
    ingestionContextualPrefixEnabled: retrieval.ingestionContextualPrefixEnabled,
    ingestionContextualPrefixProvider: retrieval.ingestionContextualPrefixProvider,
    ingestionContextualPrefixMaxTokens: retrieval.ingestionContextualPrefixMaxTokens,
    ingestionContextualPrefixDocumentChars: retrieval.ingestionContextualPrefixDocumentChars,
    ingestionContextualPrefixChunkChars: retrieval.ingestionContextualPrefixChunkChars,
    // HyDE
    retrievalHydeEnabled: retrieval.retrievalHydeEnabled,
    retrievalHydeProvider: retrieval.retrievalHydeProvider,
    retrievalHydeTemperature: retrieval.retrievalHydeTemperature,
    retrievalHydeMaxTokens: retrieval.retrievalHydeMaxTokens,
    retrievalHydeFusionWeight: retrieval.retrievalHydeFusionWeight,
  };
}

function buildVisionPatch(vision: VisionSyncState): Partial<AppSettings> {
  return {
    ingestionVisionSummaryEnabled: vision.enabled,
    ingestionVisionSummaryProvider: vision.provider,
    ingestionVisionSummaryModel: vision.model,
    ingestionVisionSummaryKnownModels: vision.knownModels,
    ingestionVisionSummaryTimeoutSeconds: vision.timeoutSeconds,
    ingestionVisionSummaryMaxChars: vision.maxChars,
    ingestionVisionSummaryHttpUrl: vision.httpUrl,
    ingestionVisionSummaryHttpHeadersTemplate: vision.httpHeadersTemplate,
    ingestionVisionSummaryHttpBodyTemplate: vision.httpBodyTemplate,
    ingestionVisionSummaryHttpResponseTextPath: vision.httpResponseTextPath,
  };
}

function toBoundedInteger(value: number, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, Math.round(value)))
    : fallback;
}

function toBoundedDecimal(value: number, fallback: number, min: number, max: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value))
    : fallback;
}
