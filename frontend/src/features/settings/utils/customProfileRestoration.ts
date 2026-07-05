import type { CustomLlmProfile } from '@/types';

import {
  isDefaultCustomProfileId,
  listEditableCustomProfiles,
  normalizeCustomProfileApiKeyMap,
  normalizeProfiles,
  profileLabelFromModel,
  toProfileId,
} from './customProfiles';

export function restoreProfilesFromApiKeyMap(
  profiles: CustomLlmProfile[],
  apiKeysByProfile: Record<string, string> | undefined,
  fallbackUrl: string,
  knownModels: string[] = []
): CustomLlmProfile[] {
  const normalizedProfiles = normalizeProfiles(profiles);
  const normalizedFallbackUrl = fallbackUrl.trim();
  if (!normalizedFallbackUrl) {
    return normalizedProfiles;
  }

  const existingIds = new Set(normalizedProfiles.map((profile) => profile.id));
  const existingModels = new Set(normalizedProfiles.map((profile) => profile.model));
  const additions = Object.keys(normalizeCustomProfileApiKeyMap(apiKeysByProfile)).flatMap(
    (profileId, index) =>
      buildRestoredProfile(
        profileId,
        index,
        knownModels,
        normalizedFallbackUrl,
        normalizedProfiles.length,
        existingIds,
        existingModels
      )
  );

  return additions.length > 0
    ? normalizeProfiles([...listEditableCustomProfiles(normalizedProfiles), ...additions])
    : normalizedProfiles;
}

function buildRestoredProfile(
  profileId: string,
  index: number,
  knownModels: string[],
  fallbackUrl: string,
  profileCount: number,
  existingIds: Set<string>,
  existingModels: Set<string>
): CustomLlmProfile[] {
  if (existingIds.has(profileId)) {
    return [];
  }
  const model = inferModelFromProfileId(profileId, knownModels);
  if (!model || existingModels.has(model)) {
    return [];
  }
  existingIds.add(profileId);
  existingModels.add(model);
  return [
    {
      id: profileId,
      label: profileLabelFromModel(model, profileCount + index),
      model,
      url: fallbackUrl,
      apiKey: '',
    },
  ];
}

function inferModelFromProfileId(profileId: string, knownModels: string[]): string | null {
  const normalizedProfileId = profileId.trim().toLowerCase();
  if (
    !normalizedProfileId ||
    normalizedProfileId.startsWith('sk-') ||
    isDefaultCustomProfileId(normalizedProfileId)
  ) {
    return null;
  }

  const knownModel = knownModels.find((model) => toProfileId(model) === normalizedProfileId);
  if (knownModel) {
    return knownModel.trim();
  }

  const parts = normalizedProfileId.split('-').filter(Boolean);
  if (parts.length < 3) {
    return null;
  }

  const family = parts[0];
  const modelParts = parts.slice(1);
  const suffix = modelParts[modelParts.length - 1];
  const channelSuffixes = new Set(['free', 'latest', 'preview', 'beta', 'alpha']);
  const model =
    channelSuffixes.has(suffix) && modelParts.length > 1
      ? `${modelParts.slice(0, -1).join('-')}:${suffix}`
      : modelParts.join('-');

  if (!family || !model) {
    return null;
  }
  return `${family}/${model}`;
}
