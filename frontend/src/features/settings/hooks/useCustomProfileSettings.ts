import { useEffect, useState } from 'react';
import type { NewCustomProfileDraft } from '@/features/settings/types';
import {
  deriveModelListsFromProfiles,
  isDefaultCustomProfileId,
  listEditableCustomProfiles,
  nextUniqueProfileId,
  normalizeProfiles,
  profileLabelFromModel,
  splitCustomModelIdentifier,
  uniqueValues,
} from '@/features/settings/utils/customProfiles';
import type { AppSettings, CustomLlmProfile } from '@/types';

const EMPTY_NEW_CUSTOM_PROFILE_DRAFT: NewCustomProfileDraft = {
  label: '',
  model: '',
  url: '',
  apiKey: '',
};

interface UseCustomProfileSettingsProps {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  isVisible: boolean;
}

function hasDraftChangedFromSource(
  draft: NewCustomProfileDraft,
  source: Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>
): boolean {
  return (
    draft.label.trim() !== source.label.trim() ||
    draft.model.trim() !== source.model.trim() ||
    draft.url.trim() !== source.url.trim() ||
    draft.apiKey.trim() !== source.apiKey.trim()
  );
}

export function useCustomProfileSettings({
  settings,
  updateSettings,
  isVisible,
}: UseCustomProfileSettingsProps) {
  const [newCustomProfileDraft, setNewCustomProfileDraft] = useState<NewCustomProfileDraft>(
    EMPTY_NEW_CUSTOM_PROFILE_DRAFT
  );
  const [isNewCustomProfileDraftActive, setIsNewCustomProfileDraftActive] = useState(false);
  const [duplicatedCustomProfileSource, setDuplicatedCustomProfileSource] =
    useState<CustomLlmProfile | null>(null);

  const customProfiles = normalizeProfiles(settings.customLlmProfiles || []);
  const editableCustomProfiles = listEditableCustomProfiles(customProfiles);
  const activeCustomProfile =
    customProfiles.find((profile) => profile.id === settings.activeCustomLlmProfileId) ||
    customProfiles.find((profile) => profile.model === settings.customLlmModel) ||
    customProfiles[0];
  const isDefaultActiveCustomProfile = isDefaultCustomProfileId(activeCustomProfile.id);
  const canAddCustomProfile = Boolean(
    newCustomProfileDraft.model.trim() && newCustomProfileDraft.url.trim()
  );

  const resetNewCustomProfileDraft = () => {
    setNewCustomProfileDraft(EMPTY_NEW_CUSTOM_PROFILE_DRAFT);
    setIsNewCustomProfileDraftActive(false);
    setDuplicatedCustomProfileSource(null);
  };

  const createCustomProfileFromPatch = (
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => {
    const normalizedModel = (patch.model ?? activeCustomProfile.model).trim() || 'custom';
    const normalizedLabel =
      (patch.label ?? '').trim() ||
      profileLabelFromModel(normalizedModel, editableCustomProfiles.length);
    const profileId = nextUniqueProfileId(
      normalizedLabel || normalizedModel,
      new Set(customProfiles.map((profile) => profile.id))
    );

    return {
      id: profileId,
      label: normalizedLabel,
      model: normalizedModel,
      url: (patch.url ?? activeCustomProfile.url).trim(),
      apiKey: (patch.apiKey ?? activeCustomProfile.apiKey).trim(),
    } satisfies CustomLlmProfile;
  };

  useEffect(() => {
    if (isVisible) return;
    resetNewCustomProfileDraft();
  }, [isVisible]);

  const syncCustomSettingsFromProfiles = (
    nextProfilesInput: CustomLlmProfile[],
    requestedActiveProfileId?: string,
    requestedUserAddedProfileIds?: string[],
    extraPatch: Partial<AppSettings> = {}
  ) => {
    const nextProfiles = normalizeProfiles(nextProfilesInput);
    const nextActiveProfile =
      nextProfiles.find((profile) => profile.id === requestedActiveProfileId) ||
      nextProfiles.find((profile) => profile.id === activeCustomProfile.id) ||
      nextProfiles[0];
    const nextUserAddedProfileIds = uniqueValues(
      (requestedUserAddedProfileIds || settings.customUserAddedProfileIds || []).filter((id) =>
        nextProfiles.some((profile) => profile.id === id)
      )
    );
    const { knownModels, knownFamilies } = deriveModelListsFromProfiles(nextProfiles);
    const nextCustomFamily =
      splitCustomModelIdentifier(nextActiveProfile.model).family || 'custom';

    updateSettings({
      customLlmProfiles: nextProfiles,
      activeCustomLlmProfileId: nextActiveProfile.id,
      customLlmModel: nextActiveProfile.model,
      customLlmUrl: nextActiveProfile.url,
      customLlmApiKey: nextActiveProfile.apiKey,
      customKnownModels: knownModels,
      customKnownModelFamilies: knownFamilies.length > 0 ? knownFamilies : ['custom'],
      customLlmModelFamily: nextCustomFamily,
      customUserAddedProfileIds: nextUserAddedProfileIds,
      ...extraPatch,
    });
  };

  const persistNewCustomProfileDraft = (draft: NewCustomProfileDraft) => {
    const normalizedModel = draft.model.trim();
    const normalizedUrl = draft.url.trim();
    if (!normalizedModel || !normalizedUrl) return;

    const normalizedLabel =
      draft.label.trim() || profileLabelFromModel(normalizedModel, editableCustomProfiles.length);
    const profileId = nextUniqueProfileId(
      normalizedLabel || normalizedModel,
      new Set(customProfiles.map((profile) => profile.id))
    );
    const nextProfile: CustomLlmProfile = {
      id: profileId,
      label: normalizedLabel,
      model: normalizedModel,
      url: normalizedUrl,
      apiKey: draft.apiKey.trim(),
    };
    const nextUserAddedProfileIds = uniqueValues([
      ...(settings.customUserAddedProfileIds || []),
      profileId,
    ]);

    syncCustomSettingsFromProfiles(
      [...customProfiles, nextProfile],
      nextProfile.id,
      nextUserAddedProfileIds
    );
    resetNewCustomProfileDraft();
  };

  const setActiveCustomProfile = (profileId: string) => {
    if (isDefaultCustomProfileId(profileId)) {
      setIsNewCustomProfileDraftActive(true);
      setDuplicatedCustomProfileSource(null);
      if (!isNewCustomProfileDraftActive || duplicatedCustomProfileSource) {
        setNewCustomProfileDraft(EMPTY_NEW_CUSTOM_PROFILE_DRAFT);
      }
      return;
    }

    const nextActiveProfile = customProfiles.find((profile) => profile.id === profileId);
    if (!nextActiveProfile) return;

    resetNewCustomProfileDraft();
    syncCustomSettingsFromProfiles(customProfiles, nextActiveProfile.id);
  };

  const updateCustomProfile = (
    profileId: string,
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => {
    if (isDefaultCustomProfileId(profileId)) {
      const nextProfile = createCustomProfileFromPatch(patch);
      const nextUserAddedProfileIds = uniqueValues([
        ...(settings.customUserAddedProfileIds || []),
        nextProfile.id,
      ]);
      syncCustomSettingsFromProfiles(
        [...customProfiles, nextProfile],
        nextProfile.id,
        nextUserAddedProfileIds
      );
      return;
    }

    const nextProfiles = customProfiles.map((profile) => {
      if (profile.id !== profileId) return profile;
      return {
        ...profile,
        label: patch.label ?? profile.label,
        model: patch.model ?? profile.model,
        url: patch.url ?? profile.url,
        apiKey: patch.apiKey ?? profile.apiKey,
      };
    });

    syncCustomSettingsFromProfiles(nextProfiles, profileId);
  };

  const removeCustomProfile = (profileId: string) => {
    if (isDefaultCustomProfileId(profileId)) return;

    const remainingProfiles = customProfiles.filter((profile) => profile.id !== profileId);
    const remainingEditableProfiles = listEditableCustomProfiles(remainingProfiles);
    const nextUserAddedProfileIds = (settings.customUserAddedProfileIds || []).filter(
      (id) => id !== profileId
    );
    const fallbackActiveProfileId =
      settings.activeCustomLlmProfileId === profileId
        ? remainingEditableProfiles[0]?.id || remainingProfiles[0]?.id
        : settings.activeCustomLlmProfileId;
    const extraPatch =
      remainingEditableProfiles.length === 0 && settings.llmProvider === 'custom'
        ? { llmProvider: 'claude' as const }
        : {};

    syncCustomSettingsFromProfiles(
      remainingProfiles,
      fallbackActiveProfileId,
      nextUserAddedProfileIds,
      extraPatch
    );
  };

  const updateNewCustomProfileDraft = (
    patch: Partial<Pick<NewCustomProfileDraft, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => {
    const nextDraft = {
      ...newCustomProfileDraft,
      ...patch,
    };
    const duplicateSource = duplicatedCustomProfileSource;
    const shouldPersistDuplicateDraft = duplicateSource
      ? hasDraftChangedFromSource(nextDraft, duplicateSource) &&
        Boolean(nextDraft.model.trim()) &&
        Boolean(nextDraft.url.trim())
      : false;

    if (shouldPersistDuplicateDraft) {
      persistNewCustomProfileDraft(nextDraft);
      return;
    }

    setIsNewCustomProfileDraftActive(true);
    setNewCustomProfileDraft(nextDraft);
  };

  const addCustomProfile = () => {
    persistNewCustomProfileDraft(newCustomProfileDraft);
  };

  const duplicateCustomProfile = (profileId: string) => {
    const sourceProfile = editableCustomProfiles.find((profile) => profile.id === profileId);
    if (!sourceProfile) return;

    setNewCustomProfileDraft({
      label: sourceProfile.label,
      model: sourceProfile.model,
      url: sourceProfile.url,
      apiKey: sourceProfile.apiKey,
    });
    setDuplicatedCustomProfileSource(sourceProfile);
    setIsNewCustomProfileDraftActive(true);
  };

  return {
    activeCustomProfile,
    addCustomProfile,
    canAddCustomProfile,
    customProfiles,
    discardNewCustomProfileDraft: resetNewCustomProfileDraft,
    duplicateCustomProfile,
    duplicatedCustomProfileLabel:
      duplicatedCustomProfileSource?.label || duplicatedCustomProfileSource?.model || '',
    editableCustomProfiles,
    isDefaultActiveCustomProfile,
    isDuplicatingCustomProfileDraft: Boolean(duplicatedCustomProfileSource),
    isNewCustomProfileDraftActive,
    newCustomProfileDraft,
    removeCustomProfile,
    setActiveCustomProfile,
    updateCustomProfile,
    updateNewCustomProfileDraft,
  };
}
