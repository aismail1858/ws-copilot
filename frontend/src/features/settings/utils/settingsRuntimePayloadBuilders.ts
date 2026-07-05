import {
  buildCustomProfileApiKeyMap,
  deriveModelListsFromProfiles,
  uniqueValues,
} from '@/features/settings/utils/customProfiles';
import type { AppSettings, CustomLlmProfile } from '@/types';

function toConfigProfileBindings(profiles: CustomLlmProfile[]) {
  return profiles
    .filter((profile) => profile.id !== 'custom-default')
    .map((profile) => ({
      id: profile.id,
      label: profile.label,
      model: profile.model,
      url: profile.url,
    }));
}

export function buildMyLlmSecretsPayload(
  settings: AppSettings,
  normalizedProfiles: CustomLlmProfile[],
  activeCustomProfile: CustomLlmProfile
) {
  return {
    anthropicApiKey: settings.anthropicApiKey,
    openaiApiKey: settings.openaiApiKey,
    googleApiKey: settings.googleApiKey,
    customLlmApiKey: activeCustomProfile.apiKey,
    customLlmApiKeysByProfile: buildCustomProfileApiKeyMap(normalizedProfiles),
    ollamaApiKey: settings.ollamaApiKey,
  };
}

export function buildMyLlmConfigPayload(
  settings: AppSettings,
  normalizedProfiles: CustomLlmProfile[],
  activeCustomProfile: CustomLlmProfile,
  runtimeModelConfigurable: boolean
) {
  const { knownModels: profileModels } = deriveModelListsFromProfiles(normalizedProfiles);
  const payload = {
    allowModelKnowledgeFallback: settings.allowModelKnowledgeFallback,
    temperature: settings.temperature,
    systemPromptAddition: settings.systemPromptAddition,
  } as Record<string, string | number | boolean | string[]>;

  if (runtimeModelConfigurable) {
    Object.assign(
      payload,
      buildRuntimeConfigurableMyLlmPayload(
        settings,
        normalizedProfiles,
        profileModels,
        activeCustomProfile
      )
    );
  }

  return payload;
}

function buildRuntimeConfigurableMyLlmPayload(
  settings: AppSettings,
  normalizedProfiles: CustomLlmProfile[],
  profileModels: string[],
  activeCustomProfile: CustomLlmProfile
) {
  return {
    defaultLlmProvider: settings.llmProvider,
    completionLlmProvider: settings.completionLlmProvider,
    titleLlmProvider: settings.titleLlmProvider,
    anthropicAllowedModels: uniqueValues([...(settings.anthropicKnownModels || []), settings.anthropicModel]),
    openaiAllowedModels: uniqueValues([...(settings.openaiKnownModels || []), settings.openaiModel]),
    googleAllowedModels: uniqueValues([...(settings.googleKnownModels || []), settings.googleModel]),
    ollamaAllowedModels: uniqueValues([...(settings.ollamaKnownModels || []), settings.ollamaModel]),
    customAllowedModels: uniqueValues([
      ...(settings.customKnownModels || []),
      ...profileModels,
      activeCustomProfile.model,
    ]),
    anthropicModel: settings.anthropicModel,
    openaiModel: settings.openaiModel,
    googleModel: settings.googleModel,
    ollamaModel: settings.ollamaModel,
    customLlmModel: activeCustomProfile.model,
    customLlmUrl: activeCustomProfile.url,
    customLlmProfiles: toConfigProfileBindings(normalizedProfiles),
    ollamaUrl: settings.ollamaUrl,
    anthropicCompletionModel: settings.anthropicCompletionModel || settings.anthropicModel,
    openaiCompletionModel: settings.openaiCompletionModel || settings.openaiModel,
    googleCompletionModel: settings.googleCompletionModel || settings.googleModel,
    ollamaCompletionModel: settings.ollamaCompletionModel || settings.ollamaModel,
    customCompletionModel: settings.customCompletionModel || activeCustomProfile.model,
    anthropicTitleModel: settings.anthropicTitleModel || settings.anthropicModel,
    openaiTitleModel: settings.openaiTitleModel || settings.openaiModel,
    googleTitleModel: settings.googleTitleModel || settings.googleModel,
    ollamaTitleModel: settings.ollamaTitleModel || settings.ollamaModel,
    customTitleModel: settings.customTitleModel || activeCustomProfile.model,
  };
}

export function buildBackendConfigPayload(
  settings: AppSettings,
  runtimeModelConfigurable: boolean
) {
const payload = {
    ...buildBackendRetrievalPayload(settings),
    ...buildBackendVisionPayload(settings),
    ...buildBackendChunkingPayload(settings),
    customEmbeddingApiKey: settings.customEmbeddingApiKey,
  } as Record<string, string | number | boolean | string[]>;

  if (runtimeModelConfigurable) {
    Object.assign(payload, buildRuntimeConfigurableBackendPayload(settings));
  }

  return payload;
}

