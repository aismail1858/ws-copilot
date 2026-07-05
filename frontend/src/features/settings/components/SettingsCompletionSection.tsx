import { Field, selectCls } from '@/features/settings/components/SettingsFields';
import { ModelSelector } from '@/features/settings/components/SettingsFields';
import type { LLMProvider } from '@/types';
import type { AppSettings } from '@/types';

interface SettingsCompletionSectionProps {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

function CompletionProviderField({ settings, updateSettings }: SettingsCompletionSectionProps) {
  return (
    <Field
      label="Autocompletion Provider"
      description="LLM-Provider für Inline-Vervollständigung (meist ein schnelles Modell)"
    >
      <select
        value={settings.completionLlmProvider}
        onChange={(e) => updateSettings({ completionLlmProvider: e.target.value as LLMProvider })}
        className={selectCls}
      >
        <option value="claude">Claude</option>
        <option value="openai">OpenAI</option>
        <option value="gemini">Gemini</option>
        <option value="ollama">Ollama</option>
        <option value="custom">Custom</option>
      </select>
    </Field>
  );
}

function CompletionModelField({ settings, updateSettings }: SettingsCompletionSectionProps) {
  const provider = settings.completionLlmProvider;

  if (provider === 'claude') {
    return (
      <Field
        label="Autocompletion Modell"
        description="Claude-Modell für schnelle Vervollständigungen"
      >
        <ModelSelector
          value={settings.anthropicCompletionModel || settings.anthropicModel}
          models={settings.anthropicKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ anthropicCompletionModel: model, anthropicKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'openai') {
    return (
      <Field
        label="Autocompletion Modell"
        description="OpenAI-Modell für schnelle Vervollständigungen"
      >
        <ModelSelector
          value={settings.openaiCompletionModel || settings.openaiModel}
          models={settings.openaiKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ openaiCompletionModel: model, openaiKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'gemini') {
    return (
      <Field
        label="Autocompletion Modell"
        description="Gemini-Modell für schnelle Vervollständigungen"
      >
        <ModelSelector
          value={settings.googleCompletionModel || settings.googleModel}
          models={settings.googleKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ googleCompletionModel: model, googleKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'ollama') {
    return (
      <Field
        label="Autocompletion Modell"
        description="Ollama-Modell für schnelle Vervollständigungen"
      >
        <ModelSelector
          value={settings.ollamaCompletionModel || settings.ollamaModel || 'llama3'}
          models={settings.ollamaKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ ollamaCompletionModel: model, ollamaKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'custom') {
    return (
      <Field
        label="Autocompletion Modell"
        description="Custom-Modell für schnelle Vervollständigungen"
      >
        <ModelSelector
          value={settings.customCompletionModel || settings.customLlmModel || 'custom'}
          models={settings.customKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ customCompletionModel: model, customKnownModels: list })
          }
        />
      </Field>
    );
  }

  return null;
}

export default function SettingsCompletionSection(props: SettingsCompletionSectionProps) {
  return (
    <>
      <CompletionProviderField {...props} />
      <CompletionModelField {...props} />
    </>
  );
}
