import { useState } from 'react';
import { testLlmModel, type RuntimeLlmConfig } from '@/api/client';
import {
  inputCls,
  selectCls,
  settingsAccentButtonCls,
} from '@/features/settings/components/SettingsFields';
import {
  listEditableCustomProfiles,
  resolveActiveEditableCustomProfile,
} from '@/features/settings/utils/customProfiles';
import type { AppSettings, LLMProvider } from '@/types';

type ResultState = 'idle' | 'running' | 'success' | 'error';

interface ModelOption {
  value: string;
  label: string;
  model: string;
  endpoint?: string;
  config: RuntimeLlmConfig;
}

interface ProviderOption {
  provider: LLMProvider;
  label: string;
  models: ModelOption[];
  defaultValue: string;
}

interface TestResult {
  state: ResultState;
  providerLabel: string;
  modelLabel: string;
  message: string;
  preview: string;
  durationMs: number | null;
}

interface TestSelection {
  activeModel: ModelOption | null;
  activeProvider: ProviderOption | null;
  resolvedModelValue: string;
}

interface SettingsModelTestFormProps {
  prompt: string;
  providerOptions: ProviderOption[];
  activeProvider: ProviderOption;
  resolvedModelValue: string;
  isRunning: boolean;
  onPromptChange: (value: string) => void;
  onProviderChange: (provider: LLMProvider) => void;
  onModelChange: (value: string) => void;
  onTest: () => void;
}

interface ModelTestController {
  handleProviderChange: (provider: LLMProvider) => void;
  handleTest: () => Promise<void>;
  prompt: string;
  providerOptions: ProviderOption[];
  result: TestResult;
  selection: TestSelection;
  setPrompt: (value: string) => void;
  setSelectedModelValue: (value: string) => void;
}

const DEFAULT_PROMPT = 'Bitte antworte kurz mit OK.';
const IDLE_RESULT: TestResult = {
  state: 'idle',
  providerLabel: '',
  modelLabel: '',
  message: '',
  preview: '',
  durationMs: null,
};

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildProviderModels(
  models: string[],
  createConfig: (model: string) => RuntimeLlmConfig
): ModelOption[] {
  return uniqueStrings(models).map((model) => ({
    value: model,
    label: model,
    model,
    config: createConfig(model),
  }));
}

function buildCustomModels(settings: AppSettings): ModelOption[] {
  const profiles = listEditableCustomProfiles(settings.customLlmProfiles || []);
  if (profiles.length === 0) return [];

  return profiles.map((profile) => ({
    value: profile.id,
    label: profile.label.trim() ? `${profile.label} (${profile.model})` : profile.model,
    model: profile.model,
    endpoint: profile.url,
    config: {
      provider: 'custom',
      model: profile.model,
      customLlmUrl: profile.url,
      customLlmApiKey: profile.apiKey,
    },
  }));
}

function buildProviderOptions(settings: AppSettings): ProviderOption[] {
  const options: ProviderOption[] = [
    {
      provider: 'claude',
      label: 'Claude',
      models: buildProviderModels(
        [settings.anthropicModel, ...(settings.anthropicKnownModels || [])],
        (model) => ({ provider: 'claude', model, anthropicApiKey: settings.anthropicApiKey })
      ),
      defaultValue: settings.anthropicModel,
    },
    {
      provider: 'gemini',
      label: 'Gemini',
      models: buildProviderModels(
        [settings.googleModel, ...(settings.googleKnownModels || [])],
        (model) => ({ provider: 'gemini', model, googleApiKey: settings.googleApiKey })
      ),
      defaultValue: settings.googleModel,
    },
    {
      provider: 'openai',
      label: 'OpenAI',
      models: buildProviderModels(
        [settings.openaiModel, ...(settings.openaiKnownModels || [])],
        (model) => ({ provider: 'openai', model, openaiApiKey: settings.openaiApiKey })
      ),
      defaultValue: settings.openaiModel,
    },
    {
      provider: 'ollama',
      label: 'Ollama',
      models: buildProviderModels(
        [settings.ollamaModel, ...(settings.ollamaKnownModels || [])],
        (model) => ({
          provider: 'ollama',
          model,
          ollamaUrl: settings.ollamaUrl,
          ollamaApiKey: settings.ollamaApiKey,
        })
      ).map((option) => ({ ...option, endpoint: settings.ollamaUrl })),
      defaultValue: settings.ollamaModel,
    },
    {
      provider: 'custom',
      label: 'Custom',
      models: buildCustomModels(settings),
      defaultValue:
        resolveActiveEditableCustomProfile(
          settings.customLlmProfiles || [],
          settings.activeCustomLlmProfileId,
          settings.customLlmModel
        )?.id || '',
    },
  ];
  return options.filter((option) => option.models.length > 0);
}

