import { Field, inputCls, selectCls } from '@/features/settings/components/SettingsFields';
import type { SettingsAdminRuntimeSectionProps } from './settingsAdminRuntimeShared';

const hydeProviders: Array<'claude' | 'openai' | 'gemini' | 'ollama' | 'custom'> = [
  'claude',
  'openai',
  'gemini',
  'ollama',
  'custom',
];

export function SettingsHydeSection({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <div className="space-y-4">
      <Field
        label="HyDE aktivieren"
        description="Hypothetical Document Embedding: Erzeugt hypothetisches Dokument für besseren Recall bei kurzen Queries"
      >
        <label className="flex items-center gap-2 text-sm text-[#756b62]">
          <input
            type="checkbox"
            checked={settings.retrievalHydeEnabled}
            onChange={(e) => updateSettings({ retrievalHydeEnabled: e.target.checked })}
            className="rounded border-[#2f2b26]/20 accent-[#f3aa7f]"
          />
          Aktiviert
        </label>
      </Field>

      {settings.retrievalHydeEnabled && (
        <>
          <Field
            label="HyDE Provider"
            description="LLM-Provider für hypothetische Dokument-Generierung"
          >
            <select
              value={settings.retrievalHydeProvider}
              onChange={(e) =>
                updateSettings({
                  retrievalHydeProvider: e.target.value as 'claude' | 'openai' | 'gemini' | 'ollama' | 'custom',
                })
              }
              className={selectCls}
            >
              {hydeProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Temperatur"
              description="Steuerung der Variabilität der hypothetischen Antwort"
            >
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={settings.retrievalHydeTemperature}
                onChange={(e) =>
                  updateSettings({
                    retrievalHydeTemperature: Number(e.target.value) || 0.0,
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field
              label="Max Tokens"
              description="Maximale Token-Anzahl für hypothetisches Dokument"
            >
              <input
                type="number"
                min={50}
                max={500}
                step={10}
                value={settings.retrievalHydeMaxTokens}
                onChange={(e) =>
                  updateSettings({
                    retrievalHydeMaxTokens: Math.round(Number(e.target.value)) || 220,
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field
              label="Fusion Gewicht"
              description="Gewichtung der HyDE-Kandidaten im Fusion-Prozess"
            >
              <input
                type="number"
                min={0.1}
                max={2.0}
                step={0.1}
                value={settings.retrievalHydeFusionWeight}
                onChange={(e) =>
                  updateSettings({
                    retrievalHydeFusionWeight: Number(e.target.value) || 0.8,
                  })
                }
                className={inputCls}
              />
            </Field>
          </div>
        </>
      )}
    </div>
  );
}
