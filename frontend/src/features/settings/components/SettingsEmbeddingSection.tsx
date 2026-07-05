import type { BackendConfigResponse, MyLlmSecretsResponse } from '@/api/client';
import {
  Field,
  inputCls,
  ModelSelector,
  SecretInput,
} from '@/features/settings/components/SettingsFields';
import type { AppSettings, EmbeddingProvider } from '@/types';

interface SettingsEmbeddingSectionProps {
  settings: AppSettings;
  backendConfig: BackendConfigResponse | null;
  myLlmSecrets: MyLlmSecretsResponse | null;
  updateSettings: (patch: Partial<AppSettings>) => void;
}

export default function SettingsEmbeddingSection({
  settings,
  backendConfig,
  myLlmSecrets,
  updateSettings,
}: SettingsEmbeddingSectionProps) {
  return (
    <div className="ci-panel rounded-xl p-5 space-y-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-[#2f2b26]">Embeddings</p>
      </div>

      <Field label="Provider" description="Wähle den Embedding-Provider">
        <select
          value={settings.embeddingProvider}
          onChange={(e) =>
            updateSettings({ embeddingProvider: e.target.value as EmbeddingProvider })
          }
          className={inputCls}
        >
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="ollama">Ollama (lokal)</option>
          <option value="custom">Custom / OpenAI-kompatibel</option>
        </select>
      </Field>

      {settings.embeddingProvider === 'gemini' && (
        <Field label="Modell" description="Wählen, Hinzufügen oder Löschen">
          <ModelSelector
            value={settings.googleEmbeddingModel}
            models={settings.googleEmbeddingKnownModels}
            onChange={(model, list) =>
              updateSettings({
                googleEmbeddingModel: model,
                googleEmbeddingKnownModels: list,
              })
            }
          />
        </Field>
      )}

      {settings.embeddingProvider === 'openai' && (
        <Field label="Modell" description="Nur 1536-kompatible Modelle. Wählen, Hinzufügen oder Löschen">
          <ModelSelector
            value={settings.openaiEmbeddingModel}
            models={settings.openaiEmbeddingKnownModels}
            onChange={(model, list) =>
              updateSettings({
                openaiEmbeddingModel: model,
                openaiEmbeddingKnownModels: list,
              })
            }
          />
        </Field>
      )}

      {settings.embeddingProvider === 'ollama' && (
        <>
          <Field label="Ollama URL" description="Basis-URL des Ollama-Servers">
            <input
              type="url"
              value={settings.ollamaUrl}
              onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
              className={inputCls}
              placeholder="http://localhost:11434"
            />
          </Field>
          <Field label="Modell" description="Wählen, Hinzufügen oder Löschen">
            <ModelSelector
              value={settings.ollamaEmbeddingModel}
              models={settings.ollamaEmbeddingKnownModels}
              onChange={(model, list) =>
                updateSettings({
                  ollamaEmbeddingModel: model,
                  ollamaEmbeddingKnownModels: list,
                })
              }
            />
          </Field>
          <Field
            label="API Key / Bearer Token"
            description="Optional - nur nötig wenn Ollama hinter einem Auth-Proxy läuft"
            badge={myLlmSecrets?.ollamaApiKeySet}
          >
            <SecretInput
              value={settings.ollamaApiKey}
              onChange={(value) => updateSettings({ ollamaApiKey: value })}
              placeholder="Leer lassen wenn nicht benötigt"
            />
          </Field>
        </>
      )}

      {settings.embeddingProvider === 'custom' && (
        <>
          <Field label="Endpoint URL" description="Basis-URL des OpenAI-kompatiblen Embedding-Servers">
            <input
              type="url"
              value={settings.customEmbeddingUrl}
              onChange={(e) => updateSettings({ customEmbeddingUrl: e.target.value })}
              className={inputCls}
              placeholder="http://localhost:11434/v1"
            />
          </Field>
          <Field label="Modell" description="Wählen, Hinzufügen oder Löschen">
            <ModelSelector
              value={settings.customEmbeddingModel}
              models={settings.customEmbeddingKnownModels}
              onChange={(model, list) =>
                updateSettings({
                  customEmbeddingModel: model,
                  customEmbeddingKnownModels: list,
                })
              }
            />
          </Field>
          <Field
            label="API Key / Bearer Token"
            description="Optional - für lokale Ollama oft nicht nötig"
            badge={backendConfig?.customEmbeddingApiKeySet}
          >
            <SecretInput
              value={settings.customEmbeddingApiKey}
              onChange={(value) => updateSettings({ customEmbeddingApiKey: value })}
              placeholder="Leer lassen wenn nicht benötigt"
            />
          </Field>
        </>
      )}
    </div>
  );
}
