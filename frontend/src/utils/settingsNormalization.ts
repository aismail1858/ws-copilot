/**
 * Generic settings normalization utilities.
 * This file can be independently deleted and replaced with a different normalization approach.
 */

import type { AppSettings } from '@/types';
import { defaultSettings } from './settingsDefaults';
import {
  buildCustomProfileLabel,
  createCustomProfileId,
  extractCustomModelFamilies,
  migrateLegacyCustomProfiles,
  normalizeCustomProfiles,
  normalizeGeminiModelName,
  normalizeGoogleModelSettings,
  normalizeCustomLlmSettings,
  splitCustomModelIdentifier,
  uniqueNonEmpty,
} from './settingsNormalizationCustom';
import {
  normalizeEmbeddingSettings,
  normalizeGeneralSettings,
  normalizeMultiQuerySettings,
  normalizeRetrievalSettings,
  normalizeVisionSettings,
  normalizeCompletionSettings,
} from './settingsNormalizationSections';

/**
 * Configuration for normalizing a specific setting field.
 */
interface NormalizationConfig<T> {
  defaultValue: T;
  validator?: (value: unknown) => boolean;
  transformer?: (value: unknown) => T;
}

/**
 * Generic normalizer factory.
 */
export function createNormalizer<T>(config: NormalizationConfig<T>) {
  return (value: unknown): T => {
    if (config.validator && !config.validator(value)) return config.defaultValue;
    if (config.transformer) return config.transformer(value);
    return value as T;
  };
}

export {
  buildCustomProfileLabel,
  createCustomProfileId,
  extractCustomModelFamilies,
  migrateLegacyCustomProfiles,
  normalizeCustomProfiles,
  normalizeGeminiModelName,
  splitCustomModelIdentifier,
  uniqueNonEmpty,
};

/**
 * Normalize all application settings from potentially invalid data.
 */
export function normalizeLoadedSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    ...defaultSettings,
    ...settings,
    ...normalizeGeneralSettings(settings),
    ...normalizeEmbeddingSettings(settings),
    ...normalizeGoogleModelSettings(settings),
    ...normalizeCustomLlmSettings(settings),
    ...normalizeRetrievalSettings(settings),
    ...normalizeMultiQuerySettings(settings),
    ...normalizeVisionSettings(settings),
    ...normalizeCompletionSettings(settings),
  };
}
