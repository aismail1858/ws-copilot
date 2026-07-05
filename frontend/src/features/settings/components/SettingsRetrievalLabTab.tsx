import { useState } from 'react';
import {
  compareRagLabVariants,
  type RagLabCompareResponse,
  type RagLabVariantPayload,
  type RuntimeLlmConfig,
} from '@/api/client';
import {
  Field,
  inputCls,
  selectCls,
  settingsAccentButtonCls,
  settingsSecondaryButtonCls,
} from '@/features/settings/components/SettingsFields';
import SettingsRetrievalLabResultCard from '@/features/settings/components/SettingsRetrievalLabResultCard';
import type {
  LabKnowledgeMode,
  VariantDraft,
} from '@/features/settings/components/SettingsRetrievalLabShared';
import { stripVariantSecrets } from '@/features/settings/components/SettingsRetrievalLabShared';
import SettingsRetrievalLabVariantForm from '@/features/settings/components/SettingsRetrievalLabVariantForm';
import { resolveActiveEditableCustomProfile } from '@/features/settings/utils/customProfiles';
import type { AppSettings } from '@/types';

interface SettingsRetrievalLabTabProps {
  settings: AppSettings;
}

const DEFAULT_QUERY =
  'Was ist das AppSkript?';

function buildActiveCustomProfile(settings: AppSettings) {
  return (
    resolveActiveEditableCustomProfile(
      settings.customLlmProfiles || [],
      settings.activeCustomLlmProfileId,
      settings.customLlmModel
    ) || {
      id: 'custom-default',
      label: 'Custom',
      model: settings.customLlmModel || 'custom',
      url: settings.customLlmUrl || '',
      apiKey: settings.customLlmApiKey || '',
    }
  );
}

