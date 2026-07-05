import type { AppSettings } from '@/types';
import { defaultSettings } from './settingsDefaults';
import {
  clampRoundedNumber,
  normalizeBoolean,
  normalizeEnum,
  normalizeNumber,
  normalizeString,
  validEmbeddingProviders,
  validLlmProviders,
  validVisionProviders,
} from './settingsValidation';
import { uniqueNonEmpty } from './settingsNormalizationCustom';

type GeneralSettings = Pick<
  AppSettings,
  | 'llmProvider'
  | 'completionLlmProvider'
  | 'titleLlmProvider'
  | 'anthropicModel'
  | 'openaiModel'
  | 'ollamaModel'
  | 'allowModelKnowledgeFallback'
  | 'systemPromptAddition'
  | 'temperature'
>;

type TitleSettings = Pick<
  AppSettings,
  | 'anthropicTitleModel'
  | 'openaiTitleModel'
  | 'googleTitleModel'
  | 'ollamaTitleModel'
  | 'customTitleModel'
>;

type EmbeddingSettings = Pick<
  AppSettings,
  | 'embeddingProvider'
  | 'openaiEmbeddingModel'
  | 'openaiEmbeddingKnownModels'
  | 'googleEmbeddingModel'
  | 'googleEmbeddingKnownModels'
  | 'ollamaEmbeddingModel'
  | 'ollamaEmbeddingKnownModels'
  | 'customEmbeddingUrl'
  | 'customEmbeddingApiKey'
  | 'customEmbeddingModel'
  | 'customEmbeddingKnownModels'
>;

type RetrievalSettings = Pick<
  AppSettings,
  | 'retrievalMinScore'
  | 'hybridLexicalStrategy'
  | 'hybridCandidatePoolSize'
  | 'hybridFusionRrfK'
  | 'hybridVectorWeight'
  | 'hybridLexicalWeight'
  | 'rerankerEnabled'
  | 'rerankerProvider'
  | 'rerankerModel'
  | 'rerankerUrl'
  | 'rerankerApiKey'
  | 'rerankerHttpHeadersTemplate'
  | 'rerankerHttpBodyTemplate'
  | 'rerankerHttpResponseResultsPath'
  | 'rerankerHttpResponseIndexField'
  | 'rerankerHttpResponseScoreField'
  | 'rerankerKnownModels'
>;

type MultiQuerySettings = Pick<
  AppSettings,
  | 'multiQueryEnabled'
  | 'multiQueryMinQueries'
  | 'multiQueryMaxQueries'
  | 'multiQueryRrfK'
  | 'multiQueryExpansionProvider'
  | 'multiQueryExpansionTemperature'
  | 'multiQueryFallbackOnError'
>;

type ContextualPrefixSettings = Pick<
  AppSettings,
  | 'ingestionContextualPrefixEnabled'
  | 'ingestionContextualPrefixProvider'
  | 'ingestionContextualPrefixMaxTokens'
  | 'ingestionContextualPrefixDocumentChars'
  | 'ingestionContextualPrefixChunkChars'
>;

type HydeSettings = Pick<
  AppSettings,
  | 'retrievalHydeEnabled'
  | 'retrievalHydeProvider'
  | 'retrievalHydeTemperature'
  | 'retrievalHydeMaxTokens'
  | 'retrievalHydeFusionWeight'
>;

type VisionSettings = Pick<
  AppSettings,
  | 'ingestionVisionSummaryEnabled'
  | 'ingestionVisionSummaryProvider'
  | 'ingestionVisionSummaryModel'
  | 'ingestionVisionSummaryKnownModels'
  | 'ingestionVisionSummaryTimeoutSeconds'
  | 'ingestionVisionSummaryMaxChars'
  | 'ingestionVisionSummaryHttpUrl'
  | 'ingestionVisionSummaryHttpApiKey'
  | 'ingestionVisionSummaryHttpHeadersTemplate'
  | 'ingestionVisionSummaryHttpBodyTemplate'
  | 'ingestionVisionSummaryHttpResponseTextPath'
