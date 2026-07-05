import type { ReactNode } from 'react';
import {
  Field,
  inputCls,
  selectCls,
  settingsDangerButtonCls,
} from '@/features/settings/components/SettingsFields';
import type { VariantDraft } from '@/features/settings/components/SettingsRetrievalLabShared';
import {
  PROVIDERS,
  getModelsForProvider,
} from '@/features/chat/utils/modelConstants';
import type { AppSettings } from '@/types';

function clampNumber(value: string, fallback: number, min: number, max: number) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

const llmProviders: Array<VariantDraft['llmProvider']> = [
  'claude',
  'openai',
  'gemini',
  'ollama',
  'custom',
];

const expansionProviders: Array<VariantDraft['multiQueryExpansionProvider']> = [
  'claude',
  'openai',
  'gemini',
  'ollama',
  'custom',
];

function getDefaultModelForProvider(provider: VariantDraft['llmProvider'], settings: AppSettings): string {
  switch (provider) {
    case 'claude': return settings.anthropicModel;
    case 'openai': return settings.openaiModel;
    case 'gemini': return settings.googleModel.replace(/^models\//, '') || 'gemini-2.5-flash';
    case 'ollama': return settings.ollamaModel;
    case 'custom': return settings.customLlmModel || 'custom';
    default: return settings.anthropicModel;
  }
}

function getKnownModelsForProvider(provider: VariantDraft['llmProvider'], settings: AppSettings): string[] {
  const providerInfo = PROVIDERS.find((p) => p.id === provider);
  if (!providerInfo) return [];
  return getModelsForProvider(providerInfo, settings);
}

function VariantFieldset({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[#2f2b26]/10 bg-white p-3 shadow-sm sm:space-y-3 sm:p-4">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <div className="h-1.5 w-1.5 rounded-full bg-[#f3aa7f] shrink-0" />
        <p className="text-[10px] sm:text-xs font-semibold text-[#2f2b26] uppercase tracking-wider truncate">{title}</p>
      </div>
      {description && <p className="text-[10px] sm:text-xs text-zinc-500">{description}</p>}
      {children}
    </div>
  );
}

export default function SettingsRetrievalLabVariantForm({
  draft,
  canRemove,
  settings,
  onChange,
  onRemove,
}: {
  draft: VariantDraft;
  canRemove: boolean;
  settings: AppSettings;
  onChange: (patch: Partial<VariantDraft>) => void;
  onRemove: () => void;
}) {
  const handleProviderChange = (provider: VariantDraft['llmProvider']) => {
    const models = getKnownModelsForProvider(provider, settings);
    onChange({
      llmProvider: provider,
      llmModel: models[0] || getDefaultModelForProvider(provider, settings),
    });
  };

  const knownModels = getKnownModelsForProvider(draft.llmProvider, settings);
  const currentModelInList = knownModels.includes(draft.llmModel);
  const allModels = currentModelInList
    ? knownModels
    : [draft.llmModel, ...knownModels];

  return (
    <div className="ci-panel rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-wrap sm:flex-row items-start justify-between gap-3">
        <div className="space-y-1 w-full sm:w-auto">
          <input
            type="text"
            value={draft.label}
            onChange={(event) => onChange({ label: event.target.value })}
            className={`${inputCls} min-w-[140px] sm:min-w-[180px] text-sm font-semibold`}
            placeholder="Variantenname"
          />
          <p className="text-xs text-zinc-500">
            Retrieval, Multi-Query, Fusion und Rerank für einen Vergleichslauf.
          </p>
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove} className={settingsDangerButtonCls}>
            Entfernen
          </button>
        )}
      </div>

      <VariantFieldset
        title="LLM Provider"
        description="Provider und Modell für diese Variante"
      >
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2">
          <Field label="Provider" description="LLM Backend">
            <select
              value={draft.llmProvider}
              onChange={(event) => handleProviderChange(event.target.value as VariantDraft['llmProvider'])}
              className={selectCls}
            >
              {llmProviders.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Modell" description="Modellname">
            <select
              value={draft.llmModel}
              onChange={(event) => onChange({ llmModel: event.target.value })}
              className={selectCls}
            >
              {allModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </Field>
          {draft.llmProvider === 'custom' && (
            <>
              <Field label="URL" description="Custom API Endpoint">
                <input
                  type="url"
                  value={draft.llmCustomUrl}
                  onChange={(event) => onChange({ llmCustomUrl: event.target.value })}
                  className={inputCls}
                  placeholder="https://api.example.com/v1"
                />
              </Field>
              <Field label="API Key" description="Custom API Key">
                <input
                  type="password"
                  value={draft.llmCustomApiKey}
                  onChange={(event) => onChange({ llmCustomApiKey: event.target.value })}
                  className={inputCls}
                  placeholder="sk-..."
                />
              </Field>
            </>
          )}
        </div>
      </VariantFieldset>

      <VariantFieldset
        title="Basis Retrieval"
        description="Grundlegende Retrieval-Parameter und Scoring"
      >
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Temperatur" description="Einfluss auf Antwort-Varianz">
            <input
              type="number"
              min={0}
              max={2}
              step={0.05}
              value={draft.temperature}
              onChange={(event) =>
                onChange({ temperature: clampNumber(event.target.value, draft.temperature, 0, 2) })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Min Score" description="Minimum Retrieval-Score">
            <input
              type="number"
              min={0}
              max={2}
              step={0.05}
              value={draft.retrievalMinScore}
              onChange={(event) =>
                onChange({
                  retrievalMinScore: clampNumber(event.target.value, draft.retrievalMinScore, 0, 2),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="RRF-K" description="Hybrid Fusion RRF Konstante">
            <input
              type="number"
              min={1}
              max={200}
              step={1}
              value={draft.hybridFusionRrfK}
              onChange={(event) =>
                onChange({
                  hybridFusionRrfK: Math.round(
                    clampNumber(event.target.value, draft.hybridFusionRrfK, 1, 200),
                  ),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Candidate Pool" description="Max Kandidaten vor Fusion">
            <input
              type="number"
              min={1}
              max={100}
              step={1}
              value={draft.hybridCandidatePoolSize}
              onChange={(event) =>
                onChange({
                  hybridCandidatePoolSize: Math.round(
                    clampNumber(event.target.value, draft.hybridCandidatePoolSize, 1, 100),
                  ),
                })
              }
              className={inputCls}
            />
          </Field>
        </div>
      </VariantFieldset>

      <VariantFieldset
        title="Hybrid Fusion"
        description="Vector- und Lexical-Search Gewichtung"
      >
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Lexical Strategy" description="bm25 oder fts">
            <select
              value={draft.hybridLexicalStrategy}
              onChange={(event) =>
                onChange({
                  hybridLexicalStrategy: event.target.value as VariantDraft['hybridLexicalStrategy'],
                })
              }
              className={selectCls}
            >
              <option value="bm25">bm25</option>
              <option value="fts">fts</option>
            </select>
          </Field>
          <Field label="Vector Weight" description="Gewichtung Vector-Score">
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={draft.hybridVectorWeight}
              onChange={(event) =>
                onChange({
                  hybridVectorWeight: clampNumber(event.target.value, draft.hybridVectorWeight, 0, 5),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Lexical Weight" description="Gewichtung Lexical-Score">
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={draft.hybridLexicalWeight}
              onChange={(event) =>
                onChange({
                  hybridLexicalWeight: clampNumber(event.target.value, draft.hybridLexicalWeight, 0, 5),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="MQ Provider" description="Multi-Query Expansion Provider">
            <select
              value={draft.multiQueryExpansionProvider}
              onChange={(event) =>
                onChange({
                  multiQueryExpansionProvider:
                    event.target.value as VariantDraft['multiQueryExpansionProvider'],
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
        </div>
      </VariantFieldset>

      <VariantFieldset title="Multi-Query" description="Query Expansion und Fusion">
        <div className="mb-2 sm:mb-3 flex flex-wrap gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#756b62]">
            <input
              type="checkbox"
              checked={draft.multiQueryEnabled}
              onChange={(event) => onChange({ multiQueryEnabled: event.target.checked })}
              className="rounded border-[#2f2b26]/20 accent-[#2563eb]"
            />
            Multi-Query aktiv
          </label>
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#756b62]">
            <input
              type="checkbox"
              checked={draft.multiQueryFallbackOnError}
              onChange={(event) => onChange({ multiQueryFallbackOnError: event.target.checked })}
              className="rounded border-[#2f2b26]/20 accent-[#2563eb]"
            />
            MQ-Fallback bei Fehler
          </label>
        </div>
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Min Queries" description="Minimale Query-Anzahl">
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={draft.multiQueryMinQueries}
              onChange={(event) =>
                onChange({
                  multiQueryMinQueries: Math.round(
                    clampNumber(event.target.value, draft.multiQueryMinQueries, 1, 10),
                  ),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="Max Queries" description="Maximale Query-Anzahl">
            <input
              type="number"
              min={1}
              max={10}
              step={1}
              value={draft.multiQueryMaxQueries}
              onChange={(event) =>
                onChange({
                  multiQueryMaxQueries: Math.round(
                    clampNumber(event.target.value, draft.multiQueryMaxQueries, 1, 10),
                  ),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="MQ RRF-K" description="Multi-Query Fusion Konstante">
            <input
              type="number"
              min={1}
              max={200}
              step={1}
              value={draft.multiQueryRrfK}
              onChange={(event) =>
                onChange({
                  multiQueryRrfK: Math.round(
                    clampNumber(event.target.value, draft.multiQueryRrfK, 1, 200),
                  ),
                })
              }
              className={inputCls}
            />
          </Field>
          <Field label="MQ Temperatur" description="Expansion Temperatur">
            <input
              type="number"
              min={0}
              max={2}
              step={0.05}
              value={draft.multiQueryExpansionTemperature}
              onChange={(event) =>
                onChange({
                  multiQueryExpansionTemperature: clampNumber(
                    event.target.value,
                    draft.multiQueryExpansionTemperature,
                    0,
                    2,
                  ),
                })
              }
              className={inputCls}
            />
          </Field>
        </div>
      </VariantFieldset>

      <VariantFieldset
        title="Contextual Prefix"
        description="Anthropic-Pattern: Chunks erhalten dokumentbezogenen Kontext-Prefix vor Embedding"
      >
        <div className="mb-2 sm:mb-3 flex flex-wrap gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#756b62]">
            <input
              type="checkbox"
              checked={draft.ingestionContextualPrefixEnabled}
              onChange={(event) => onChange({ ingestionContextualPrefixEnabled: event.target.checked })}
              className="rounded border-[#2f2b26]/20 accent-[#2563eb]"
            />
            Contextual Prefix aktiv
          </label>
        </div>
        {draft.ingestionContextualPrefixEnabled && (
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Provider" description="LLM-Provider für Prefix-Generierung">
              <select
                value={draft.ingestionContextualPrefixProvider}
                onChange={(event) =>
                  onChange({
                    ingestionContextualPrefixProvider: event.target.value as VariantDraft['ingestionContextualPrefixProvider'],
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

            <Field label="Max Tokens" description="Maximale Token-Anzahl für Prefix">
              <input
                type="number"
                min={50}
                max={500}
                step={10}
                value={draft.ingestionContextualPrefixMaxTokens}
                onChange={(event) =>
                  onChange({
                    ingestionContextualPrefixMaxTokens: Math.round(
                      clampNumber(event.target.value, draft.ingestionContextualPrefixMaxTokens, 50, 500)
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field label="Dokument-Chars" description="Maximale Zeichen des Dokuments für Kontext">
              <input
                type="number"
                min={1000}
                max={50000}
                step={1000}
                value={draft.ingestionContextualPrefixDocumentChars}
                onChange={(event) =>
                  onChange({
                    ingestionContextualPrefixDocumentChars: Math.round(
                      clampNumber(event.target.value, draft.ingestionContextualPrefixDocumentChars, 1000, 50000)
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field label="Chunk-Chars" description="Maximale Zeichen des Chunks für Kontext">
              <input
                type="number"
                min={500}
                max={10000}
                step={500}
                value={draft.ingestionContextualPrefixChunkChars}
                onChange={(event) =>
                  onChange({
                    ingestionContextualPrefixChunkChars: Math.round(
                      clampNumber(event.target.value, draft.ingestionContextualPrefixChunkChars, 500, 10000)
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </VariantFieldset>

      <VariantFieldset
        title="HyDE"
        description="Hypothetical Document Embedding: Erzeugt hypothetisches Dokument für besseren Recall"
      >
        <div className="mb-2 sm:mb-3 flex flex-wrap gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#756b62]">
            <input
              type="checkbox"
              checked={draft.retrievalHydeEnabled}
              onChange={(event) => onChange({ retrievalHydeEnabled: event.target.checked })}
              className="rounded border-[#2f2b26]/20 accent-[#2563eb]"
            />
            HyDE aktiv
          </label>
        </div>
        {draft.retrievalHydeEnabled && (
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Provider" description="LLM-Provider für hypothetische Dokument-Generierung">
              <select
                value={draft.retrievalHydeProvider}
                onChange={(event) =>
                  onChange({
                    retrievalHydeProvider: event.target.value as VariantDraft['retrievalHydeProvider'],
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

            <Field label="Temperatur" description="Steuerung der Variabilität der hypothetischen Antwort">
              <input
                type="number"
                min={0}
                max={2}
                step={0.1}
                value={draft.retrievalHydeTemperature}
                onChange={(event) =>
                  onChange({
                    retrievalHydeTemperature: clampNumber(
                      event.target.value,
                      draft.retrievalHydeTemperature,
                      0,
                      2
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field label="Max Tokens" description="Maximale Token-Anzahl für hypothetisches Dokument">
              <input
                type="number"
                min={50}
                max={500}
                step={10}
                value={draft.retrievalHydeMaxTokens}
                onChange={(event) =>
                  onChange({
                    retrievalHydeMaxTokens: Math.round(
                      clampNumber(event.target.value, draft.retrievalHydeMaxTokens, 50, 500)
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>

            <Field label="Fusion Gewicht" description="Gewichtung der HyDE-Kandidaten im Fusion-Prozess">
              <input
                type="number"
                min={0.1}
                max={2.0}
                step={0.1}
                value={draft.retrievalHydeFusionWeight}
                onChange={(event) =>
                  onChange({
                    retrievalHydeFusionWeight: clampNumber(
                      event.target.value,
                      draft.retrievalHydeFusionWeight,
                      0.1,
                      2.0
                    ),
                  })
                }
                className={inputCls}
              />
            </Field>
          </div>
        )}
      </VariantFieldset>

      <VariantFieldset
        title="Reranker"
        description="Ergebnis-Reranking mit spezialisiertem Modell"
      >
        <div className="mb-2 sm:mb-3 flex flex-wrap gap-2 sm:gap-3">
          <label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#756b62]">
            <input
              type="checkbox"
              checked={draft.rerankerEnabled}
              onChange={(event) => onChange({ rerankerEnabled: event.target.checked })}
              className="rounded border-[#2f2b26]/20 accent-[#2563eb]"
            />
            Reranker aktiv
          </label>
        </div>
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Provider" description="Reranker-Backend">
            <select
              value={draft.rerankerProvider}
              onChange={(event) =>
                onChange({ rerankerProvider: event.target.value as VariantDraft['rerankerProvider'] })
              }
              className={selectCls}
            >
              <option value="cross_encoder">cross_encoder</option>
              <option value="custom">custom</option>
              <option value="http">http</option>
            </select>
          </Field>
          <Field label="Modell" description="Reranker Modellname">
            <input
              type="text"
              value={draft.rerankerModel}
              onChange={(event) => onChange({ rerankerModel: event.target.value })}
              className={inputCls}
              placeholder="BAAI/bge-reranker-v2-m3"
            />
          </Field>
          {draft.rerankerProvider !== 'cross_encoder' && (
            <Field label="URL" description="HTTP Endpoint">
              <input
                type="url"
                value={draft.rerankerUrl}
                onChange={(event) => onChange({ rerankerUrl: event.target.value })}
                className={inputCls}
                placeholder="http://localhost:8090/rerank"
              />
            </Field>
          )}
        </div>
      </VariantFieldset>
    </div>
  );
}