function buildSelection(
  providerOptions: ProviderOption[],
  selectedProvider: LLMProvider,
  selectedModelValue: string
): TestSelection {
  const activeProvider = providerOptions.find((option) => option.provider === selectedProvider) || providerOptions[0] || null;
  const resolvedModelValue =
    activeProvider?.models.some((option) => option.value === selectedModelValue)
      ? selectedModelValue
      : activeProvider?.defaultValue || activeProvider?.models[0]?.value || '';
  const activeModel =
    activeProvider?.models.find((option) => option.value === resolvedModelValue) || activeProvider?.models[0] || null;
  return { activeProvider, activeModel, resolvedModelValue };
}

function resultTone(state: ResultState): string {
  if (state === 'success') return 'text-emerald-700 border-emerald-200 bg-emerald-50';
  if (state === 'error') return 'text-red-700 border-red-200 bg-red-50';
  if (state === 'running') return 'text-[#2f2b26] border-[#f3aa7f]/35 bg-[#fff1e8]';
  return 'text-[#756b62] border-[#2f2b26]/10 bg-white';
}

function buildPendingResult(providerLabel: string, modelLabel: string): TestResult {
  return {
    state: 'running',
    providerLabel,
    modelLabel,
    message: 'Teste Verbindung...',
    preview: '',
    durationMs: null,
  };
}

function buildCompletedResult(
  state: Extract<ResultState, 'success' | 'error'>,
  providerLabel: string,
  modelLabel: string,
  message: string,
  preview: string,
  durationMs: number | null
): TestResult {
  return { state, providerLabel, modelLabel, message, preview, durationMs };
}

