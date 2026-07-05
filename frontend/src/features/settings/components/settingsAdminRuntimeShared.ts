import type { AppSettings, CustomLlmProfile } from '@/types';

export interface RuntimeSettingsProps {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export interface SettingsAdminRuntimeSectionProps extends RuntimeSettingsProps {
  customProfiles: CustomLlmProfile[];
  activeCustomProfile: CustomLlmProfile;
  setActiveCustomProfile: (profileId: string) => void;
  updateCustomProfile: (
    profileId: string,
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  applyLocalRerankerPreset: () => void;
}

export interface VisionRuntimeProps extends RuntimeSettingsProps {
  customProfiles: CustomLlmProfile[];
  activeCustomProfile: CustomLlmProfile;
  setActiveCustomProfile: (profileId: string) => void;
  updateCustomProfile: (
    profileId: string,
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
}

export function clampIntegerInput(value: string, min: number, max: number, fallback = min) {
  return Math.max(min, Math.min(max, Math.round(parseFloat(value) || fallback)));
}

export function clampDecimalInput(value: string, min: number, max: number, fallback = min) {
  return Math.max(min, Math.min(max, parseFloat(value) || fallback));
}
