import {
  Field,
  inputCls,
  ModelSelector,
  SecretInput,
  selectCls,
} from '@/features/settings/components/SettingsFields';
import type { VisionProvider } from '@/features/settings/types';
import { isDefaultCustomProfileId } from '@/features/settings/utils/customProfiles';
import { clampIntegerInput, type VisionRuntimeProps } from './settingsAdminRuntimeShared';

export function SettingsVisionSummarySection(props: VisionRuntimeProps) {
  const isTemplateProfileActive = isDefaultCustomProfileId(props.activeCustomProfile.id);

  return (
    <div className="ci-panel rounded-xl p-5 space-y-4">
      <div className="mb-2">
        <p className="text-sm font-semibold text-[#2f2b26]">Vision Summary</p>
      </div>
      <p className="text-xs text-zinc-500 -mt-2">
        Optional: Bildinhalt per Vision-Modell zusammenfassen (Embedding bleibt Text-basiert).
      </p>
      <div className="space-y-4">
        <Field label="Vision-Summary aktivieren">
          <label className="flex items-center gap-2 text-sm text-[#756b62]">
            <input
              type="checkbox"
              checked={props.settings.ingestionVisionSummaryEnabled}
              onChange={(e) =>
                props.updateSettings({ ingestionVisionSummaryEnabled: e.target.checked })
              }
              className="rounded border-[#2f2b26]/20 accent-[#f3aa7f]"
            />
            Aktiviert
          </label>
        </Field>

        <Field label="Provider & Modell">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Vision Provider</label>
              <select
                value={props.settings.ingestionVisionSummaryProvider}
                onChange={(e) =>
                  props.updateSettings({
                    ingestionVisionSummaryProvider: e.target.value as VisionProvider,
                  })
                }
                className={selectCls}
              >
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
                <option value="ollama">Ollama</option>
                <option value="custom">Custom</option>
                <option value="http">HTTP</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Vision Modell (optional)</label>
              <ModelSelector
                value={props.settings.ingestionVisionSummaryModel}
                models={props.settings.ingestionVisionSummaryKnownModels}
                onChange={(model, list) =>
                  props.updateSettings({
                    ingestionVisionSummaryModel: model,
                    ingestionVisionSummaryKnownModels: list,
                  })
                }
              />
            </div>
          </div>
        </Field>

        {props.settings.ingestionVisionSummaryProvider === 'custom' && (
          <div className="space-y-3 rounded-lg border border-[#2f2b26]/10 bg-[#fffaf3] p-4">
            <Field label="Custom-Profil für Vision">
              <select
                value={props.settings.activeCustomLlmProfileId}
                onChange={(e) => props.setActiveCustomProfile(e.target.value)}
                className={selectCls}
              >
                {props.customProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {isDefaultCustomProfileId(profile.id)
                      ? `${profile.label || profile.model} (Vorlage)`
                      : profile.label || profile.model}
                  </option>
                ))}
              </select>
            </Field>
            {isTemplateProfileActive && (
              <p className="text-xs text-orange-300/80">
                Die feste Custom-Vorlage ist nicht direkt editierbar. Beim ersten Ändern eines
                Felds wird automatisch ein neues Custom-Profil für Vision angelegt und aktiviert.
              </p>
            )}
            {props.activeCustomProfile && (
              <>
                <Field label="Custom Vision-Modell" description="Modell für Vision-Summary">
                  <input
                    type="text"
                    value={props.activeCustomProfile.model}
                    onChange={(e) =>
                      props.updateCustomProfile(props.activeCustomProfile!.id, {
                        model: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="z. B. gpt-4o-mini oder llava"
                  />
                </Field>
                <Field label="Profilname">
                  <input
                    type="text"
                    value={props.activeCustomProfile.label}
                    onChange={(e) =>
                      props.updateCustomProfile(props.activeCustomProfile!.id, {
                        label: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="z. B. Vision lokal"
                  />
                </Field>
                <Field label="Custom Endpoint URL" description="OpenAI-kompatibler Endpunkt">
                  <input
                    type="url"
                    value={props.activeCustomProfile.url}
                    onChange={(e) =>
                      props.updateCustomProfile(props.activeCustomProfile!.id, {
                        url: e.target.value,
                      })
                    }
                    className={inputCls}
                    placeholder="http://localhost:1234/v1"
                  />
                </Field>
                <Field label="Custom API Key">
                  <SecretInput
                    value={props.activeCustomProfile.apiKey}
                    onChange={(value) =>
                      props.updateCustomProfile(props.activeCustomProfile!.id, {
                        apiKey: value,
                      })
                    }
                    placeholder="sk-... oder leer / none"
                  />
                </Field>
              </>
            )}
            <p className="text-xs text-zinc-500">
              Dieses Vision-Setup nutzt das aktive OpenAI-kompatible Custom-Profil und
              synchronisiert es für Admins direkt in die Backend-Runtime.
            </p>
          </div>
        )}

        {props.settings.ingestionVisionSummaryProvider === 'http' && (
          <div className="space-y-3 rounded-lg border border-[#2f2b26]/10 bg-[#fffaf3] p-4">
            <Field
              label="HTTP Endpoint URL"
              description="Endpoint des Vision-HTTP-Dienstes (FastAPI, TEI, Infinity)"
            >
              <input
                type="url"
                value={props.settings.ingestionVisionSummaryHttpUrl}
                onChange={(e) =>
                  props.updateSettings({ ingestionVisionSummaryHttpUrl: e.target.value })
                }
                className={inputCls}
                placeholder="http://localhost:8088/vision"
              />
            </Field>
            <Field
              label="API Key / Bearer Token"
              description="Optional - nur wenn der Dienst Auth erfordert"
            >
              <SecretInput
                value={props.settings.ingestionVisionSummaryHttpApiKey}
                onChange={(value) =>
                  props.updateSettings({ ingestionVisionSummaryHttpApiKey: value })
                }
                placeholder="Optional"
              />
            </Field>
            <Field
              label="Headers Template (JSON)"
              description="JSON-Objekt für HTTP-Headers. Platzhalter: {'{{api_key}}'}"
            >
              <textarea
                rows={3}
                value={props.settings.ingestionVisionSummaryHttpHeadersTemplate}
                onChange={(e) =>
                  props.updateSettings({
                    ingestionVisionSummaryHttpHeadersTemplate: e.target.value,
                  })
                }
                className="w-full ci-input resize-y rounded-lg px-3 py-2 text-sm placeholder-[#756b62]/70"
                placeholder='{"Authorization":"Bearer {{api_key}}"}'
              />
            </Field>
            <Field
              label="Body Template (JSON)"
              description="Platzhalter: {'{{model}}'}, {'{{prompt}}'}, {'{{image_base64}}'}, {'{{image_data_url}}'}, {'{{api_key}}'}"
            >
              <textarea
                rows={5}
                value={props.settings.ingestionVisionSummaryHttpBodyTemplate}
                onChange={(e) =>
                  props.updateSettings({
                    ingestionVisionSummaryHttpBodyTemplate: e.target.value,
                  })
                }
                className="w-full ci-input resize-y rounded-lg px-3 py-2 text-sm placeholder-[#756b62]/70"
                placeholder='{"model":"{{model}}","prompt":"{{prompt}}","image":"{{image_base64}}"}'
              />
            </Field>
            <Field label="Response Text Path" description="JSON-Pfad zur Antwort im Response">
              <input
                type="text"
                value={props.settings.ingestionVisionSummaryHttpResponseTextPath}
                onChange={(e) =>
                  props.updateSettings({
                    ingestionVisionSummaryHttpResponseTextPath: e.target.value,
                  })
                }
                className={inputCls}
                placeholder="text"
              />
            </Field>
          </div>
        )}

        <Field label="Limits">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Timeout (Sekunden)</label>
              <input
                type="number"
                min={5}
                max={180}
                value={props.settings.ingestionVisionSummaryTimeoutSeconds}
                onChange={(e) =>
                  props.updateSettings({
                    ingestionVisionSummaryTimeoutSeconds: clampIntegerInput(e.target.value, 5, 180),
                  })
                }
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-zinc-500">Max Summary-Zeichen</label>
              <input
                type="number"
                min={40}
                max={2000}
                value={props.settings.ingestionVisionSummaryMaxChars}
                onChange={(e) =>
                  props.updateSettings({
                    ingestionVisionSummaryMaxChars: clampIntegerInput(e.target.value, 40, 2000),
                  })
                }
                className={inputCls}
              />
            </div>
          </div>
        </Field>
      </div>
    </div>
  );
}
