import type { MyLlmConfigResponse, MyLlmSecretsResponse } from '@/api/client';
import {
  deriveModelListsFromProfiles,
  mergeKnownCustomProfileApiKeys,
  mergedKnownModels,
  normalizeProfiles,
  profileLabelFromModel,
  resolveActiveCustomProfile,
  sameProfiles,
  sameStringArray,
  splitCustomModelIdentifier,
  toKnownLlmProvider,
  toProfileId,
  uniqueValues,
} from '@/features/settings/utils/customProfiles';
import { restoreProfilesFromApiKeyMap } from '@/features/settings/utils/customProfileRestoration';
import type { AppSettings, CustomLlmProfile } from '@/types';

export function buildPatchFromMyLlmSecrets(
  latestSettings: AppSettings,
  secrets: MyLlmSecretsResponse
): Partial<AppSettings> | null {
  const baseProfiles = normalizeProfiles(latestSettings.customLlmProfiles || []);
  const normalizedProfiles = restoreProfilesFromApiKeyMap(
    baseProfiles,
    secrets.customLlmApiKeysByProfile,
    latestSettings.customLlmUrl || baseProfiles.find((profile) => profile.url)?.url || '',
    latestSettings.customKnownModels || []
  );
  const activeCustomProfile = resolveActiveCustomProfile(
    normalizedProfiles,
    latestSettings.activeCustomLlmProfileId,
    latestSettings.customLlmModel
  );
  const nextProfiles = applySecretsToProfiles(
    normalizedProfiles,
    secrets.customLlmApiKeysByProfile,
    activeCustomProfile.id,
    secrets.customLlmApiKey || ''
  );
  const nextActiveCustomProfile = resolveActiveCustomProfile(
    nextProfiles,
    activeCustomProfile.id,
    latestSettings.customLlmModel
  );

  if (!hasSecretChanges(latestSettings, secrets, normalizedProfiles, nextProfiles, nextActiveCustomProfile.apiKey)) {
    return null;
  }

  return {
    anthropicApiKey: secrets.anthropicApiKey || '',
    openaiApiKey: secrets.openaiApiKey || '',
    googleApiKey: secrets.googleApiKey || '',
    customLlmApiKey: nextActiveCustomProfile.apiKey,
    ollamaApiKey: secrets.ollamaApiKey || '',
    customLlmProfiles: nextProfiles,
  };
}

function hasSecretChanges(
  latestSettings: AppSettings,
  secrets: MyLlmSecretsResponse,
  currentProfiles: CustomLlmProfile[],
  nextProfiles: CustomLlmProfile[],
  nextActiveApiKey: string
) {
  return !(
    latestSettings.anthropicApiKey === secrets.anthropicApiKey &&
    latestSettings.openaiApiKey === secrets.openaiApiKey &&
    latestSettings.googleApiKey === secrets.googleApiKey &&
    latestSettings.customLlmApiKey === nextActiveApiKey &&
    latestSettings.ollamaApiKey === secrets.ollamaApiKey &&
    sameProfiles(currentProfiles, nextProfiles)
  );
}