function ResultPanel({ result }: { result: TestResult }) {
  if (result.state === 'idle') {
    return (
      <div className="rounded-lg border border-[#2f2b26]/10 bg-white px-3 py-2 text-xs text-[#756b62] shadow-sm">
        Noch kein Test ausgefuehrt.
      </div>
    );
  }

  return (
    <div className={`rounded-lg border px-3 py-2.5 text-xs ${resultTone(result.state)}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="font-medium">{result.message}</span>
        {result.durationMs !== null && (
          <span className="font-mono text-[11px] opacity-75">{result.durationMs}ms</span>
        )}
      </div>
      {result.providerLabel && result.modelLabel && (
        <p className="mt-1.5 text-[11px] text-zinc-300">
          <span className="opacity-60">Ziel:</span>{' '}
          <span className="font-mono">{result.providerLabel}</span>
          <span className="opacity-40 mx-1">/</span>
          <span className="font-mono">{result.modelLabel}</span>
        </p>
      )}
      {result.preview && (
        <p className="mt-1.5 text-[11px] text-zinc-300">
          <span className="opacity-60">Antwort:</span>{' '}
          <span className="font-mono">{result.preview}</span>
        </p>
      )}
    </div>
  );
}

function SettingsModelTestForm({
  prompt,
  providerOptions,
  activeProvider,
  resolvedModelValue,
  isRunning,
  onPromptChange,
  onProviderChange,
  onModelChange,
  onTest,
}: SettingsModelTestFormProps) {
  return (
    <div className="space-y-3">
      {/* Prompt - immer vollbreit */}
      <div className="space-y-1">
        <label className="text-xs font-medium text-[#2f2b26]">Kurzer Testprompt</label>
        <input
          type="text"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          className={inputCls}
          placeholder={DEFAULT_PROMPT}
        />
      </div>

      {/* Provider + Modell + Button - kompakt nebeneinander auf Desktop, gestapelt auf Mobile */}
      <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto] sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#2f2b26] sm:sr-only">Anbieter</label>
          <select
            value={activeProvider.provider}
            onChange={(event) => onProviderChange(event.target.value as LLMProvider)}
            className={selectCls}
          >
            {providerOptions.map((option) => (
              <option key={option.provider} value={option.provider}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-[#2f2b26] sm:sr-only">Modell</label>
          <select
            value={resolvedModelValue}
            onChange={(event) => onModelChange(event.target.value)}
            className={selectCls}
          >
            {activeProvider.models.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={onTest}
          className={`${settingsAccentButtonCls} sm:min-w-[100px]`}
          disabled={isRunning}
        >
          {isRunning ? 'Teste...' : 'Test starten'}
        </button>
      </div>
    </div>
  );
}

function useModelTestController(settings: AppSettings): ModelTestController {
  const providerOptions = buildProviderOptions(settings);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(settings.llmProvider);
  const [selectedModelValue, setSelectedModelValue] = useState('');
  const [result, setResult] = useState<TestResult>(IDLE_RESULT);
  const selection = buildSelection(providerOptions, selectedProvider, selectedModelValue);

  const handleProviderChange = (provider: LLMProvider) => {
    const nextProvider = providerOptions.find((option) => option.provider === provider) || providerOptions[0];
    setSelectedProvider(nextProvider?.provider || provider);
    setSelectedModelValue(nextProvider?.defaultValue || nextProvider?.models[0]?.value || '');
  };

  const handleTest = async () => {
    if (!selection.activeProvider || !selection.activeModel) return;
    setResult(buildPendingResult(selection.activeProvider.label, selection.activeModel.model));
    try {
      const response = await testLlmModel({ llmConfig: selection.activeModel.config, prompt });
      setResult(buildCompletedResult(
        response.ok ? 'success' : 'error',
        selection.activeProvider.label,
        selection.activeModel.model,
        response.message,
        response.responsePreview,
        response.durationMs
      ));
    } catch (error) {
      setResult(buildCompletedResult(
        'error',
        selection.activeProvider.label,
        selection.activeModel.model,
        error instanceof Error ? error.message : 'Modelltest fehlgeschlagen.',
        '',
        null
      ));
    }
  };

  return {
    handleProviderChange,
    handleTest,
    prompt,
    providerOptions,
    result,
    selection,
    setPrompt,
    setSelectedModelValue,
  };
}

export default function SettingsModelTestSection({ settings }: { settings: AppSettings }) {
  const controller = useModelTestController(settings);

  if (!controller.selection.activeProvider || !controller.selection.activeModel) {
    return null;
  }

  return (
    <section className="ci-panel rounded-xl p-3 sm:p-4 space-y-3">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-[#2f2b26]">Modelltest</p>
        <p className="text-xs text-zinc-400">
          Prompt eingeben, Anbieter/Modell wählen und testen.
        </p>
      </div>
      <SettingsModelTestForm
        prompt={controller.prompt}
        providerOptions={controller.providerOptions}
        activeProvider={controller.selection.activeProvider}
        resolvedModelValue={controller.selection.resolvedModelValue}
        isRunning={controller.result.state === 'running'}
        onPromptChange={controller.setPrompt}
        onProviderChange={controller.handleProviderChange}
        onModelChange={controller.setSelectedModelValue}
        onTest={() => void controller.handleTest()}
      />
      {controller.selection.activeModel.endpoint && (
        <p className="text-[11px] text-zinc-500 break-all">
          <span className="opacity-60">Endpoint:</span>{' '}
          <span className="font-mono">{controller.selection.activeModel.endpoint}</span>
        </p>
      )}
      <ResultPanel result={controller.result} />
    </section>
  );
}
