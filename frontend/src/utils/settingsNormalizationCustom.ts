import type { AppSettings, CustomLlmProfile } from '@/types';
import { defaultSettings } from './settingsDefaults';

type CustomProfileState = {
  profiles: CustomLlmProfile[];
  activeProfileId: string;
};

type CustomLlmSettings = Pick<
  AppSettings,
  | 'customLlmModelFamily'
  | 'customKnownModelFamilies'
  | 'customLlmModel'
  | 'customKnownModels'
  | 'customLlmUrl'
  | 'customLlmApiKey'
  | 'customLlmProfiles'
  | 'activeCustomLlmProfileId'
  | 'customUserAddedProfileIds'
>;

export function normalizeGeminiModelName(modelName: string): string {
  const normalized = (modelName || '').trim().replace(/^models\//, '');
  if (!normalized) return defaultSettings.googleModel;
  const legacyMap: Record<string, string> = {
    'gemini-1.0-pro': 'gemini-2.5-flash',
    'gemini-1.5-pro': 'gemini-2.5-flash',
    'gemini-1.5-flash': 'gemini-2.5-flash',
    'gemini-pro': 'gemini-2.5-flash',
  };
  return legacyMap[normalized] ?? normalized;
}

export function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function splitCustomModelIdentifier(
  identifier: string,
  fallbackFamily = 'custom'
): { family: string; model: string } {
  const trimmed = (identifier || '').trim();
  const fallback = (fallbackFamily || 'custom').trim();
  if (!trimmed) return { family: fallback, model: 'custom' };
  const slashIndex = trimmed.indexOf('/');
  if (slashIndex <= 0 || slashIndex === trimmed.length - 1) {
    return { family: fallback, model: trimmed };
  }
  return {
    family: trimmed.slice(0, slashIndex).trim() || fallback,
    model: trimmed.slice(slashIndex + 1).trim() || 'custom',
  };
}

export function extractCustomModelFamilies(modelIdentifiers: string[]): string[] {
  return uniqueNonEmpty(
    modelIdentifiers.map((identifier) => splitCustomModelIdentifier(identifier).family)
  );
}

export function createCustomProfileId(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'custom-profile';
}

export function buildCustomProfileLabel(modelIdentifier: string, index: number): string {
  const parsed = splitCustomModelIdentifier(modelIdentifier);
  if (parsed.family && parsed.family !== 'custom') return parsed.family;
  if (parsed.model) return parsed.model;
  return `Custom ${index + 1}`;
}

function withLeadingValue(values: string[], requiredValue: string): string[] {
  if (values.includes(requiredValue)) return values;
  return [requiredValue, ...values];
}

function normalizeCustomProfile(
  profile: CustomLlmProfile,
  index: number,
  usedIds: Set<string>
): CustomLlmProfile {
  const normalizedModel = (profile.model || '').trim() || 'custom';
  const normalizedLabel =
    (profile.label || '').trim() || buildCustomProfileLabel(normalizedModel, index);
  const baseId = createCustomProfileId((profile.id || '').trim() || normalizedLabel || normalizedModel);
  let normalizedId = baseId;
  let suffix = 2;

  while (usedIds.has(normalizedId)) {
    normalizedId = `${baseId}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(normalizedId);

  return {
    id: normalizedId,
    label: normalizedLabel,
    model: normalizedModel,
    url: (profile.url || '').trim(),
    apiKey: (profile.apiKey || '').trim(),
  };
}

function fallbackCustomProfile(settings: Partial<AppSettings>): CustomProfileState {
  const profile: CustomLlmProfile = {
    id: 'custom-default',
    label: 'Custom',
    model: 'custom',
    url: (settings.customLlmUrl || '').trim(),
    apiKey: (settings.customLlmApiKey || '').trim(),
  };
  return { profiles: [profile], activeProfileId: profile.id };
}

function resolveActiveProfileId(
  profiles: CustomLlmProfile[],
  requestedActiveProfileId: string,
  selectedLegacyModel: string
): string {
  return (
    profiles.find((profile) => profile.id === requestedActiveProfileId)?.id ||
    profiles.find((profile) => profile.model === selectedLegacyModel)?.id ||
    profiles[0]?.id ||
    'custom-default'
  );
}

export function migrateLegacyCustomProfiles(settings: Partial<AppSettings>): CustomLlmProfile[] {
  const selectedLegacyModel = (settings.customLlmModel || '').trim();
  const legacyModelList = uniqueNonEmpty([
    ...(settings.customKnownModels || []),
    selectedLegacyModel || 'custom',
  ]);

  return legacyModelList.map((modelIdentifier, index) => {
    const normalizedModel = (modelIdentifier || '').trim() || 'custom';
    const isSelectedLegacyModel =
      normalizedModel === selectedLegacyModel || (!selectedLegacyModel && index === 0);
    return {
      id: createCustomProfileId(normalizedModel || `custom-${index + 1}`),
      label: buildCustomProfileLabel(normalizedModel, index),
      model: normalizedModel,
      url: isSelectedLegacyModel ? (settings.customLlmUrl || '').trim() : '',
      apiKey: isSelectedLegacyModel ? (settings.customLlmApiKey || '').trim() : '',
    };
  });
}

export function normalizeCustomProfiles(settings: Partial<AppSettings>): CustomProfileState {
  const storedProfiles = Array.isArray(settings.customLlmProfiles) ? settings.customLlmProfiles : [];
  const sourceProfiles =
    storedProfiles.length > 0 ? storedProfiles : migrateLegacyCustomProfiles(settings);
  const usedIds = new Set<string>();
  const normalizedProfiles = sourceProfiles
    .map((profile, index) => normalizeCustomProfile(profile, index, usedIds))
    .filter((profile) => Boolean(profile.model));

  if (normalizedProfiles.length === 0) return fallbackCustomProfile(settings);

  return {
    profiles: normalizedProfiles,
    activeProfileId: resolveActiveProfileId(
      normalizedProfiles,
      (settings.activeCustomLlmProfileId || '').trim(),
      (settings.customLlmModel || '').trim()
    ),
  };
}

export function normalizeGoogleModelSettings(
  settings: Partial<AppSettings>
): Pick<AppSettings, 'googleModel' | 'googleKnownModels'> {
  const googleModel = normalizeGeminiModelName(settings.googleModel as string);
  const googleKnownModels = uniqueNonEmpty(
    ((settings.googleKnownModels || []) as string[])
      .map((model) => normalizeGeminiModelName(model))
      .filter(Boolean)
  );
  return {
    googleModel,
    googleKnownModels: withLeadingValue(
      googleKnownModels.length > 0 ? googleKnownModels : [...defaultSettings.googleKnownModels],
      googleModel
    ),
  };
}

export function normalizeCustomLlmSettings(settings: Partial<AppSettings>): CustomLlmSettings {
  const { profiles, activeProfileId } = normalizeCustomProfiles(settings);
  const activeProfile = profiles.find((profile) => profile.id === activeProfileId) || profiles[0];
  const activeModelParts = splitCustomModelIdentifier(
    activeProfile.model,
    settings.customLlmModelFamily as string
  );
  const selectedCustomFamily = (
    (settings.customLlmModelFamily || '') ||
    activeModelParts.family ||
    'custom'
  ).trim();
  const customKnownModels = withLeadingValue(
    uniqueNonEmpty([
      ...profiles.map((profile) => profile.model),
      ...((settings.customKnownModels || []) as string[]),
      activeProfile.model,
    ]),
    activeProfile.model
  );
  const customKnownModelFamilies = withLeadingValue(
    uniqueNonEmpty([
      ...((settings.customKnownModelFamilies || []) as string[]),
      ...extractCustomModelFamilies(customKnownModels),
      selectedCustomFamily,
    ]),
    selectedCustomFamily
  );

  return {
    customLlmModelFamily: selectedCustomFamily,
    customKnownModelFamilies,
    customLlmModel: activeProfile.model,
    customKnownModels,
    customLlmUrl: activeProfile.url,
    customLlmApiKey: activeProfile.apiKey,
    customLlmProfiles: profiles,
    activeCustomLlmProfileId: activeProfile.id,
    customUserAddedProfileIds: uniqueNonEmpty(
      ((settings.customUserAddedProfileIds || []) as string[]).filter((profileId) =>
        profiles.some((profile) => profile.id === profileId)
      )
    ),
  };
}