export function buildPatchFromMyLlmConfig(
  latestSettings: AppSettings,
  latestSecrets: MyLlmSecretsResponse | null,
  config: MyLlmConfigResponse
): Partial<AppSettings> | null {
  const currentProfiles = normalizeProfiles(latestSettings.customLlmProfiles || []);
  const currentActiveProfile = resolveActiveCustomProfile(
    currentProfiles,
    latestSettings.activeCustomLlmProfileId,
    latestSettings.customLlmModel
  );
  const backendValues = deriveMyLlmRuntimeValues(latestSettings, config);
  const backendHasProfileData = backendValues.customProfiles.length > 0 || backendValues.model;
  const localHasProfiles = currentProfiles.some((p) => p.id !== 'custom-default' && p.model);

  let nextProfiles: CustomLlmProfile[];
  if (!backendHasProfileData && localHasProfiles) {
    nextProfiles = currentProfiles;
  } else {
    nextProfiles = buildProfilesFromBackend(
      currentProfiles,
      currentActiveProfile,
      latestSecrets,
      backendValues.customProfiles
    );
  }
  const nextActiveProfile = resolveNextActiveProfile(nextProfiles, currentActiveProfile.id, backendValues.model);
  const nextProfileLists = deriveNextProfileLists(latestSettings, nextProfiles, nextActiveProfile);

  const configChanges = hasMyLlmConfigChanges(latestSettings, currentProfiles, nextProfiles, nextActiveProfile, nextProfileLists, backendValues);
  if (!configChanges) {
    return null;
  }

  const patch: Partial<AppSettings> = {};

  if (latestSettings.llmProvider === backendValues.defaultLlmProvider) {
    patch.llmProvider = backendValues.defaultLlmProvider;
  }
  if (latestSettings.completionLlmProvider === backendValues.completionLlmProvider) {
    patch.completionLlmProvider = backendValues.completionLlmProvider;
  }
  if (latestSettings.anthropicModel === backendValues.anthropicModel) {
    patch.anthropicModel = backendValues.anthropicModel;
    patch.anthropicKnownModels = backendValues.anthropicKnownModels;
    patch.anthropicCompletionModel = backendValues.anthropicCompletionModel;
  }
  if (latestSettings.openaiModel === backendValues.openaiModel) {
    patch.openaiModel = backendValues.openaiModel;
    patch.openaiKnownModels = backendValues.openaiKnownModels;
    patch.openaiCompletionModel = backendValues.openaiCompletionModel;
  }
  if (latestSettings.googleModel === backendValues.googleModel) {
    patch.googleModel = backendValues.googleModel;
    patch.googleKnownModels = backendValues.googleKnownModels;
    patch.googleCompletionModel = backendValues.googleCompletionModel;
  }
  if (latestSettings.ollamaModel === backendValues.ollamaModel) {
    patch.ollamaModel = backendValues.ollamaModel;
    patch.ollamaKnownModels = backendValues.ollamaKnownModels;
    patch.ollamaUrl = backendValues.ollamaUrl;
    patch.ollamaCompletionModel = backendValues.ollamaCompletionModel;
  }
  if (latestSettings.customLlmModel === nextActiveProfile.model && latestSettings.customLlmUrl === nextActiveProfile.url) {
    patch.customLlmModelFamily = nextProfileLists.family;
    patch.customKnownModelFamilies = nextProfileLists.families;
    patch.customLlmModel = nextActiveProfile.model;
    patch.customLlmUrl = nextActiveProfile.url;
    patch.customKnownModels = nextProfileLists.models.length > 0 ? nextProfileLists.models : ['custom'];
    patch.customCompletionModel = backendValues.customCompletionModel;
    patch.customLlmProfiles = nextProfiles;
    patch.activeCustomLlmProfileId = nextActiveProfile.id;
    patch.customUserAddedProfileIds = nextProfileLists.userAddedProfileIds;
  }

  if (latestSettings.allowModelKnowledgeFallback === backendValues.allowModelKnowledgeFallback) {
    patch.allowModelKnowledgeFallback = backendValues.allowModelKnowledgeFallback;
  }
  if (latestSettings.systemPromptAddition === backendValues.systemPromptAddition) {
    patch.systemPromptAddition = backendValues.systemPromptAddition;
  }
  if (latestSettings.temperature === backendValues.temperature) {
    patch.temperature = backendValues.temperature;
  }

  if (latestSettings.titleLlmProvider === backendValues.titleLlmProvider) {
    patch.titleLlmProvider = backendValues.titleLlmProvider;
  }
  if (latestSettings.anthropicTitleModel === backendValues.anthropicTitleModel) {
    patch.anthropicTitleModel = backendValues.anthropicTitleModel;
  }
  if (latestSettings.openaiTitleModel === backendValues.openaiTitleModel) {
    patch.openaiTitleModel = backendValues.openaiTitleModel;
  }
  if (latestSettings.googleTitleModel === backendValues.googleTitleModel) {
    patch.googleTitleModel = backendValues.googleTitleModel;
  }
  if (latestSettings.ollamaTitleModel === backendValues.ollamaTitleModel) {
    patch.ollamaTitleModel = backendValues.ollamaTitleModel;
  }
  if (latestSettings.customTitleModel === backendValues.customTitleModel) {
    patch.customTitleModel = backendValues.customTitleModel;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}

function deriveMyLlmRuntimeValues(latestSettings: AppSettings, config: MyLlmConfigResponse) {
  const defaultLlmProvider = toKnownLlmProvider(
    config.defaultLlmProvider || latestSettings.llmProvider,
    latestSettings.llmProvider
  );
  const anthropicModel = (config.anthropicModel || latestSettings.anthropicModel).trim();
  const openaiModel = (config.openaiModel || latestSettings.openaiModel).trim();
  const googleModel = (config.googleModel || latestSettings.googleModel).trim();
  const ollamaModel = (config.ollamaModel || latestSettings.ollamaModel).trim();

  return {
    defaultLlmProvider,
    anthropicModel,
    anthropicKnownModels: mergedKnownModels(
      config.anthropicAllowedModels,
      anthropicModel,
      latestSettings.anthropicKnownModels || []
    ),
    openaiModel,
    openaiKnownModels: mergedKnownModels(
      config.openaiAllowedModels,
      openaiModel,
      latestSettings.openaiKnownModels || []
    ),
    googleModel,
    googleKnownModels: mergedKnownModels(
      config.googleAllowedModels,
      googleModel,
      latestSettings.googleKnownModels || []
    ),
    ollamaModel,
    ollamaKnownModels: mergedKnownModels(
      config.ollamaAllowedModels,
      ollamaModel,
      latestSettings.ollamaKnownModels || []
    ),
    model: (config.customLlmModel || latestSettings.customLlmModel || 'custom').trim(),
    url: (config.customLlmUrl || latestSettings.customLlmUrl || '').trim(),
    customProfiles: Array.isArray(config.customLlmProfiles) ? config.customLlmProfiles : [],
    ollamaUrl: (config.ollamaUrl || latestSettings.ollamaUrl).trim(),
    allowModelKnowledgeFallback:
      typeof config.allowModelKnowledgeFallback === 'boolean'
        ? config.allowModelKnowledgeFallback
        : latestSettings.allowModelKnowledgeFallback,
    systemPromptAddition:
      typeof config.systemPromptAddition === 'string'
        ? config.systemPromptAddition
        : latestSettings.systemPromptAddition,
    temperature:
      typeof config.temperature === 'number' && Number.isFinite(config.temperature)
        ? Math.max(0, Math.min(2, config.temperature))
        : latestSettings.temperature,
    completionLlmProvider: (config.completionLlmProvider || latestSettings.llmProvider || 'claude') as AppSettings['completionLlmProvider'],
    anthropicCompletionModel: config.anthropicCompletionModel || latestSettings.anthropicModel || latestSettings.anthropicCompletionModel,
    openaiCompletionModel: config.openaiCompletionModel || latestSettings.openaiModel || latestSettings.openaiCompletionModel,
    googleCompletionModel: config.googleCompletionModel || latestSettings.googleModel || latestSettings.googleCompletionModel,
    ollamaCompletionModel: config.ollamaCompletionModel || latestSettings.ollamaModel || latestSettings.ollamaCompletionModel,
    customCompletionModel: config.customCompletionModel || latestSettings.customLlmModel || latestSettings.customCompletionModel,
    titleLlmProvider: (config.titleLlmProvider || latestSettings.llmProvider || 'claude') as AppSettings['titleLlmProvider'],
    anthropicTitleModel: config.anthropicTitleModel || latestSettings.anthropicModel || latestSettings.anthropicTitleModel,
    openaiTitleModel: config.openaiTitleModel || latestSettings.openaiModel || latestSettings.openaiTitleModel,
    googleTitleModel: config.googleTitleModel || latestSettings.googleModel || latestSettings.googleTitleModel,
    ollamaTitleModel: config.ollamaTitleModel || latestSettings.ollamaModel || latestSettings.ollamaTitleModel,
    customTitleModel: config.customTitleModel || latestSettings.customLlmModel || latestSettings.customTitleModel,
  };
}

function buildProfilesFromBackend(
  currentProfiles: CustomLlmProfile[],
  currentActiveProfile: CustomLlmProfile,
  latestSecrets: MyLlmSecretsResponse | null,
  backendProfiles: Array<{ id: string; label: string; model: string; url: string }>
) {
  const mergedProfiles = mergeBackendProfiles(currentProfiles, backendProfiles);
  const normalizedProfiles = normalizeProfiles(mergedProfiles);
  return mergeKnownCustomProfileApiKeys(
    normalizedProfiles,
    currentProfiles,
    currentActiveProfile.id,
    currentActiveProfile.apiKey,
    latestSecrets
  );
}

function mergeBackendProfiles(
  localProfiles: CustomLlmProfile[],
  backendProfiles: Array<{ id: string; label: string; model: string; url: string }>
): CustomLlmProfile[] {
  if (backendProfiles.length === 0) return localProfiles;

  const localById = new Map(localProfiles.map((p) => [p.id, p]));
  const localByModel = new Map(localProfiles.map((p) => [p.model, p]));
  const merged: CustomLlmProfile[] = [];
  const usedLocalIds = new Set<string>();

  for (const bp of backendProfiles) {
    const id = (bp.id || '').trim() || toProfileId(bp.model);
    const localMatch = localById.get(id) || localByModel.get(bp.model);
    merged.push({
      id,
      label: (bp.label || '').trim() || localMatch?.label || profileLabelFromModel(bp.model || '', merged.length),
      model: (bp.model || '').trim(),
      url: (bp.url || '').trim() || localMatch?.url || '',
      apiKey: localMatch?.apiKey || '',
    });
    if (localMatch) usedLocalIds.add(localMatch.id);
  }

  for (const lp of localProfiles) {
    if (!usedLocalIds.has(lp.id)) {
      merged.push(lp);
    }
  }

  return merged;
}

function resolveNextActiveProfile(
  nextProfiles: CustomLlmProfile[],
  currentActiveProfileId: string,
  backendModel: string
) {
  return (
    nextProfiles.find((profile) => profile.model === backendModel) ||
    nextProfiles.find((profile) => profile.id === currentActiveProfileId) ||
    nextProfiles[0]
  );
}

function deriveNextProfileLists(
  latestSettings: AppSettings,
  nextProfiles: CustomLlmProfile[],
  nextActiveProfile: CustomLlmProfile
) {
  const { knownModels, knownFamilies } = deriveModelListsFromProfiles(nextProfiles);
  return {
    models: knownModels,
    families: knownFamilies,
    family: splitCustomModelIdentifier(nextActiveProfile.model).family || 'custom',
    userAddedProfileIds: uniqueValues(
      (latestSettings.customUserAddedProfileIds || []).filter((id) =>
        nextProfiles.some((profile) => profile.id === id)
      )
    ),
  };
}

function hasMyLlmConfigChanges(
  latestSettings: AppSettings,
  currentProfiles: CustomLlmProfile[],
  nextProfiles: CustomLlmProfile[],
  nextActiveProfile: CustomLlmProfile,
  nextProfileLists: {
    models: string[];
    families: string[];
    family: string;
    userAddedProfileIds: string[];
  },
  backendValues: ReturnType<typeof deriveMyLlmRuntimeValues>
) {
  return !(
    latestSettings.llmProvider === backendValues.defaultLlmProvider &&
    latestSettings.anthropicModel === backendValues.anthropicModel &&
    sameStringArray(latestSettings.anthropicKnownModels || [], backendValues.anthropicKnownModels) &&
    latestSettings.openaiModel === backendValues.openaiModel &&
    sameStringArray(latestSettings.openaiKnownModels || [], backendValues.openaiKnownModels) &&
    latestSettings.googleModel === backendValues.googleModel &&
    sameStringArray(latestSettings.googleKnownModels || [], backendValues.googleKnownModels) &&
    latestSettings.ollamaModel === backendValues.ollamaModel &&
    sameStringArray(latestSettings.ollamaKnownModels || [], backendValues.ollamaKnownModels) &&
    latestSettings.ollamaUrl === backendValues.ollamaUrl &&
    latestSettings.allowModelKnowledgeFallback === backendValues.allowModelKnowledgeFallback &&
    latestSettings.systemPromptAddition === backendValues.systemPromptAddition &&
    latestSettings.temperature === backendValues.temperature &&
    latestSettings.customLlmModel === nextActiveProfile.model &&
    latestSettings.customLlmUrl === nextActiveProfile.url &&
    latestSettings.activeCustomLlmProfileId === nextActiveProfile.id &&
    sameStringArray(latestSettings.customKnownModels || [], nextProfileLists.models) &&
    latestSettings.customLlmModelFamily === nextProfileLists.family &&
    sameStringArray(latestSettings.customKnownModelFamilies || [], nextProfileLists.families) &&
    sameStringArray(
      latestSettings.customUserAddedProfileIds || [],
      nextProfileLists.userAddedProfileIds
    ) &&
    sameProfiles(currentProfiles, nextProfiles) &&
    latestSettings.completionLlmProvider === backendValues.completionLlmProvider &&
    latestSettings.anthropicCompletionModel === backendValues.anthropicCompletionModel &&
    latestSettings.openaiCompletionModel === backendValues.openaiCompletionModel &&
    latestSettings.googleCompletionModel === backendValues.googleCompletionModel &&
    latestSettings.ollamaCompletionModel === backendValues.ollamaCompletionModel &&
    latestSettings.customCompletionModel === backendValues.customCompletionModel &&
    latestSettings.titleLlmProvider === backendValues.titleLlmProvider &&
    latestSettings.anthropicTitleModel === backendValues.anthropicTitleModel &&
    latestSettings.openaiTitleModel === backendValues.openaiTitleModel &&
    latestSettings.googleTitleModel === backendValues.googleTitleModel &&
    latestSettings.ollamaTitleModel === backendValues.ollamaTitleModel &&
    latestSettings.customTitleModel === backendValues.customTitleModel
  );
}

function applySecretsToProfiles(
  profiles: CustomLlmProfile[],
  apiKeysByProfile: Record<string, string>,
  activeProfileId: string,
  activeApiKey: string
) {
  return mergeKnownCustomProfileApiKeys(profiles, profiles, activeProfileId, activeApiKey, {
    customLlmApiKeysByProfile: apiKeysByProfile,
    customLlmApiKey: activeApiKey,
  } as MyLlmSecretsResponse);
}
