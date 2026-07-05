import {
  Field,
  inputCls,
  ModelSelector,
  SecretInput,
  selectCls,
} from '@/features/settings/components/SettingsFields';
import type { SettingsAdminRuntimeSectionProps } from './settingsAdminRuntimeShared';

function RerankerEnabledField({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <Field
      label="Reranker aktivieren"
      description="Optimiert die Ergebnisreihenfolge durch ein separates Reranker-Modell"
    >
      <label className="flex items-center gap-2 text-sm text-[#756b62]">
        <input
          type="checkbox"
          checked={settings.rerankerEnabled}
          onChange={(e) => updateSettings({ rerankerEnabled: e.target.checked })}
          className="rounded border-[#2f2b26]/20 accent-[#f3aa7f]"
        />
        Aktiviert
      </label>
    </Field>
  );
}

function RerankerProviderField({
  settings,
  updateSettings,
}: Pick<
  SettingsAdminRuntimeSectionProps,
  'settings' | 'updateSettings'
>) {
  return (
    <>
      <Field label="Reranker-Provider" description="Art des lokalen Reranker-Backends">
        <select
          value={settings.rerankerProvider}
          onChange={(e) =>
            updateSettings({
              rerankerProvider: e.target.value === 'cross_encoder' ? 'cross_encoder' : 'custom',
            })
          }
          className={selectCls}
        >
          <option value="cross_encoder">Lokaler Cross-Encoder</option>
          <option value="custom">Lokaler HTTP-Reranker</option>
        </select>
      </Field>
    </>
  );
}

function CrossEncoderSection({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <Field
      label="Cross-Encoder Modell"
      description="Lokaler sentence-transformers Cross-Encoder oder Modellpfad, z. B. BAAI/bge-reranker-v2-m3"
    >
      <ModelSelector
        value={settings.rerankerModel}
        models={settings.rerankerKnownModels}
        onChange={(model, list) =>
          updateSettings({ rerankerModel: model, rerankerKnownModels: list })
        }
      />
    </Field>
  );
}

function CustomRerankerUrlField({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <Field
      label="HTTP Endpoint URL"
      description="Vollständige URL des lokalen Reranker-HTTP-Dienstes (FastAPI, TEI, Infinity)"
    >
      <input
        type="url"
        value={settings.rerankerUrl}
        onChange={(e) => updateSettings({ rerankerUrl: e.target.value })}
        className={inputCls}
        placeholder="http://localhost:8090/rerank"
      />
    </Field>
  );
}

function CustomRerankerAuthField({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <Field
      label="API Key / Bearer Token"
      description="Optional - nur wenn der Dienst Auth erfordert"
    >
      <SecretInput
        value={settings.rerankerApiKey}
        onChange={(value) => updateSettings({ rerankerApiKey: value })}
        placeholder="Leer lassen wenn nicht benötigt"
      />
    </Field>
  );
}

function CustomRerankerTemplates({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <>
      <Field
        label="Headers Template (JSON)"
        description="JSON-Objekt für HTTP-Headers. Platzhalter: {'{{api_key}}'}"
      >
        <textarea
          rows={3}
          value={settings.rerankerHttpHeadersTemplate}
          onChange={(e) => updateSettings({ rerankerHttpHeadersTemplate: e.target.value })}
          className="w-full ci-input resize-y rounded-lg px-3 py-2 text-sm placeholder-[#756b62]/70"
          placeholder='{"Authorization":"Bearer {{api_key}}"}'
        />
      </Field>
      <Field
        label="Body Template (JSON)"
        description="JSON-Body mit Platzhaltern: {'{{query}}'}, {'{{documents}}'}, {'{{top_n}}'}, {'{{model}}'}, {'{{api_key}}'}"
      >
        <textarea
          rows={5}
          value={settings.rerankerHttpBodyTemplate}
          onChange={(e) => updateSettings({ rerankerHttpBodyTemplate: e.target.value })}
          className="w-full ci-input resize-y rounded-lg px-3 py-2 text-sm placeholder-[#756b62]/70"
          placeholder='{"query":"{{query}}","documents":"{{documents}}","top_n":"{{top_n}}","model":"{{model}}"}'
        />
      </Field>
    </>
  );
}

function CustomRerankerResponseFields({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <Field
      label="Response-Felder"
      description="Pfade im JSON-Response für Rankingscore und Dokumente"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Results Path</label>
          <input
            type="text"
            value={settings.rerankerHttpResponseResultsPath}
            onChange={(e) =>
              updateSettings({ rerankerHttpResponseResultsPath: e.target.value })
            }
            className={inputCls}
            placeholder="results"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Index Field</label>
          <input
            type="text"
            value={settings.rerankerHttpResponseIndexField}
            onChange={(e) =>
              updateSettings({ rerankerHttpResponseIndexField: e.target.value })
            }
            className={inputCls}
            placeholder="index"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-zinc-500">Score Field</label>
          <input
            type="text"
            value={settings.rerankerHttpResponseScoreField}
            onChange={(e) =>
              updateSettings({ rerankerHttpResponseScoreField: e.target.value })
            }
            className={inputCls}
            placeholder="relevance_score"
          />
        </div>
      </div>
    </Field>
  );
}

function CustomRerankerSection(
  props: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>,
) {
  return (
    <>
      <Field
        label="HTTP-Reranker Modell"
        description="Wird an den HTTP-Reranker durchgereicht, z. B. ein Ollama-Reranker wie qllama/bge-reranker-v2-m3"
      >
        <ModelSelector
          value={props.settings.rerankerModel}
          models={props.settings.rerankerKnownModels}
          onChange={(model, list) =>
            props.updateSettings({ rerankerModel: model, rerankerKnownModels: list })
          }
        />
      </Field>
      <CustomRerankerUrlField {...props} />
      <CustomRerankerAuthField {...props} />
      <CustomRerankerTemplates {...props} />
      <CustomRerankerResponseFields {...props} />
    </>
  );
}

export function SettingsRerankerSection(props: SettingsAdminRuntimeSectionProps) {
  return (
    <div className="ci-panel rounded-xl p-5 space-y-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-[#2f2b26]">Reranker</p>
      </div>
      <div className="space-y-4">
        <RerankerEnabledField {...props} />
        <RerankerProviderField {...props} />
        {props.settings.rerankerProvider === 'cross_encoder' ? (
          <CrossEncoderSection {...props} />
        ) : (
          <CustomRerankerSection {...props} />
        )}
      </div>
    </div>
  );
}
