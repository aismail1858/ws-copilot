import { Field, selectCls } from '@/features/settings/components/SettingsFields';
import { ModelSelector } from '@/features/settings/components/SettingsFields';
import type { LLMProvider } from '@/types';
import type { AppSettings } from '@/types';

interface SettingsTitleSectionProps {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

function TitleProviderField({ settings, updateSettings }: SettingsTitleSectionProps) {
  return (
    <Field
      label="Titel-Generator Provider"
      description="LLM-Provider für die Chat-Titel-Generierung (meist ein schnelles Modell)"
    >
      <select
        value={settings.titleLlmProvider}
        onChange={(e) => updateSettings({ titleLlmProvider: e.target.value as LLMProvider })}
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

function TitleModelField({ settings, updateSettings }: SettingsTitleSectionProps) {
  const provider = settings.titleLlmProvider;

  if (provider === 'claude') {
    return (
      <Field
        label="Titel-Generator Modell"
        description="Claude-Modell für Titel-Generierungen"
      >
        <ModelSelector
          value={settings.anthropicTitleModel || settings.anthropicModel}
          models={settings.anthropicKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ anthropicTitleModel: model, anthropicKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'openai') {
    return (
      <Field
        label="Titel-Generator Modell"
        description="OpenAI-Modell für Titel-Generierungen"
      >
        <ModelSelector
          value={settings.openaiTitleModel || settings.openaiModel}
          models={settings.openaiKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ openaiTitleModel: model, openaiKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'gemini') {
    return (
      <Field
        label="Titel-Generator Modell"
        description="Gemini-Modell für Titel-Generierungen"
      >
        <ModelSelector
          value={settings.googleTitleModel || settings.googleModel}
          models={settings.googleKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ googleTitleModel: model, googleKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'ollama') {
    return (
      <Field
        label="Titel-Generator Modell"
        description="Ollama-Modell für Titel-Generierungen"
      >
        <ModelSelector
          value={settings.ollamaTitleModel || settings.ollamaModel || 'llama3'}
          models={settings.ollamaKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ ollamaTitleModel: model, ollamaKnownModels: list })
          }
        />
      </Field>
    );
  }

  if (provider === 'custom') {
    return (
      <Field
        label="Titel-Generator Modell"
        description="Custom-Modell für Titel-Generierungen"
      >
        <ModelSelector
          value={settings.customTitleModel || settings.customLlmModel || 'custom'}
          models={settings.customKnownModels || []}
          onChange={(model, list) =>
            updateSettings({ customTitleModel: model, customKnownModels: list })
          }
        />
      </Field>
    );
  }

  return null;
}

export default function SettingsTitleSection(props: SettingsTitleSectionProps) {
  return (
    <>
      <TitleProviderField {...props} />
      <TitleModelField {...props} />
    </>
  );
}
