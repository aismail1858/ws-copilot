// Model picker constants and types

import {
  listEditableCustomProfiles,
  resolveActiveEditableCustomProfile,
} from '@/features/settings/utils/customProfiles';
import type { CustomLlmProfile, LLMProvider } from '@/types';

export interface ProviderInfo {
  id: LLMProvider;
  label: string;
  color: string;
  modelKey: keyof ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings'];
  modelsKey: keyof ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings'];
}

export interface ModelOption {
  id: string;
  provider: LLMProvider;
  model: string;
  searchIndex: string;
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'claude',
    label: 'Claude',
    color: 'bg-[#f3aa7f]',
    modelKey: 'anthropicModel',
    modelsKey: 'anthropicKnownModels',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    color: 'bg-[#d97a45]',
    modelKey: 'googleModel',
    modelsKey: 'googleKnownModels',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    color: 'bg-[#756b62]',
    modelKey: 'openaiModel',
    modelsKey: 'openaiKnownModels',
  },
  {
    id: 'ollama',
    label: 'Ollama',
    color: 'bg-[#ee9a68]',
    modelKey: 'ollamaModel',
    modelsKey: 'ollamaKnownModels',
  },
  {
    id: 'custom',
    label: 'Custom',
    color: 'bg-[#2f2b26]',
    modelKey: 'customLlmModel',
    modelsKey: 'customKnownModels',
  },
];

export function encodeModelOptionValue(provider: LLMProvider, model: string): string {
  const MODEL_OPTION_SEPARATOR = '::';
  return `${provider}${MODEL_OPTION_SEPARATOR}${model}`;
}

export function normalizeModelList(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export function isLikelyRerankerModel(model: string): boolean {
  return model.trim().toLowerCase().includes('rerank');
}

export function filterChatCompatibleOllamaModels(models: string[]): string[] {
  return normalizeModelList(models).filter((model) => !isLikelyRerankerModel(model));
}

export function getModelsForProvider(
  provider: ProviderInfo,
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings']
): string[] {
  if (provider.id === 'custom') {
    return normalizeModelList(
      listEditableCustomProfiles(settings.customLlmProfiles || []).map((profile) => profile.model)
    );
  }

  if (provider.id === 'ollama') {
    return filterChatCompatibleOllamaModels([
      ...((settings[provider.modelsKey] as string[]) || []),
      String(settings[provider.modelKey] || ''),
    ]);
  }

  return normalizeModelList([
    ...((settings[provider.modelsKey] as string[]) || []),
    String(settings[provider.modelKey] || ''),
  ]);
}

export function getActiveProvider(
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings']
): ProviderInfo {
  return PROVIDERS.find((x) => x.id === settings.llmProvider) || PROVIDERS[0];
}

export function getActiveModel(
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings']
): string {
  const p = getActiveProvider(settings);
  if (!p) return 'Unknown';
  if (p.id === 'custom') {
    const activeCustomProfile = getActiveCustomProfile(settings);
    return activeCustomProfile.label || activeCustomProfile.model || p.label;
  }
  return (settings[p.modelKey] as string) || p.label;
}

export function getActiveCustomProfile(
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings']
): CustomLlmProfile {
  const profiles = settings.customLlmProfiles || [];
  const resolvedProfile = resolveActiveEditableCustomProfile(
    profiles,
    settings.activeCustomLlmProfileId,
    settings.customLlmModel
  );
  return (
    resolvedProfile || {
      id: 'custom-default',
      label: 'Custom',
      model: settings.customLlmModel || 'custom',
      url: settings.customLlmUrl || '',
      apiKey: settings.customLlmApiKey || '',
    }
  );
}

export function buildPerUserModelConfigPayload(
  settings: ReturnType<typeof import('@/context/SettingsContext').useSettings>['settings']
) {
  const activeCustomProfile = getActiveCustomProfile(settings);
  const customProfileModels = normalizeModelList(
    listEditableCustomProfiles(settings.customLlmProfiles || []).map((profile: any) => profile.model)
  );
  const hasEditableActiveCustomProfile = activeCustomProfile.id !== 'custom-default';

  return {
    defaultLlmProvider: settings.llmProvider,
    allowModelKnowledgeFallback: settings.allowModelKnowledgeFallback,
    anthropicAllowedModels: normalizeModelList([
      ...(settings.anthropicKnownModels || []),
      settings.anthropicModel,
    ]),
    openaiAllowedModels: normalizeModelList([
      ...(settings.openaiKnownModels || []),
      settings.openaiModel,
    ]),
    googleAllowedModels: normalizeModelList([
      ...(settings.googleKnownModels || []),
      settings.googleModel,
    ]),
    ollamaAllowedModels: filterChatCompatibleOllamaModels([
      ...(settings.ollamaKnownModels || []),
      settings.ollamaModel,
    ]),
    customAllowedModels: normalizeModelList([
      ...(settings.customKnownModels || []).filter((model) => model !== 'custom'),
      ...customProfileModels,
      ...(hasEditableActiveCustomProfile ? [activeCustomProfile.model] : []),
    ]),
    anthropicModel: settings.anthropicModel,
    openaiModel: settings.openaiModel,
    googleModel: settings.googleModel,
    ollamaModel: settings.ollamaModel,
    customLlmModel: hasEditableActiveCustomProfile ? activeCustomProfile.model : settings.customLlmModel,
    customLlmUrl: hasEditableActiveCustomProfile ? activeCustomProfile.url : settings.customLlmUrl,
    ollamaUrl: settings.ollamaUrl,
  };
}