>;

type CompletionSettings = Pick<
  AppSettings,
  | 'anthropicCompletionModel'
  | 'openaiCompletionModel'
  | 'googleCompletionModel'
  | 'ollamaCompletionModel'
  | 'customCompletionModel'
>;

type RerankerSettings = Pick<
  AppSettings,
  | 'rerankerEnabled'
  | 'rerankerProvider'
  | 'rerankerModel'
  | 'rerankerUrl'
  | 'rerankerApiKey'
  | 'rerankerHttpHeadersTemplate'
  | 'rerankerHttpBodyTemplate'
  | 'rerankerHttpResponseResultsPath'
  | 'rerankerHttpResponseIndexField'
  | 'rerankerHttpResponseScoreField'
  | 'rerankerKnownModels'
>;

type VisionHttpSettings = Pick<
  AppSettings,
  | 'ingestionVisionSummaryHttpUrl'
  | 'ingestionVisionSummaryHttpApiKey'
  | 'ingestionVisionSummaryHttpHeadersTemplate'
  | 'ingestionVisionSummaryHttpBodyTemplate'
  | 'ingestionVisionSummaryHttpResponseTextPath'
>;

const validRerankerProviders = new Set(['cross_encoder', 'http', 'custom'] as const);

function mergedKnownModels(
  values: string[] | undefined,
  activeModel: string,
  defaults: string[]
): string[] {
  return uniqueNonEmpty([...(values || []), activeModel, ...defaults]);
}

function normalizeRerankerSettings(settings: Partial<AppSettings>): RerankerSettings {
  const rerankerProvider = normalizeEnum(
    (settings.rerankerProvider || '') as string,
    validRerankerProviders,
    defaultSettings.rerankerProvider
  );

  return {
    rerankerEnabled: normalizeBoolean(settings.rerankerEnabled, defaultSettings.rerankerEnabled),
    rerankerProvider: (rerankerProvider === 'http' ? 'custom' : rerankerProvider) as AppSettings['rerankerProvider'],
    rerankerModel: normalizeString(settings.rerankerModel, defaultSettings.rerankerModel),
    rerankerUrl: normalizeString(settings.rerankerUrl, defaultSettings.rerankerUrl),
    rerankerApiKey: normalizeString(settings.rerankerApiKey, defaultSettings.rerankerApiKey),
    rerankerHttpHeadersTemplate: normalizeString(
      settings.rerankerHttpHeadersTemplate,
      defaultSettings.rerankerHttpHeadersTemplate
    ),
    rerankerHttpBodyTemplate: normalizeString(
      settings.rerankerHttpBodyTemplate,
      defaultSettings.rerankerHttpBodyTemplate
    ),
    rerankerHttpResponseResultsPath: normalizeString(
      settings.rerankerHttpResponseResultsPath,
      defaultSettings.rerankerHttpResponseResultsPath
    ),
    rerankerHttpResponseIndexField: normalizeString(
      settings.rerankerHttpResponseIndexField,
      defaultSettings.rerankerHttpResponseIndexField
    ),
    rerankerHttpResponseScoreField: normalizeString(
      settings.rerankerHttpResponseScoreField,
      defaultSettings.rerankerHttpResponseScoreField
    ),
    rerankerKnownModels: mergedKnownModels(
      settings.rerankerKnownModels as string[] | undefined,
      (settings.rerankerModel as string) || '',
      [defaultSettings.rerankerModel]
    ),
  };
}

