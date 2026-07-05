import { useEffect, useRef, useState } from 'react';
import {
  fetchBackendConfig,
  fetchMyLlmConfig,
  fetchMyLlmSecrets,
  fetchMyOllamaModels,
  pushConfigToBackend,
  saveMyLlmConfig,
  saveMyLlmSecrets,
  type BackendConfigResponse,
  type MyLlmConfigResponse,
  type MyLlmSecretsResponse,
} from '@/api/client';
import type { SyncStatus } from '@/features/settings/types';
import {
  normalizeProfiles,
  resolveActiveCustomProfile,
} from '@/features/settings/utils/customProfiles';
import {
  buildBackendConfigPayload,
  buildPatchFromBackendConfig,
  buildMyLlmConfigPayload,
  buildMyLlmSecretsPayload,
  buildPatchFromMyLlmConfig,
  buildPatchFromMyLlmSecrets,
} from '@/features/settings/utils/settingsRuntimePayloads';
import {
  buildBackendConfigSignature,
  buildMyLlmConfigSignature,
  buildMyLlmSecretsSignature,
} from '@/features/settings/utils/settingsRuntimeSyncSignatures';
import { defaultSettings } from '@/utils/settingsDefaults';
import type { AppSettings } from '@/types';

interface UseSettingsRuntimeSyncProps {
  isVisible: boolean;
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  user: { role?: string } | null | undefined;
}