function getActiveModel(settings: AppSettings): string {
  switch (settings.llmProvider) {
    case 'claude':
      return settings.anthropicModel;
    case 'openai':
      return settings.openaiModel;
    case 'gemini':
      return settings.googleModel.replace(/^models\//, '') || 'gemini-2.5-flash';
    case 'ollama':
      return settings.ollamaModel;
    case 'custom':
      return buildActiveCustomProfile(settings).model || settings.customLlmModel;
    default:
      return settings.anthropicModel;
  }
}

function buildRuntimeLlmConfig(settings: AppSettings): RuntimeLlmConfig {
  const activeCustomProfile = buildActiveCustomProfile(settings);
  return {
    provider: settings.llmProvider,
    model: getActiveModel(settings),
    anthropicApiKey: settings.anthropicApiKey,
    openaiApiKey: settings.openaiApiKey,
    googleApiKey: settings.googleApiKey,
    customLlmUrl: activeCustomProfile.url,
    customLlmApiKey: activeCustomProfile.apiKey,
    ollamaUrl: settings.ollamaUrl,
    ollamaApiKey: settings.ollamaApiKey,
  };
}

function createVariantDraft(settings: AppSettings, label: string, id: string): VariantDraft {
  return {
    id,
    label,
    llmProvider: settings.llmProvider,
    llmModel: getActiveModel(settings),
    llmCustomUrl: buildActiveCustomProfile(settings).url,
    llmCustomApiKey: buildActiveCustomProfile(settings).apiKey,
    temperature: settings.temperature,
    retrievalMinScore: settings.retrievalMinScore,
    hybridLexicalStrategy: settings.hybridLexicalStrategy,
    hybridCandidatePoolSize: settings.hybridCandidatePoolSize,
    hybridFusionRrfK: settings.hybridFusionRrfK,
    hybridVectorWeight: settings.hybridVectorWeight,
    hybridLexicalWeight: settings.hybridLexicalWeight,
    multiQueryEnabled: settings.multiQueryEnabled,
    multiQueryMinQueries: settings.multiQueryMinQueries,
    multiQueryMaxQueries: settings.multiQueryMaxQueries,
    multiQueryRrfK: settings.multiQueryRrfK,
    multiQueryExpansionProvider: settings.multiQueryExpansionProvider,
    multiQueryExpansionTemperature: settings.multiQueryExpansionTemperature,
    multiQueryFallbackOnError: settings.multiQueryFallbackOnError,
    // Contextual Prefix
    ingestionContextualPrefixEnabled: settings.ingestionContextualPrefixEnabled,
    ingestionContextualPrefixProvider: settings.ingestionContextualPrefixProvider,
    ingestionContextualPrefixMaxTokens: settings.ingestionContextualPrefixMaxTokens,
    ingestionContextualPrefixDocumentChars: settings.ingestionContextualPrefixDocumentChars,
    ingestionContextualPrefixChunkChars: settings.ingestionContextualPrefixChunkChars,
    // HyDE
    retrievalHydeEnabled: settings.retrievalHydeEnabled,
    retrievalHydeProvider: settings.retrievalHydeProvider,
    retrievalHydeTemperature: settings.retrievalHydeTemperature,
    retrievalHydeMaxTokens: settings.retrievalHydeMaxTokens,
    retrievalHydeFusionWeight: settings.retrievalHydeFusionWeight,
    rerankerEnabled: settings.rerankerEnabled,
    rerankerProvider: settings.rerankerProvider,
    rerankerModel: settings.rerankerModel,
    rerankerUrl: settings.rerankerUrl,
  };
}

function buildVariantLlmConfig(draft: VariantDraft, settings: AppSettings): RuntimeLlmConfig {
  return {
    provider: draft.llmProvider,
    model: draft.llmModel,
    anthropicApiKey: settings.anthropicApiKey,
    openaiApiKey: settings.openaiApiKey,
    googleApiKey: settings.googleApiKey,
    customLlmUrl: draft.llmCustomUrl,
    customLlmApiKey: draft.llmCustomApiKey,
    ollamaUrl: settings.ollamaUrl,
    ollamaApiKey: settings.ollamaApiKey,
  };
}

function toVariantPayload(draft: VariantDraft, settings: AppSettings): RagLabVariantPayload {
  return {
    label: draft.label.trim() || 'Variante',
    llmConfig: buildVariantLlmConfig(draft, settings),
    temperature: draft.temperature,
    retrievalMinScore: draft.retrievalMinScore,
    hybridLexicalStrategy: draft.hybridLexicalStrategy,
    hybridCandidatePoolSize: draft.hybridCandidatePoolSize,
    hybridFusionRrfK: draft.hybridFusionRrfK,
    hybridVectorWeight: draft.hybridVectorWeight,
    hybridLexicalWeight: draft.hybridLexicalWeight,
    multiQueryEnabled: draft.multiQueryEnabled,
    multiQueryMinQueries: draft.multiQueryMinQueries,
    multiQueryMaxQueries: draft.multiQueryMaxQueries,
    multiQueryRrfK: draft.multiQueryRrfK,
    multiQueryExpansionProvider: draft.multiQueryExpansionProvider,
    multiQueryExpansionTemperature: draft.multiQueryExpansionTemperature,
    multiQueryFallbackOnError: draft.multiQueryFallbackOnError,
    // Contextual Prefix
    ingestionContextualPrefixEnabled: draft.ingestionContextualPrefixEnabled,
    ingestionContextualPrefixProvider: draft.ingestionContextualPrefixProvider,
    ingestionContextualPrefixMaxTokens: draft.ingestionContextualPrefixMaxTokens,
    ingestionContextualPrefixDocumentChars: draft.ingestionContextualPrefixDocumentChars,
    ingestionContextualPrefixChunkChars: draft.ingestionContextualPrefixChunkChars,
    // HyDE
    retrievalHydeEnabled: draft.retrievalHydeEnabled,
    retrievalHydeProvider: draft.retrievalHydeProvider,
    retrievalHydeTemperature: draft.retrievalHydeTemperature,
    retrievalHydeMaxTokens: draft.retrievalHydeMaxTokens,
    retrievalHydeFusionWeight: draft.retrievalHydeFusionWeight,
    rerankerEnabled: draft.rerankerEnabled,
    rerankerProvider: draft.rerankerProvider,
    rerankerModel: draft.rerankerModel,
    rerankerUrl: draft.rerankerUrl,
  };
}

function buildPromptAddition(settings: AppSettings): string {
  return settings.systemPromptAddition.trim();
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2f2b26]/10 bg-white px-2.5 py-1.5 shadow-sm sm:px-3 sm:py-2">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-zinc-500 truncate">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-[#2f2b26] truncate">{value}</p>
    </div>
  );
}