function normalizeVisionHttpSettings(settings: Partial<AppSettings>): VisionHttpSettings {
  return {
    ingestionVisionSummaryHttpUrl: normalizeString(
      settings.ingestionVisionSummaryHttpUrl,
      defaultSettings.ingestionVisionSummaryHttpUrl
    ),
    ingestionVisionSummaryHttpApiKey: normalizeString(
      settings.ingestionVisionSummaryHttpApiKey,
      defaultSettings.ingestionVisionSummaryHttpApiKey
    ),
    ingestionVisionSummaryHttpHeadersTemplate: normalizeString(
      settings.ingestionVisionSummaryHttpHeadersTemplate,
      defaultSettings.ingestionVisionSummaryHttpHeadersTemplate
    ),
    ingestionVisionSummaryHttpBodyTemplate: normalizeString(
      settings.ingestionVisionSummaryHttpBodyTemplate,
      defaultSettings.ingestionVisionSummaryHttpBodyTemplate
    ),
    ingestionVisionSummaryHttpResponseTextPath: normalizeString(
      settings.ingestionVisionSummaryHttpResponseTextPath,
      defaultSettings.ingestionVisionSummaryHttpResponseTextPath
    ),
  };
}

export function normalizeGeneralSettings(settings: Partial<AppSettings>): GeneralSettings {
  return {
    llmProvider: normalizeEnum(settings.llmProvider, validLlmProviders, defaultSettings.llmProvider),
    completionLlmProvider: normalizeEnum(
      settings.completionLlmProvider,
      validLlmProviders,
      (settings.completionLlmProvider as AppSettings['completionLlmProvider']) || defaultSettings.llmProvider
    ) as AppSettings['completionLlmProvider'],
    titleLlmProvider: normalizeEnum(
      settings.titleLlmProvider,
      validLlmProviders,
      (settings.titleLlmProvider as AppSettings['titleLlmProvider']) || defaultSettings.llmProvider
    ) as AppSettings['titleLlmProvider'],
    anthropicModel: normalizeString(settings.anthropicModel, defaultSettings.anthropicModel),
    openaiModel: normalizeString(settings.openaiModel, defaultSettings.openaiModel),
    ollamaModel: normalizeString(settings.ollamaModel, defaultSettings.ollamaModel),
    allowModelKnowledgeFallback: normalizeBoolean(
      settings.allowModelKnowledgeFallback,
      defaultSettings.allowModelKnowledgeFallback
    ),
    systemPromptAddition: normalizeString(
      settings.systemPromptAddition,
      defaultSettings.systemPromptAddition
    ),
    temperature: normalizeNumber(settings.temperature as number, defaultSettings.temperature, 0, 2),
  };
}

export function normalizeTitleSettings(settings: Partial<AppSettings>): TitleSettings {
  return {
    anthropicTitleModel: normalizeString(
      settings.anthropicTitleModel,
      defaultSettings.anthropicTitleModel
    ),
    openaiTitleModel: normalizeString(
      settings.openaiTitleModel,
      defaultSettings.openaiTitleModel
    ),
    googleTitleModel: normalizeString(
      settings.googleTitleModel,
      defaultSettings.googleTitleModel
    ),
    ollamaTitleModel: normalizeString(
      settings.ollamaTitleModel,
      defaultSettings.ollamaTitleModel
    ),
    customTitleModel: normalizeString(
      settings.customTitleModel,
      defaultSettings.customTitleModel
    ),
  };
}

