import {
  normalizeProfiles,
  resolveActiveCustomProfile,
} from '@/features/settings/utils/customProfiles';
import {
  buildBackendConfigPayload,
  buildMyLlmConfigPayload,
  buildMyLlmSecretsPayload,
} from '@/features/settings/utils/settingsRuntimePayloads';
import type { AppSettings } from '@/types';

function resolveRuntimeProfile(settings: AppSettings) {
  const normalizedProfiles = normalizeProfiles(settings.customLlmProfiles || []);
  const activeCustomProfile = resolveActiveCustomProfile(
    normalizedProfiles,
    settings.activeCustomLlmProfileId,
    settings.customLlmModel
  );
  return { activeCustomProfile, normalizedProfiles };
}

export function buildMyLlmConfigSignature(
  settings: AppSettings,
  runtimeModelConfigurable: boolean
): string {
  const { activeCustomProfile, normalizedProfiles } = resolveRuntimeProfile(settings);
  return JSON.stringify(
    buildMyLlmConfigPayload(
      settings,
      normalizedProfiles,
      activeCustomProfile,
      runtimeModelConfigurable
    )
  );
}

export function buildMyLlmSecretsSignature(settings: AppSettings): string {
  const { activeCustomProfile, normalizedProfiles } = resolveRuntimeProfile(settings);
  return JSON.stringify(
    buildMyLlmSecretsPayload(settings, normalizedProfiles, activeCustomProfile)
  );
}

export function buildBackendConfigSignature(
  settings: AppSettings,
  runtimeModelConfigurable: boolean
): string {
  return JSON.stringify(
    buildBackendConfigPayload(settings, runtimeModelConfigurable)
  );
}