export default function SettingsRetrievalLabTab({ settings }: SettingsRetrievalLabTabProps) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [knowledgeMode, setKnowledgeMode] = useState<LabKnowledgeMode>('docs_only');
  const [allowModelKnowledgeFallback, setAllowModelKnowledgeFallback] = useState(true);
  const [variants, setVariants] = useState<VariantDraft[]>([
    createVariantDraft(settings, 'Variante A', 'variant-a'),
    createVariantDraft(settings, 'Variante B', 'variant-b'),
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<RagLabCompareResponse | null>(null);
  const [copiedAll, setCopiedAll] = useState<'idle' | 'copied' | 'error'>('idle');

  const promptAddition = buildPromptAddition(settings);
  const runtimeProvider = buildRuntimeLlmConfig(settings).provider;
  const runtimeModel = getActiveModel(settings);

  const updateVariant = (variantId: string, patch: Partial<VariantDraft>) => {
    setVariants((current) =>
      current.map((variant) => (variant.id === variantId ? { ...variant, ...patch } : variant))
    );
  };

  const addVariant = () => {
    if (variants.length >= 4) return;
    setVariants((current) => [
      ...current,
      createVariantDraft(
        settings,
        `Variante ${String.fromCharCode(65 + current.length)}`,
        `variant-${current.length + 1}`
      ),
    ]);
  };

  const removeVariant = (variantId: string) => {
    setVariants((current) =>
      current.length <= 2 ? current : current.filter((variant) => variant.id !== variantId)
    );
  };

  const handleRun = async () => {
    if (!query.trim() || variants.length < 2) return;
    setIsRunning(true);
    setError('');
    try {
      const response = await compareRagLabVariants({
        query: query.trim(),
        llmConfig: buildRuntimeLlmConfig(settings),
        promptAddition,
        knowledgeMode,
        allowModelKnowledgeFallback,
        variants: variants.map((v) => toVariantPayload(v, settings)),
      });
      setResults(response);
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : 'Vergleich fehlgeschlagen.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopyAll = async () => {
    if (!results) return;
    const exportObj = {
      request: {
        query: query.trim(),
        knowledgeMode,
        allowModelKnowledgeFallback,
        promptAddition,
        llmProvider: runtimeProvider,
        llmModel: runtimeModel,
        variants: variants.map(stripVariantSecrets),
      },
      response: results,
    };
    const json = JSON.stringify(exportObj, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setCopiedAll('copied');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = json;
        ta.setAttribute('readonly', 'true');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopiedAll('copied');
      } catch {
        setCopiedAll('error');
      }
    }
    setTimeout(() => setCopiedAll('idle'), 1600);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="ci-panel rounded-xl p-3 sm:p-5 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1 max-w-full sm:max-w-[60%]">
            <p className="text-sm font-semibold text-[#2f2b26]">Experiment-Leiste</p>
            <p className="text-xs text-zinc-500">
              Ein Lauf zeigt pro Variante die gesendeten Multi-Queries, Retrieval-Kandidaten,
              Fusion, Rerank, finale Chunks und die Antwort inklusive System-Prompt-Vorschau.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRun}
              className={settingsAccentButtonCls}
              disabled={isRunning || !query.trim()}
            >
              {isRunning ? 'Vergleiche...' : 'Varianten vergleichen'}
            </button>
            <button
              type="button"
              onClick={addVariant}
              className={settingsSecondaryButtonCls}
              disabled={variants.length >= 4 || isRunning}
            >
              Variante hinzufügen
            </button>
          </div>
        </div>

        <div className="grid gap-2 sm:gap-3 grid-cols-2 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
          <SummaryChip label="LLM" value={`${runtimeProvider} / ${runtimeModel}`} />
          <SummaryChip label="Knowledge Mode" value={knowledgeMode} />
          <SummaryChip
            label="Model Fallback"
            value={allowModelKnowledgeFallback ? 'enabled' : 'disabled'}
          />
          <SummaryChip label="Prompt Addition" value={promptAddition ? 'active' : 'none'} />
        </div>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1.8fr)_minmax(240px,1fr)] xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <Field label="Prompt" description="Anfrage für den Retrieval-Vergleich">
            <textarea
              rows={5}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full ci-input resize-y rounded-lg px-3 py-2 text-sm placeholder-[#756b62]/70"
              placeholder="Prompt eingeben..."
            />
          </Field>

          <div className="space-y-2 sm:space-y-3">
            <Field
              label="Knowledge Mode"
              description="Wie soll Wissen in die Antwort einfließen?"
            >
              <select
                value={knowledgeMode}
                onChange={(event) => setKnowledgeMode(event.target.value as LabKnowledgeMode)}
                className={selectCls}
              >
                <option value="docs_only">docs_only</option>
                <option value="docs_plus_model">docs_plus_model</option>
                <option value="search">search</option>
              </select>
            </Field>
            <Field label="Modellwissen als Fallback erlauben">
              <label className="flex items-center gap-2 text-sm text-[#756b62]">
                <input
                  type="checkbox"
                  checked={allowModelKnowledgeFallback}
                  onChange={(event) => setAllowModelKnowledgeFallback(event.target.checked)}
                  className="rounded border-[#2f2b26]/20 accent-[#2563eb]"
                />
                Aktiviert
              </label>
            </Field>
            <Field label="Prompt Addition Preview">
              <textarea
                rows={5}
                readOnly
                value={promptAddition || 'Kein zusätzlicher Prompt aus den Settings aktiv.'}
                className={`${inputCls} min-h-[100px] sm:min-h-[124px] resize-none font-mono text-[11px] sm:text-[12px]`}
              />
            </Field>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="py-2 -mx-2 px-2 sm:mx-0 sm:px-0 bg-white/95 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none">
          <p className="text-sm font-semibold text-[#2f2b26]">Varianten</p>
          <p className="text-xs text-zinc-500">
            Jede Variante bekommt eigene Retrieval-, Multi-Query- und Rerank-Einstellungen.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2">
          {variants.map((variant) => (
            <SettingsRetrievalLabVariantForm
              key={variant.id}
              draft={variant}
              canRemove={variants.length > 2}
              settings={settings}
              onChange={(patch) => updateVariant(variant.id, patch)}
              onRemove={() => removeVariant(variant.id)}
            />
          ))}
        </div>
      </div>

      {results && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-2 -mx-2 px-2 sm:mx-0 sm:px-0 bg-white/95 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#2f2b26]">Vergleichsergebnis</p>
              <p className="text-xs text-zinc-500">
                {results.results.length} Varianten side-by-side: Queries, Retrieval-Stages, finale
                Chunks und Antwort.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="rounded-full border border-[#2563eb]/25 bg-[#2563eb]/5 px-2.5 py-1 text-[#2563eb] whitespace-nowrap">
                {results.results.reduce((sum, r) => sum + r.durationMs, 0)} ms total
              </span>
              <button
                type="button"
                onClick={() => void handleCopyAll()}
                title={copiedAll === 'copied' ? 'Kopiert!' : copiedAll === 'error' ? 'Fehler' : 'Alle Ergebnisse als JSON kopieren'}
                className={[
                  'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
                  copiedAll === 'copied'
                    ? 'border-blue-500/60 text-blue-400'
                    : copiedAll === 'error'
                      ? 'border-rose-500/60 text-rose-300'
                      : 'border-[#2f2b26]/12 text-[#756b62] hover:border-[#f3aa7f]/45 hover:text-[#2f2b26]',
                ].join(' ')}
                aria-label="Alle Ergebnisse als JSON kopieren"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <rect x="9" y="9" width="11" height="11" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          </div>
          <div
            className={`grid gap-4 sm:gap-5 ${
              results.results.length === 2
                ? 'grid-cols-1 2xl:grid-cols-2'
                : results.results.length === 3
                  ? 'grid-cols-1 2xl:grid-cols-3'
                  : 'grid-cols-1 2xl:grid-cols-2'
            }`}
          >
            {results.results.map((result) => {
              const matchedVariant = variants.find((v) => v.label.trim() === result.label);
              return (
                <SettingsRetrievalLabResultCard
                  key={result.label}
                  result={result}
                  variantDraft={matchedVariant}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
