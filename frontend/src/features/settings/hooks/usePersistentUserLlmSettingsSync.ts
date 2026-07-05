import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { getAuthChangedEventName, getAuthSessionKey, loadAuthSession } from '@/auth/session';
import {
  fetchMyLlmConfig,
  fetchMyLlmSecrets,
  saveMyLlmConfig,
  saveMyLlmSecrets,
  type MyLlmConfigResponse,
  type MyLlmSecretsResponse,
} from '@/api/client';
import {
  normalizeProfiles,
  resolveActiveCustomProfile,
} from '@/features/settings/utils/customProfiles';
import {
  buildMyLlmConfigPayload,
  buildMyLlmSecretsPayload,
  buildPatchFromMyLlmConfig,
  buildPatchFromMyLlmSecrets,
} from '@/features/settings/utils/settingsRuntimePayloads';
import type { AppSettings } from '@/types';

interface UsePersistentUserLlmSettingsSyncProps {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

interface SyncRefs {
  settingsRef: MutableRefObject<AppSettings>;
  runtimeModelConfigurableRef: MutableRefObject<boolean>;
  lastConfigSignatureRef: MutableRefObject<string>;
  lastSecretsSignatureRef: MutableRefObject<string>;
}

function sessionIdentity(): string {
  const session = loadAuthSession();
  return session?.accessToken ? `${session.user.id}:${session.refreshToken}` : '';
}

function useAuthIdentity(): string {
  const [authIdentity, setAuthIdentity] = useState(() => sessionIdentity());
  useEffect(() => {
    const syncIdentity = () => setAuthIdentity(sessionIdentity());
    const storageHandler = (event: StorageEvent) => {
      if (event.key === getAuthSessionKey()) syncIdentity();
    };
    window.addEventListener(getAuthChangedEventName(), syncIdentity);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener(getAuthChangedEventName(), syncIdentity);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);
  return authIdentity;
}

function buildSyncPayloads(settings: AppSettings, runtimeModelConfigurable: boolean) {
  const normalizedProfiles = normalizeProfiles(settings.customLlmProfiles || []);
  const activeCustomProfile = resolveActiveCustomProfile(
    normalizedProfiles,
    settings.activeCustomLlmProfileId,
    settings.customLlmModel
  );
  return {
    config: buildMyLlmConfigPayload(
      settings,
      normalizedProfiles,
      activeCustomProfile,
      runtimeModelConfigurable
    ),
    secrets: buildMyLlmSecretsPayload(settings, normalizedProfiles, activeCustomProfile),
  };
}

function payloadSignatures(settings: AppSettings, runtimeModelConfigurable: boolean) {
  const payloads = buildSyncPayloads(settings, runtimeModelConfigurable);
  return {
    config: JSON.stringify(payloads.config),
    secrets: JSON.stringify(payloads.secrets),
  };
}

function mergeFetchedSettings(
  settings: AppSettings,
  config: MyLlmConfigResponse,
  secrets: MyLlmSecretsResponse
) {
  let nextSettings = settings;
  let patch: Partial<AppSettings> = {};
  const configPatch = buildPatchFromMyLlmConfig(nextSettings, secrets, config);
  if (configPatch) {
    patch = { ...patch, ...configPatch };
    nextSettings = { ...nextSettings, ...configPatch };
  }
  const secretsPatch = buildPatchFromMyLlmSecrets(nextSettings, secrets);
  if (secretsPatch) {
    patch = { ...patch, ...secretsPatch };
    nextSettings = { ...nextSettings, ...secretsPatch };
  }
  return { nextSettings, patch };
}

function resetSyncRefs(refs: SyncRefs) {
  refs.lastConfigSignatureRef.current = '';
  refs.lastSecretsSignatureRef.current = '';
}

function markPersistedSignatures(refs: SyncRefs, settings: AppSettings) {
  const signatures = payloadSignatures(settings, refs.runtimeModelConfigurableRef.current);
  refs.lastConfigSignatureRef.current = signatures.config;
  refs.lastSecretsSignatureRef.current = signatures.secrets;
}

function useHydrateDbSettings(
  authIdentity: string,
  refs: SyncRefs,
  updateSettings: (patch: Partial<AppSettings>) => void,
  setIsDbHydrated: (value: boolean) => void
) {
  useEffect(() => {
    if (!authIdentity) {
      setIsDbHydrated(false);
      resetSyncRefs(refs);
      return;
    }
    let cancelled = false;
    setIsDbHydrated(false);
    Promise.all([fetchMyLlmConfig(), fetchMyLlmSecrets()])
      .then(([config, secrets]) => {
        if (cancelled) return;
        refs.runtimeModelConfigurableRef.current = config.runtimeModelConfigurable !== false;
        const { nextSettings, patch } = mergeFetchedSettings(refs.settingsRef.current, config, secrets);
        markPersistedSignatures(refs, nextSettings);
        if (Object.keys(patch).length > 0) updateSettings(patch);
        setIsDbHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setIsDbHydrated(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authIdentity, refs, setIsDbHydrated, updateSettings]);
}

async function saveChangedPayloads(
  refs: SyncRefs,
  shouldSaveConfig: boolean,
  shouldSaveSecrets: boolean
) {
  try {
    const payloads = buildSyncPayloads(
      refs.settingsRef.current,
      refs.runtimeModelConfigurableRef.current
    );
    if (shouldSaveConfig) {
      const result = await saveMyLlmConfig(payloads.config);
      refs.runtimeModelConfigurableRef.current = result.runtimeModelConfigurable !== false;
    }
    if (shouldSaveSecrets) {
      await saveMyLlmSecrets(payloads.secrets);
    }
    markPersistedSignatures(refs, refs.settingsRef.current);
  } catch {
    // Keep the previous signatures so a later settings change retries DB persistence.
  }
}

function usePersistDbSettings(
  authIdentity: string,
  isDbHydrated: boolean,
  refs: SyncRefs,
  settings: AppSettings
) {
  const persistDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!authIdentity || !isDbHydrated) return;
    const signatures = payloadSignatures(
      refs.settingsRef.current,
      refs.runtimeModelConfigurableRef.current
    );
    const shouldSaveConfig = signatures.config !== refs.lastConfigSignatureRef.current;
    const shouldSaveSecrets = signatures.secrets !== refs.lastSecretsSignatureRef.current;
    if (!shouldSaveConfig && !shouldSaveSecrets) return;
    if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    persistDebounceRef.current = setTimeout(() => {
      void saveChangedPayloads(refs, shouldSaveConfig, shouldSaveSecrets);
    }, 800);
    return () => {
      if (persistDebounceRef.current) clearTimeout(persistDebounceRef.current);
    };
  }, [authIdentity, isDbHydrated, refs, settings]);
}

export function usePersistentUserLlmSettingsSync({
  settings,
  updateSettings,
}: UsePersistentUserLlmSettingsSyncProps) {
  const authIdentity = useAuthIdentity();
  const [isDbHydrated, setIsDbHydrated] = useState(false);
  const settingsRef = useRef(settings);
  const runtimeModelConfigurableRef = useRef(true);
  const lastConfigSignatureRef = useRef('');
  const lastSecretsSignatureRef = useRef('');
  const refs: SyncRefs = useMemo(
    () => ({
      settingsRef,
      runtimeModelConfigurableRef,
      lastConfigSignatureRef,
      lastSecretsSignatureRef,
    }),
    []
  );

  useEffect(() => {
    refs.settingsRef.current = settings;
  }, [refs.settingsRef, settings]);
  useHydrateDbSettings(authIdentity, refs, updateSettings, setIsDbHydrated);
  usePersistDbSettings(authIdentity, isDbHydrated, refs, settings);
}