export function useSettingsRuntimeSync({
  isVisible,
  settings,
  updateSettings,
  user,
}: UseSettingsRuntimeSyncProps) {
  const [backendConfig, setBackendConfig] = useState<BackendConfigResponse | null>(null);
  const [myLlmConfig, setMyLlmConfig] = useState<MyLlmConfigResponse | null>(null);
  const [myLlmConfigLoaded, setMyLlmConfigLoaded] = useState(false);
  const [myLlmSecrets, setMyLlmSecrets] = useState<MyLlmSecretsResponse | null>(null);
  const [myLlmSecretsLoaded, setMyLlmSecretsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncError, setSyncError] = useState('');
  const backendDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modelConfigDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const secretsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef = useRef(settings);
  const myLlmSecretsRef = useRef<MyLlmSecretsResponse | null>(null);
  const hydratedBackendSignatureRef = useRef('');
  const hydratedMyLlmConfigSignatureRef = useRef('');
  const hydratedMyLlmSecretsSignatureRef = useRef('');
  const persistToEnv = false;

  const syncDiscoveredOllamaModels = (models: string[]) => {
    const discovered = Array.from(new Set(models.map((value) => value.trim()).filter(Boolean)));
    if (discovered.length === 0) return;

    const current = settingsRef.current;
    // Replace the known models list with live-discovered models,
    // preserving the currently selected model if it still exists in Ollama.
    const selectedModel = (current.ollamaModel || '').trim();
    const updatedKnownModels = Array.from(
      new Set([
        ...discovered,
        // Keep selected model even if not discovered (user may have manually typed it)
        ...(selectedModel && !discovered.includes(selectedModel) ? [selectedModel] : []),
      ].filter(Boolean))
    );
    // If selected model no longer exists in Ollama and was a default, switch to first discovered
    const shouldReplaceDefaultModel =
      !discovered.includes(selectedModel) &&
      (!selectedModel || selectedModel === defaultSettings.ollamaModel);
    const nextModel = shouldReplaceDefaultModel ? discovered[0] : selectedModel;
    const sameKnownModels =
      updatedKnownModels.length === (current.ollamaKnownModels || []).length &&
      updatedKnownModels.every((value, index) => value === (current.ollamaKnownModels || [])[index]);

    if (sameKnownModels && nextModel === current.ollamaModel) {
      return;
    }

    updateSettings({
      ollamaKnownModels: updatedKnownModels,
      ...(nextModel ? { ollamaModel: nextModel } : {}),
    });
  };

  const syncDiscoveredOllamaRerankerModels = (models: string[]) => {
    const discovered = Array.from(new Set(models.map((value) => value.trim()).filter(Boolean)));
    if (discovered.length === 0) return;

    const current = settingsRef.current;
    const mergedKnownModels = Array.from(
      new Set([current.rerankerModel, ...(current.rerankerKnownModels || []), ...discovered].filter(Boolean))
    );
    const shouldReplaceDefaultModel =
      current.rerankerProvider === 'custom' &&
      !discovered.includes(current.rerankerModel) &&
      (!current.rerankerModel || current.rerankerModel === defaultSettings.rerankerModel);
    const nextModel = shouldReplaceDefaultModel ? discovered[0] : current.rerankerModel;
    const sameKnownModels =
      mergedKnownModels.length === (current.rerankerKnownModels || []).length &&
      mergedKnownModels.every((value, index) => value === (current.rerankerKnownModels || [])[index]);

    if (sameKnownModels && nextModel === current.rerankerModel) {
      return;
    }

    updateSettings({
      rerankerKnownModels: mergedKnownModels,
      ...(nextModel ? { rerankerModel: nextModel } : {}),
    });
  };

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    myLlmSecretsRef.current = myLlmSecrets;
  }, [myLlmSecrets]);

  useEffect(() => {
    if (isVisible) return;
    setMyLlmConfigLoaded(false);
    setMyLlmSecretsLoaded(false);
    hydratedBackendSignatureRef.current = '';
    hydratedMyLlmConfigSignatureRef.current = '';
    hydratedMyLlmSecretsSignatureRef.current = '';
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    if (!user) {
      setMyLlmConfig(null);
      setMyLlmConfigLoaded(false);
      return;
    }

    fetchMyLlmConfig()
      .then((config) => {
        const patch = buildPatchFromMyLlmConfig(
          settingsRef.current,
          myLlmSecretsRef.current,
          config
        );
        setMyLlmConfig(config);
        if (patch) updateSettings(patch);
      })
      .finally(() => {
        setMyLlmConfigLoaded(true);
      });
  }, [isVisible, updateSettings, user]);

  useEffect(() => {
    if (!isVisible) return;
    if (!user) {
      setMyLlmSecrets(null);
      setMyLlmSecretsLoaded(false);
      return;
    }

    fetchMyLlmSecrets()
      .then((secrets) => {
        const patch = buildPatchFromMyLlmSecrets(settingsRef.current, secrets);
        setMyLlmSecrets(secrets);
        myLlmSecretsRef.current = secrets;
        if (patch) updateSettings(patch);
      })
      .finally(() => {
        setMyLlmSecretsLoaded(true);
      });
  }, [isVisible, updateSettings, user]);

  useEffect(() => {
    if (!isVisible || !user) return;

    fetchMyOllamaModels()
      .then((response) => {
        if (!response.reachable) return;
        syncDiscoveredOllamaModels(response.models);
        syncDiscoveredOllamaRerankerModels(response.rerankerModels || []);
      })
      .catch(() => undefined);
  }, [isVisible, user, settings.ollamaUrl, settings.ollamaApiKey]);

  useEffect(() => {
    if (!isVisible) return;
    if (user?.role !== 'admin') {
      setBackendConfig(null);
      return;
    }

    fetchBackendConfig()
      .then((config) => {
        const patch = buildPatchFromBackendConfig(settingsRef.current, config);
        setBackendConfig(config);
        if (patch) updateSettings(patch);
      })
      .catch(() => setBackendConfig(null));
  }, [isVisible, updateSettings, user?.role]);

  useEffect(() => {
    if (!isVisible || !user) return;
    if (!myLlmConfig || !myLlmSecrets) return;
    if (!myLlmConfigLoaded || !myLlmSecretsLoaded) return;
    if (
      hydratedMyLlmConfigSignatureRef.current &&
      hydratedMyLlmSecretsSignatureRef.current
    ) {
      return;
    }

    let nextSettings = settingsRef.current;
    const configPatch = buildPatchFromMyLlmConfig(nextSettings, myLlmSecrets, myLlmConfig);
    if (configPatch) {
      nextSettings = { ...nextSettings, ...configPatch };
    }
    const secretsPatch = buildPatchFromMyLlmSecrets(nextSettings, myLlmSecrets);
    if (secretsPatch) {
      nextSettings = { ...nextSettings, ...secretsPatch };
    }

    hydratedMyLlmConfigSignatureRef.current = buildMyLlmConfigSignature(
      nextSettings,
      myLlmConfig.runtimeModelConfigurable !== false
    );
    hydratedMyLlmSecretsSignatureRef.current = buildMyLlmSecretsSignature(nextSettings);
  }, [
    isVisible,
    myLlmConfig,
    myLlmConfigLoaded,
    myLlmSecrets,
    myLlmSecretsLoaded,
    user,
  ]);

  useEffect(() => {
    if (!isVisible || user?.role !== 'admin') return;
    if (!backendConfig) return;
    if (hydratedBackendSignatureRef.current) return;

    const patch = buildPatchFromBackendConfig(settingsRef.current, backendConfig);
    const nextSettings = patch ? { ...settingsRef.current, ...patch } : settingsRef.current;
    hydratedBackendSignatureRef.current = buildBackendConfigSignature(
      nextSettings,
      backendConfig.runtimeModelConfigurable
    );
  }, [backendConfig, isVisible, user?.role]);

  useEffect(() => {
    if (!isVisible || !user) return;
    if (!myLlmSecretsLoaded) return;
    if (!hydratedMyLlmSecretsSignatureRef.current) return;
    if (secretsDebounceRef.current) clearTimeout(secretsDebounceRef.current);

    const currentSignature = buildMyLlmSecretsSignature(settings);
    if (currentSignature === hydratedMyLlmSecretsSignatureRef.current) {
      return;
    }

    setSyncStatus('pending');
    secretsDebounceRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      setSyncError('');
      try {
        const normalizedProfiles = normalizeProfiles(settings.customLlmProfiles || []);
        const activeCustomProfile = resolveActiveCustomProfile(
          normalizedProfiles,
          settings.activeCustomLlmProfileId,
          settings.customLlmModel
        );
        const result = await saveMyLlmSecrets(
          buildMyLlmSecretsPayload(settings, normalizedProfiles, activeCustomProfile)
        );
        setMyLlmSecrets(result);
        hydratedMyLlmSecretsSignatureRef.current = currentSignature;
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    }, 800);

    return () => {
      if (secretsDebounceRef.current) clearTimeout(secretsDebounceRef.current);
    };
  }, [
    isVisible,
    myLlmSecretsLoaded,
    settings.anthropicApiKey,
    settings.openaiApiKey,
    settings.googleApiKey,
    settings.ollamaApiKey,
    settings.customLlmProfiles,
    settings.activeCustomLlmProfileId,
    settings.customLlmModel,
    user,
  ]);

  useEffect(() => {
    if (!isVisible || !user) return;
    if (!myLlmConfig || !myLlmConfigLoaded || !myLlmSecretsLoaded) return;
    if (!hydratedMyLlmConfigSignatureRef.current) return;
    if (modelConfigDebounceRef.current) clearTimeout(modelConfigDebounceRef.current);

    const currentSignature = buildMyLlmConfigSignature(
      settings,
      myLlmConfig.runtimeModelConfigurable !== false
    );
    if (currentSignature === hydratedMyLlmConfigSignatureRef.current) {
      return;
    }

    setSyncStatus('pending');
    modelConfigDebounceRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      setSyncError('');
      try {
        const normalizedProfiles = normalizeProfiles(settings.customLlmProfiles || []);
        const activeCustomProfile = resolveActiveCustomProfile(
          normalizedProfiles,
          settings.activeCustomLlmProfileId,
          settings.customLlmModel
        );
        const result = await saveMyLlmConfig(
          buildMyLlmConfigPayload(
            settings,
            normalizedProfiles,
            activeCustomProfile,
            myLlmConfig?.runtimeModelConfigurable !== false
          )
        );
        setMyLlmConfig(result);
        hydratedMyLlmConfigSignatureRef.current = currentSignature;
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    }, 800);

    return () => {
      if (modelConfigDebounceRef.current) clearTimeout(modelConfigDebounceRef.current);
    };
  }, [
    isVisible,
    myLlmConfigLoaded,
    myLlmConfig?.runtimeModelConfigurable,
    settings.llmProvider,
    settings.completionLlmProvider,
    settings.allowModelKnowledgeFallback,
    settings.systemPromptAddition,
    settings.temperature,
    settings.anthropicModel,
    settings.anthropicKnownModels,
    settings.anthropicCompletionModel,
    settings.openaiModel,
    settings.openaiKnownModels,
    settings.openaiCompletionModel,
    settings.googleModel,
    settings.googleKnownModels,
    settings.googleCompletionModel,
    settings.googleTitleModel,
    settings.ollamaModel,
    settings.ollamaKnownModels,
    settings.ollamaUrl,
    settings.ollamaCompletionModel,
    settings.ollamaTitleModel,
    settings.customLlmModel,
    settings.customKnownModels,
    settings.customCompletionModel,
    settings.customTitleModel,
    settings.customLlmProfiles,
    settings.activeCustomLlmProfileId,
    user,
  ]);

  useEffect(() => {
    if (!isVisible || user?.role !== 'admin') return;
    if (!backendConfig) return;
    if (!hydratedBackendSignatureRef.current) return;
    if (backendDebounceRef.current) clearTimeout(backendDebounceRef.current);

    const currentSignature = buildBackendConfigSignature(
      settings,
      backendConfig.runtimeModelConfigurable
    );
    if (currentSignature === hydratedBackendSignatureRef.current) {
      return;
    }

    setSyncStatus('pending');
    backendDebounceRef.current = setTimeout(async () => {
      setSyncStatus('syncing');
      setSyncError('');
      try {
        const result = await pushConfigToBackend(
          buildBackendConfigPayload(settings, backendConfig.runtimeModelConfigurable),
          persistToEnv
        );
        setBackendConfig(result);
        hydratedBackendSignatureRef.current = currentSignature;
        setSyncStatus('synced');
      } catch (err) {
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : 'Unbekannter Fehler');
      }
    }, 800);

    return () => {
      if (backendDebounceRef.current) clearTimeout(backendDebounceRef.current);
    };
  }, [
    settings.embeddingProvider,
    settings.googleEmbeddingModel,
    settings.openaiEmbeddingModel,
    settings.openaiEmbeddingKnownModels,
    settings.customEmbeddingUrl,
    settings.customEmbeddingApiKey,
    settings.customEmbeddingModel,
    settings.customEmbeddingKnownModels,
    settings.ollamaEmbeddingModel,
    settings.ollamaEmbeddingKnownModels,
    settings.retrievalMinScore,
    settings.hybridLexicalStrategy,
    settings.hybridCandidatePoolSize,
    settings.hybridFusionRrfK,
    settings.hybridVectorWeight,
    settings.hybridLexicalWeight,
    settings.rerankerEnabled,
    settings.rerankerProvider,
    settings.rerankerModel,
    settings.rerankerUrl,
    settings.rerankerApiKey,
    settings.rerankerHttpHeadersTemplate,
    settings.rerankerHttpBodyTemplate,
    settings.rerankerHttpResponseResultsPath,
    settings.rerankerHttpResponseIndexField,
    settings.rerankerHttpResponseScoreField,
    settings.multiQueryEnabled,
    settings.multiQueryMinQueries,
    settings.multiQueryMaxQueries,
    settings.multiQueryRrfK,
    settings.multiQueryExpansionProvider,
    settings.multiQueryExpansionTemperature,
    settings.multiQueryFallbackOnError,
    settings.ingestionVisionSummaryEnabled,
    settings.ingestionVisionSummaryProvider,
    settings.ingestionVisionSummaryModel,
    settings.ingestionVisionSummaryTimeoutSeconds,
    settings.ingestionVisionSummaryMaxChars,
    settings.ingestionVisionSummaryHttpUrl,
    settings.ingestionVisionSummaryHttpApiKey,
    settings.ingestionVisionSummaryHttpHeadersTemplate,
    settings.ingestionVisionSummaryHttpBodyTemplate,
    settings.ingestionVisionSummaryHttpResponseTextPath,
    persistToEnv,
    isVisible,
    user?.role,
    backendConfig?.runtimeModelConfigurable,
  ]);

  return {
    backendConfig,
    myLlmSecrets,
    syncError,
    syncStatus,
  };
}
