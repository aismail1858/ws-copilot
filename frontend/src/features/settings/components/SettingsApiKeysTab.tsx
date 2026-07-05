import type { MyLlmSecretsResponse } from '@/api/client';
import {
  Field,
  inputCls,
  ModelSelector,
  SecretInput,
} from '@/features/settings/components/SettingsFields';
import SettingsCustomProfilesSection from '@/features/settings/components/SettingsCustomProfilesSection';
import SettingsModelTestSection from '@/features/settings/components/SettingsModelTestSection';
import type { NewCustomProfileDraft } from '@/features/settings/types';
import type { AppSettings, CustomLlmProfile } from '@/types';

interface SettingsApiKeysTabProps {
  settings: AppSettings;
  myLlmSecrets: MyLlmSecretsResponse | null;
  updateSettings: (patch: Partial<AppSettings>) => void;
  newCustomProfileDraft: NewCustomProfileDraft;
  updateNewCustomProfileDraft: (
    patch: Partial<Pick<NewCustomProfileDraft, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  canAddCustomProfile: boolean;
  addCustomProfile: () => void;
  discardNewCustomProfileDraft: () => void;
  duplicateCustomProfile: (profileId: string) => void;
  duplicatedCustomProfileLabel: string;
  editableCustomProfiles: CustomLlmProfile[];
  activeCustomProfileId: string;
  isDuplicatingCustomProfileDraft: boolean;
  isNewCustomProfileDraftActive: boolean;
  setActiveCustomProfile: (profileId: string) => void;
  updateCustomProfile: (
    profileId: string,
    patch: Partial<Pick<CustomLlmProfile, 'label' | 'model' | 'url' | 'apiKey'>>
  ) => void;
  removeCustomProfile: (profileId: string) => void;
}

function ApiKeyField({
  label,
  description,
  badge,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  description: string;
  badge?: boolean;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} description={description} badge={badge}>
      <SecretInput value={value} onChange={onChange} placeholder={placeholder} />
    </Field>
  );
}

function ProviderModelField({
  label,
  description,
  value,
  models,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  models: string[];
  onChange: (model: string, list: string[]) => void;
}) {
  return (
    <Field label={label} description={description}>
      <ModelSelector value={value} models={models} onChange={onChange} />
    </Field>
  );
}

export default function SettingsApiKeysTab(props: SettingsApiKeysTabProps) {
  const { settings, myLlmSecrets, updateSettings } = props;

  return (
    <div className="space-y-8">
      <SettingsModelTestSection settings={settings} />

      <div className="ci-panel rounded-xl p-5 space-y-4">
        <div className="mb-2">
          <p className="text-sm font-semibold text-[#2f2b26]">Claude (Anthropic)</p>
        </div>
        <ApiKeyField
          label="API Key"
          description="Für Claude-Modelle"
          badge={myLlmSecrets?.anthropicApiKeySet}
          value={settings.anthropicApiKey}
          placeholder="sk-ant-..."
          onChange={(value) => updateSettings({ anthropicApiKey: value })}
        />
        <ProviderModelField
          label="Modell"
          description="Wählen, Hinzufügen oder Löschen"
          value={settings.anthropicModel}
          models={settings.anthropicKnownModels}
          onChange={(model, list) =>
            updateSettings({
              anthropicModel: model,
              anthropicKnownModels: list,
              ...(model === '' ? { anthropicCompletionModel: '' } : {}),
            })
          }
        />
      </div>

      <div className="ci-panel rounded-xl p-5 space-y-4">
        <div className="mb-2">
          <p className="text-sm font-semibold text-[#2f2b26]">OpenAI (GPT)</p>
        </div>
        <ApiKeyField
          label="API Key"
          description="Für GPT-Modelle und OpenAI Embeddings"
          badge={myLlmSecrets?.openaiApiKeySet}
          value={settings.openaiApiKey}
          placeholder="sk-..."
          onChange={(value) => updateSettings({ openaiApiKey: value })}
        />
        <ProviderModelField
          label="Modell"
          description="Wählen, Hinzufügen oder Löschen"
          value={settings.openaiModel}
          models={settings.openaiKnownModels}
          onChange={(model, list) =>
            updateSettings({
              openaiModel: model,
              openaiKnownModels: list,
              ...(model === '' ? { openaiCompletionModel: '' } : {}),
            })
          }
        />
      </div>

      <div className="ci-panel rounded-xl p-5 space-y-4">
        <div className="mb-2">
          <p className="text-sm font-semibold text-[#2f2b26]">Gemini (Google)</p>
        </div>
        <ApiKeyField
          label="API Key"
          description="Für Gemini-Modelle und Embeddings"
          badge={myLlmSecrets?.googleApiKeySet}
          value={settings.googleApiKey}
          placeholder="AIza..."
          onChange={(value) => updateSettings({ googleApiKey: value })}
        />
        <ProviderModelField
          label="Modell"
          description="Wählen, Hinzufügen oder Löschen"
          value={settings.googleModel}
          models={settings.googleKnownModels}
          onChange={(model, list) =>
            updateSettings({
              googleModel: model,
              googleKnownModels: list,
              ...(model === '' ? { googleCompletionModel: '' } : {}),
            })
          }
        />
      </div>

      <div className="ci-panel rounded-xl p-5 space-y-4">
        <div className="mb-2">
          <p className="text-sm font-semibold text-[#2f2b26]">Ollama Konfiguration</p>
        </div>
        <Field label="Ollama URL" description="Basis-URL des Ollama-Servers">
          <input
            type="url"
            value={settings.ollamaUrl}
            onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
            className={inputCls}
            placeholder="http://localhost:11434"
          />
        </Field>
        <ProviderModelField
          label="Ollama Modell"
          description="Wählen, Hinzufügen oder Löschen"
          value={settings.ollamaModel || 'llama3'}
          models={settings.ollamaKnownModels}
          onChange={(model, list) =>
            updateSettings({
              ollamaModel: model,
              ollamaKnownModels: list,
              ...(model === '' ? { ollamaCompletionModel: '' } : {}),
            })
          }
        />
        <ApiKeyField
          label="API Key / Bearer Token"
          description="Optional - nur nötig wenn Ollama hinter einem Auth-Proxy läuft"
          badge={myLlmSecrets?.ollamaApiKeySet}
          value={settings.ollamaApiKey}
          placeholder="Leer lassen wenn nicht benötigt"
          onChange={(value) => updateSettings({ ollamaApiKey: value })}
        />
      </div>

      <SettingsCustomProfilesSection
        newCustomProfileDraft={props.newCustomProfileDraft}
        updateNewCustomProfileDraft={props.updateNewCustomProfileDraft}
        canAddCustomProfile={props.canAddCustomProfile}
        addCustomProfile={props.addCustomProfile}
        discardNewCustomProfileDraft={props.discardNewCustomProfileDraft}
        duplicateCustomProfile={props.duplicateCustomProfile}
        duplicatedCustomProfileLabel={props.duplicatedCustomProfileLabel}
        editableCustomProfiles={props.editableCustomProfiles}
        activeCustomProfileId={props.activeCustomProfileId}
        isDuplicatingCustomProfileDraft={props.isDuplicatingCustomProfileDraft}
        isNewCustomProfileDraftActive={props.isNewCustomProfileDraftActive}
        setActiveCustomProfile={props.setActiveCustomProfile}
        updateCustomProfile={props.updateCustomProfile}
        removeCustomProfile={props.removeCustomProfile}
      />
    </div>
  );
}
