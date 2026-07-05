import { Field, inputCls, selectCls } from '@/features/settings/components/SettingsFields';
import type { SettingsAdminRuntimeSectionProps } from './settingsAdminRuntimeShared';

const expansionProviders: Array<'claude' | 'openai' | 'gemini' | 'ollama' | 'custom'> = [
  'claude',
  'openai',
  'gemini',
  'ollama',
  'custom',
];

export function SettingsContextualPrefixSection({
  settings,
  updateSettings,
}: Pick<SettingsAdminRuntimeSectionProps, 'settings' | 'updateSettings'>) {
  return (
    <div className="space-y-4">
      <Field
        label="Contextual Prefix aktivieren"
        description="Anthropic-Pattern: Chunks erhalten dokumentbezogenen Kontext-Prefix vor Embedding"
      >
        <label className="flex items-center gap-2 text-sm text-[#756b62]">
          <input
            type="checkbox"
            checked={settings.ingestionContextualPrefixEnabled}
            onChange={(e) => updateSettings({ ingestionContextualPrefixEnabled: e.target.checked })}
            className="rounded border-[#2f2b26]/20 accent-[#f3aa7f]"
          />
          Aktiviert
        </label>
      </Field>

      {settings.ingestionContextualPrefixEnabled && (
        <>
          <Field
            label="Provider"
            description="LLM-Provider für Contextual Prefix Generierung"
          >
            <select
              value={settings.ingestionContextualPrefixProvider}
              onChange={(e) =>
                updateSettings({
                  ingestionContextualPrefixProvider: e.target.value as 'claude' | 'openai' | 'gemini' | 'ollama' | 'custom',
                })
              }
              className={selectCls}
            >
              {expansionProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field
              label="Max Tokens"
              description="Maximale Token-Anzahl für Prefix"
            >
              <input
                type="number"
                min={50}
                max={500}
                step={10}
                value={settings.ingestionContextualPrefixMaxTokens}
                onChange={(e) =>
                  updateSettings({
                    ingestionContextualPrefixMaxTokens: Math.round(
                      Number(e.target.value) || 120
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field
              label="Dokument-Chars"
              description="Maximale Zeichen des Dokuments für Prefix-Kontext"
            >
              <input
                type="number"
                min={1000}
                max={50000}
                step={1000}
                value={settings.ingestionContextualPrefixDocumentChars}
                onChange={(e) =>
                  updateSettings({
                    ingestionContextualPrefixDocumentChars: Math.round(
                      Number(e.target.value) || 12000
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field
              label="Chunk-Chars"
              description="Maximale Zeichen des Chunks für Prefix"
            >
              <input
                type="number"
                min={500}
                max={10000}
                step={500}
                value={settings.ingestionContextualPrefixChunkChars}
                onChange={(e) =>
                  updateSettings({
                    ingestionContextualPrefixChunkChars: Math.round(
                      Number(e.target.value) || 2000
                    ),
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
