import type { MyLlmSecretsResponse } from '@/api/client';
import {
  DEFAULT_CUSTOM_PROFILE_ID,
  EMBEDDING_PROVIDERS,
  LLM_PROVIDERS,
  VISION_PROVIDERS,
  type VisionProvider,
} from '@/features/settings/types';
import type { CustomLlmProfile, EmbeddingProvider, LLMProvider } from '@/types';

export function buildDefaultCustomProfile(): CustomLlmProfile {
  return {
    id: DEFAULT_CUSTOM_PROFILE_ID,
    label: 'Custom',
    model: 'custom',
    url: '',
    apiKey: '',
  };
}

export function isDefaultCustomProfileId(profileId: string): boolean {
  return (profileId || '').trim() === DEFAULT_CUSTOM_PROFILE_ID;
}

export function listEditableCustomProfiles(profiles: CustomLlmProfile[]): CustomLlmProfile[] {
  return profiles.filter((profile) => !isDefaultCustomProfileId(profile.id));
}

export function uniqueValues(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export function splitCustomModelIdentifier(
  modelIdentifier: string
): { family: string; model: string } {
  const normalizedModelIdentifier = (modelIdentifier || '').trim();

  if (!normalizedModelIdentifier) {
    return { family: 'custom', model: 'custom' };
  }

  const slashIndex = normalizedModelIdentifier.indexOf('/');
  if (slashIndex <= 0 || slashIndex === normalizedModelIdentifier.length - 1) {
    return { family: 'custom', model: normalizedModelIdentifier };
  }

  return {
    family: normalizedModelIdentifier.slice(0, slashIndex).trim() || 'custom',
    model: normalizedModelIdentifier.slice(slashIndex + 1).trim() || 'custom',
  };
}

export function toProfileId(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || DEFAULT_CUSTOM_PROFILE_ID;
}

export function nextUniqueProfileId(value: string, existingIds: Set<string>): string {
  const baseId = toProfileId(value);
  let nextId = baseId;
  let suffix = 2;
  while (existingIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return nextId;
}

export function profileLabelFromModel(model: string, index: number): string {
  const parts = splitCustomModelIdentifier(model);
  if (parts.family && parts.family !== 'custom') return parts.family;
  if (parts.model) return parts.model;
  return `Custom ${index + 1}`;
}

export function normalizeProfiles(profiles: CustomLlmProfile[]): CustomLlmProfile[] {
  const defaultProfile = buildDefaultCustomProfile();
  const usedIds = new Set<string>([defaultProfile.id]);
  const normalized = profiles
    .filter((profile) => !isDefaultCustomProfileId(profile.id))
    .map((profile, index) => {
      const model = (profile.model || '').trim() || 'custom';
      const label = (profile.label || '').trim() || profileLabelFromModel(model, index);
      const baseId = toProfileId((profile.id || '').trim() || label || model);
      let id = baseId;
      let suffix = 2;
      while (usedIds.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }
      usedIds.add(id);
      return {
        id,
        label,
        model,
        url: (profile.url || '').trim(),
        apiKey: (profile.apiKey || '').trim(),
      } satisfies CustomLlmProfile;
    })
    .filter((profile) => Boolean(profile.model));

  return [defaultProfile, ...normalized];
}

export function deriveModelListsFromProfiles(profiles: CustomLlmProfile[]): {
  knownModels: string[];
  knownFamilies: string[];
} {
  const knownModels = uniqueValues(listEditableCustomProfiles(profiles).map((profile) => profile.model));
  const knownFamilies = uniqueValues(
    knownModels.map((modelIdentifier) => splitCustomModelIdentifier(modelIdentifier).family)
  );
  return { knownModels, knownFamilies };
}

export function resolveActiveEditableCustomProfile(
  profiles: CustomLlmProfile[],
  activeProfileId: string,
  currentModel: string
): CustomLlmProfile | null {
  const editableProfiles = listEditableCustomProfiles(profiles);
  return (
    editableProfiles.find((profile) => profile.id === activeProfileId) ||
    editableProfiles.find((profile) => profile.model === currentModel) ||
    editableProfiles[0] ||
    null
  );
}

export function resolveActiveCustomProfile(
  profiles: CustomLlmProfile[],
  activeProfileId: string,
  currentModel: string
): CustomLlmProfile {
  return (
    profiles.find((profile) => profile.id === activeProfileId) ||
    profiles.find((profile) => profile.model === currentModel) ||
    profiles[0]
  );
}

export function normalizeCustomProfileApiKeyMap(
  apiKeysByProfile: Record<string, string> | undefined
): Record<string, string> {
  const entries = Object.entries(apiKeysByProfile || {}).flatMap(([rawProfileId, rawApiKey]) => {
    const profileId = rawProfileId.trim();
    const apiKey = rawApiKey.trim();
    return profileId && apiKey ? ([[profileId, apiKey]] as const) : [];
  });
  return Object.fromEntries(entries);
}

export function buildCustomProfileApiKeyMap(profiles: CustomLlmProfile[]): Record<string, string> {
  return Object.fromEntries(
    profiles.flatMap((profile) => {
      const profileId = (profile.id || '').trim();
      const apiKey = (profile.apiKey || '').trim();
      if (!profileId || isDefaultCustomProfileId(profileId) || !apiKey) {
        return [];
      }
      return [[profileId, apiKey] as const];
    })
  );
}

export function applyCustomProfileApiKeys(
  profiles: CustomLlmProfile[],
  apiKeysByProfile: Record<string, string>,
  fallbackActiveProfileId: string,
  fallbackActiveApiKey: string
): CustomLlmProfile[] {
  const normalizedApiKeysByProfile = normalizeCustomProfileApiKeyMap(apiKeysByProfile);
  const hasProfileMap = Object.keys(normalizedApiKeysByProfile).length > 0;
  const normalizedFallbackApiKey = fallbackActiveApiKey.trim();

  return profiles.map((profile) => {
    if (isDefaultCustomProfileId(profile.id)) {
      return { ...profile, apiKey: '' };
    }

    const mappedApiKey = normalizedApiKeysByProfile[profile.id] || '';
    if (hasProfileMap) {
      return { ...profile, apiKey: mappedApiKey };
    }

    if (profile.id === fallbackActiveProfileId) {
      return { ...profile, apiKey: normalizedFallbackApiKey };
    }

    return { ...profile, apiKey: '' };
  });
}

export function mergeKnownCustomProfileApiKeys(
  profiles: CustomLlmProfile[],
  currentProfiles: CustomLlmProfile[],
  activeProfileId: string,
  activeProfileApiKey: string,
  secrets: MyLlmSecretsResponse | null
): CustomLlmProfile[] {
  const mergedApiKeysByProfile = {
    ...buildCustomProfileApiKeyMap(currentProfiles),
    ...normalizeCustomProfileApiKeyMap(secrets?.customLlmApiKeysByProfile),
  };
  const fallbackActiveApiKey =
    (secrets?.customLlmApiKey || '').trim() || activeProfileApiKey.trim();
  return applyCustomProfileApiKeys(
    profiles,
    mergedApiKeysByProfile,
    activeProfileId,
    fallbackActiveApiKey
  );
}

export function sameStringArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function sameProfiles(left: CustomLlmProfile[], right: CustomLlmProfile[]): boolean {
  return (
    left.length === right.length &&
    left.every((profile, index) => {
      const other = right[index];
      return (
        profile.id === other.id &&
        profile.label === other.label &&
        profile.model === other.model &&
        profile.url === other.url &&
        profile.apiKey === other.apiKey
      );
    })
  );
}

export function toKnownLlmProvider(value: string, fallback: LLMProvider): LLMProvider {
  const normalized = (value || '').trim().toLowerCase() as LLMProvider;
  return LLM_PROVIDERS.includes(normalized) ? normalized : fallback;
}

export function toKnownEmbeddingProvider(value: string, fallback: EmbeddingProvider): EmbeddingProvider {
  const normalized = (value || '').trim().toLowerCase() as EmbeddingProvider;
  return EMBEDDING_PROVIDERS.includes(normalized) ? normalized : fallback;
}

export function toKnownVisionProvider(value: string, fallback: VisionProvider): VisionProvider {
  const normalized = (value || '').trim().toLowerCase() as VisionProvider;
  return VISION_PROVIDERS.includes(normalized) ? normalized : fallback;
}

export function mergedKnownModels(
  allowedModels: string[] | undefined,
  activeModel: string,
  fallbackModels: string[]
): string[] {
  const merged = uniqueValues([...(allowedModels || []), activeModel]);
  return merged.length > 0 ? merged : fallbackModels;
}