export function normalizeEmbeddingSettings(settings: Partial<AppSettings>): EmbeddingSettings {
  const openaiEmbeddingModel = normalizeString(settings.openaiEmbeddingModel, defaultSettings.openaiEmbeddingModel);
  const googleEmbeddingModel = normalizeString(settings.googleEmbeddingModel, defaultSettings.googleEmbeddingModel);
  const ollamaEmbeddingModel = normalizeString(settings.ollamaEmbeddingModel, '');
  const customEmbeddingModel = normalizeString(settings.customEmbeddingModel, defaultSettings.customEmbeddingModel);

  return {
    embeddingProvider: normalizeEnum(
      settings.embeddingProvider,
      validEmbeddingProviders,
      defaultSettings.embeddingProvider
    ),
    openaiEmbeddingModel,
    openaiEmbeddingKnownModels: mergedKnownModels(
      settings.openaiEmbeddingKnownModels as string[] | undefined,
      openaiEmbeddingModel,
      defaultSettings.openaiEmbeddingKnownModels
    ),
    googleEmbeddingModel,
    googleEmbeddingKnownModels: mergedKnownModels(
      settings.googleEmbeddingKnownModels as string[] | undefined,
      googleEmbeddingModel,
      defaultSettings.googleEmbeddingKnownModels
    ),
    ollamaEmbeddingModel,
    ollamaEmbeddingKnownModels: mergedKnownModels(
      settings.ollamaEmbeddingKnownModels as string[] | undefined,
      ollamaEmbeddingModel,
      defaultSettings.ollamaEmbeddingKnownModels
    ),
    customEmbeddingUrl: normalizeString(settings.customEmbeddingUrl, defaultSettings.customEmbeddingUrl),
    customEmbeddingApiKey: normalizeString(
      settings.customEmbeddingApiKey,
      defaultSettings.customEmbeddingApiKey
    ),
    customEmbeddingModel,
    customEmbeddingKnownModels: mergedKnownModels(
      settings.customEmbeddingKnownModels as string[] | undefined,
      customEmbeddingModel,
      defaultSettings.customEmbeddingKnownModels
    ),
  };
}

export function normalizeRetrievalSettings(settings: Partial<AppSettings>): RetrievalSettings {
  return {
    retrievalMinScore: normalizeNumber(
      settings.retrievalMinScore as number,
      defaultSettings.retrievalMinScore,
      0,
      2
    ),
    hybridLexicalStrategy:
      (settings.hybridLexicalStrategy || '') === 'fts' ? 'fts' : defaultSettings.hybridLexicalStrategy,
    hybridCandidatePoolSize: clampRoundedNumber(settings.hybridCandidatePoolSize as number, 1, 100),
    hybridFusionRrfK: clampRoundedNumber(settings.hybridFusionRrfK as number, 1, 200),
    hybridVectorWeight: normalizeNumber(
      settings.hybridVectorWeight as number,
      defaultSettings.hybridVectorWeight,
      0,
      5
    ),
    hybridLexicalWeight: normalizeNumber(
      settings.hybridLexicalWeight as number,
      defaultSettings.hybridLexicalWeight,
      0,
      5
    ),
    ...normalizeRerankerSettings(settings),
  };
}

export function normalizeMultiQuerySettings(settings: Partial<AppSettings>): MultiQuerySettings {
  const rawMultiQueryMin = clampRoundedNumber(settings.multiQueryMinQueries as number, 1, 10);
  const rawMultiQueryMax = clampRoundedNumber(settings.multiQueryMaxQueries as number, 1, 10);

  return {
    multiQueryEnabled: normalizeBoolean(settings.multiQueryEnabled, defaultSettings.multiQueryEnabled),
    multiQueryMinQueries: Math.min(rawMultiQueryMin, rawMultiQueryMax),
    multiQueryMaxQueries: Math.max(rawMultiQueryMin, rawMultiQueryMax),
    multiQueryRrfK: clampRoundedNumber(settings.multiQueryRrfK as number, 1, 200),
    multiQueryExpansionProvider: normalizeEnum(
      settings.multiQueryExpansionProvider,
      validLlmProviders,
      defaultSettings.multiQueryExpansionProvider
    ),
    multiQueryExpansionTemperature: normalizeNumber(
      settings.multiQueryExpansionTemperature as number,
      defaultSettings.multiQueryExpansionTemperature,
      0,
      2
    ),
    multiQueryFallbackOnError: normalizeBoolean(
      settings.multiQueryFallbackOnError,
      defaultSettings.multiQueryFallbackOnError
    ),
  };
}