function buildBackendRetrievalPayload(settings: AppSettings) {
  return {
    retrievalMinScore: settings.retrievalMinScore,
    hybridLexicalStrategy: settings.hybridLexicalStrategy,
    hybridCandidatePoolSize: settings.hybridCandidatePoolSize,
    hybridFusionRrfK: settings.hybridFusionRrfK,
    hybridVectorWeight: settings.hybridVectorWeight,
    hybridLexicalWeight: settings.hybridLexicalWeight,
    rerankerEnabled: settings.rerankerEnabled,
    rerankerProvider: settings.rerankerProvider,
    rerankerModel: settings.rerankerModel,
    rerankerUrl: settings.rerankerUrl,
    rerankerApiKey: settings.rerankerApiKey,
    rerankerHttpHeadersTemplate: settings.rerankerHttpHeadersTemplate,
    rerankerHttpBodyTemplate: settings.rerankerHttpBodyTemplate,
    rerankerHttpResponseResultsPath: settings.rerankerHttpResponseResultsPath,
    rerankerHttpResponseIndexField: settings.rerankerHttpResponseIndexField,
    rerankerHttpResponseScoreField: settings.rerankerHttpResponseScoreField,
    multiQueryEnabled: settings.multiQueryEnabled,
    multiQueryMinQueries: settings.multiQueryMinQueries,
    multiQueryMaxQueries: settings.multiQueryMaxQueries,
    multiQueryRrfK: settings.multiQueryRrfK,
    multiQueryExpansionProvider: settings.multiQueryExpansionProvider,
    multiQueryExpansionTemperature: settings.multiQueryExpansionTemperature,
    multiQueryFallbackOnError: settings.multiQueryFallbackOnError,
    // Contextual Prefix
    ingestionContextualPrefixEnabled: settings.ingestionContextualPrefixEnabled,
    ingestionContextualPrefixProvider: settings.ingestionContextualPrefixProvider,
    ingestionContextualPrefixMaxTokens: settings.ingestionContextualPrefixMaxTokens,
    ingestionContextualPrefixDocumentChars: settings.ingestionContextualPrefixDocumentChars,
    ingestionContextualPrefixChunkChars: settings.ingestionContextualPrefixChunkChars,
    // HyDE
    retrievalHydeEnabled: settings.retrievalHydeEnabled,
    retrievalHydeProvider: settings.retrievalHydeProvider,
    retrievalHydeTemperature: settings.retrievalHydeTemperature,
    retrievalHydeMaxTokens: settings.retrievalHydeMaxTokens,
    retrievalHydeFusionWeight: settings.retrievalHydeFusionWeight,
  };
}

function buildBackendVisionPayload(settings: AppSettings) {
  return {
    ingestionVisionSummaryEnabled: settings.ingestionVisionSummaryEnabled,
    ingestionVisionSummaryProvider: settings.ingestionVisionSummaryProvider,
    ingestionVisionSummaryModel: settings.ingestionVisionSummaryModel,
    ingestionVisionSummaryTimeoutSeconds: settings.ingestionVisionSummaryTimeoutSeconds,
    ingestionVisionSummaryMaxChars: settings.ingestionVisionSummaryMaxChars,
    ingestionVisionSummaryHttpUrl: settings.ingestionVisionSummaryHttpUrl,
    ingestionVisionSummaryHttpApiKey: settings.ingestionVisionSummaryHttpApiKey,
    ingestionVisionSummaryHttpHeadersTemplate: settings.ingestionVisionSummaryHttpHeadersTemplate,
    ingestionVisionSummaryHttpBodyTemplate: settings.ingestionVisionSummaryHttpBodyTemplate,
    ingestionVisionSummaryHttpResponseTextPath: settings.ingestionVisionSummaryHttpResponseTextPath,
};
}

function buildBackendChunkingPayload(settings: AppSettings) {
  return {
    ingestionChunkSize: settings.ingestionChunkSize,
    ingestionChunkOverlap: settings.ingestionChunkOverlap,
  };
}

function buildRuntimeConfigurableBackendPayload(settings: AppSettings) {
  return {
    defaultEmbeddingProvider: settings.embeddingProvider,
    googleEmbeddingModel: settings.googleEmbeddingModel,
    openaiAllowedEmbeddingModels: uniqueValues([
      ...(settings.openaiEmbeddingKnownModels || []),
      settings.openaiEmbeddingModel,
    ]),
    customAllowedEmbeddingModels: uniqueValues([
      ...(settings.customEmbeddingKnownModels || []),
      settings.customEmbeddingModel,
    ]),
    ollamaAllowedEmbeddingModels: uniqueValues([
      ...(settings.ollamaEmbeddingKnownModels || []),
      settings.ollamaEmbeddingModel,
    ]),
    openaiEmbeddingModel: settings.openaiEmbeddingModel,
    customEmbeddingUrl: settings.customEmbeddingUrl,
    customEmbeddingModel: settings.customEmbeddingModel,
    ollamaEmbeddingModel: settings.ollamaEmbeddingModel,
  };
}