export function normalizeContextualPrefixSettings(settings: Partial<AppSettings>): ContextualPrefixSettings {
  return {
    ingestionContextualPrefixEnabled: normalizeBoolean(
      settings.ingestionContextualPrefixEnabled,
      defaultSettings.ingestionContextualPrefixEnabled
    ),
    ingestionContextualPrefixProvider: normalizeEnum(
      settings.ingestionContextualPrefixProvider as string,
      validLlmProviders,
      defaultSettings.ingestionContextualPrefixProvider
    ) as AppSettings['ingestionContextualPrefixProvider'],
    ingestionContextualPrefixMaxTokens: clampRoundedNumber(
      settings.ingestionContextualPrefixMaxTokens as number,
      50,
      500
    ),
    ingestionContextualPrefixDocumentChars: clampRoundedNumber(
      settings.ingestionContextualPrefixDocumentChars as number,
      1000,
      50000
    ),
    ingestionContextualPrefixChunkChars: clampRoundedNumber(
      settings.ingestionContextualPrefixChunkChars as number,
      500,
      10000
    ),
  };
}

export function normalizeHydeSettings(settings: Partial<AppSettings>): HydeSettings {
  return {
    retrievalHydeEnabled: normalizeBoolean(
      settings.retrievalHydeEnabled,
      defaultSettings.retrievalHydeEnabled
    ),
    retrievalHydeProvider: normalizeEnum(
      settings.retrievalHydeProvider as string,
      validLlmProviders,
      defaultSettings.retrievalHydeProvider
    ) as AppSettings['retrievalHydeProvider'],
    retrievalHydeTemperature: normalizeNumber(
      settings.retrievalHydeTemperature as number,
      defaultSettings.retrievalHydeTemperature,
      0,
      2
    ),
    retrievalHydeMaxTokens: clampRoundedNumber(
      settings.retrievalHydeMaxTokens as number,
      50,
      500
    ),
    retrievalHydeFusionWeight: normalizeNumber(
      settings.retrievalHydeFusionWeight as number,
      defaultSettings.retrievalHydeFusionWeight,
      0.1,
      2.0
    ),
  };
}

export function normalizeVisionSettings(settings: Partial<AppSettings>): VisionSettings {
  return {
    ingestionVisionSummaryEnabled: normalizeBoolean(
      settings.ingestionVisionSummaryEnabled,
      defaultSettings.ingestionVisionSummaryEnabled
    ),
    ingestionVisionSummaryProvider: normalizeEnum(
      settings.ingestionVisionSummaryProvider,
      validVisionProviders,
      defaultSettings.ingestionVisionSummaryProvider
    ),
    ingestionVisionSummaryModel: normalizeString(
      settings.ingestionVisionSummaryModel,
      defaultSettings.ingestionVisionSummaryModel
    ),
    ingestionVisionSummaryKnownModels: uniqueNonEmpty([
      ...((settings.ingestionVisionSummaryKnownModels || []) as string[]),
      (settings.ingestionVisionSummaryModel as string) || '',
      ...defaultSettings.ingestionVisionSummaryKnownModels,
    ]),
    ingestionVisionSummaryTimeoutSeconds: clampRoundedNumber(
      settings.ingestionVisionSummaryTimeoutSeconds as number,
      5,
      180
    ),
    ingestionVisionSummaryMaxChars: clampRoundedNumber(
      settings.ingestionVisionSummaryMaxChars as number,
      40,
      2000
    ),
    ...normalizeVisionHttpSettings(settings),
  };
}

export function normalizeCompletionSettings(settings: Partial<AppSettings>): CompletionSettings {
  return {
    anthropicCompletionModel: normalizeString(
      settings.anthropicCompletionModel,
      defaultSettings.anthropicCompletionModel
    ),
    openaiCompletionModel: normalizeString(
      settings.openaiCompletionModel,
      defaultSettings.openaiCompletionModel
    ),
    googleCompletionModel: normalizeString(
      settings.googleCompletionModel,
      defaultSettings.googleCompletionModel
    ),
    ollamaCompletionModel: normalizeString(
      settings.ollamaCompletionModel,
      defaultSettings.ollamaCompletionModel
    ),
    customCompletionModel: normalizeString(
      settings.customCompletionModel,
      defaultSettings.customCompletionModel
    ),
  };
}
