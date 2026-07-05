import { useState } from 'react';
import type { RagLabVariantResultResponse } from '@/api/client';
import SettingsRetrievalLabCandidateTable from '@/features/settings/components/SettingsRetrievalLabCandidateTable';
import SettingsRetrievalLabStageSection from '@/features/settings/components/SettingsRetrievalLabStageSection';
import type { VariantDraft } from '@/features/settings/components/SettingsRetrievalLabShared';
import { stripVariantSecrets } from '@/features/settings/components/SettingsRetrievalLabShared';

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toFixed(digits);
}

const pipelineSteps = ['Prompt', 'Expansion', 'Retrieval', 'Fusion', 'Rerank', 'Context', 'Answer'];

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#2f2b26]/10 bg-white p-2 sm:p-3 shadow-sm">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.16em] sm:tracking-[0.18em] text-zinc-500 truncate">{label}</p>
      <p className="mt-0.5 sm:mt-1 text-sm sm:text-base font-semibold text-[#2f2b26] truncate">{value}</p>
    </div>
  );
}

function CopyButton({ label, getJsonValue }: { label: string; getJsonValue: () => string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getJsonValue());
      setState('copied');
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = getJsonValue();
        ta.setAttribute('readonly', 'true');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setState('copied');
      } catch {
        setState('error');
      }
    }
    setTimeout(() => setState('idle'), 1600);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      title={state === 'copied' ? 'Kopiert!' : state === 'error' ? 'Fehler' : label}
      className={[
        'inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors',
        state === 'copied'
          ? 'border-blue-500/60 text-blue-400'
          : state === 'error'
            ? 'border-rose-500/60 text-rose-300'
            : 'border-[#2f2b26]/12 text-[#756b62] hover:border-[#f3aa7f]/45 hover:text-[#2f2b26]',
      ].join(' ')}
      aria-label={label}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

export default function SettingsRetrievalLabResultCard({
  result,
  variantDraft,
}: {
  result: RagLabVariantResultResponse;
  variantDraft?: VariantDraft;
}) {
  const rerankBadge = result.retrieval.rerank.enabled
    ? result.retrieval.rerank.applied
      ? result.retrieval.rerank.provider
      : 'fallback'
    : 'disabled';

  const buildVariantJson = () => {
    const payload: Record<string, unknown> = { result };
    if (variantDraft) {
      payload.variant = stripVariantSecrets(variantDraft);
    }
    return JSON.stringify(payload, null, 2);
  };

  return (
    <div className="ci-panel rounded-xl flex flex-col h-full">
      <div className="space-y-3 border-b border-[#2f2b26]/10 px-3 py-3 sm:space-y-4 sm:px-5 sm:py-5">
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="text-base sm:text-lg font-bold text-[#2f2b26]">{result.label}</p>
            <CopyButton label="JSON kopieren" getJsonValue={buildVariantJson} />
          </div>
          <p className="text-xs text-[#756b62] sm:text-sm">
            {result.llm.provider} / {result.llm.model}
          </p>
          <div className="flex flex-wrap gap-1.5 text-[10px] text-[#756b62] sm:gap-2 sm:text-[11px]">
            <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-2 py-1 sm:px-2.5">
              {result.durationMs} ms
            </span>
            <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-2 py-1 sm:px-2.5">
              {result.retrieval.queryVariants.length} queries
            </span>
            <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-2 py-1 sm:px-2.5">
              {result.retrieval.selection.selectedCount} chunks
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Min Score"
            value={formatNumber(result.effectiveSettings.retrievalMinScore)}
          />
          <MetricTile
            label="RRF-K"
            value={String(result.effectiveSettings.hybridFusionRrfK)}
          />
          <MetricTile
            label="Chunks"
            value={String(result.retrieval.selection.selectedCount)}
          />
          <MetricTile label="Reranker" value={rerankBadge} />
        </div>

        <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-1.5">
          {pipelineSteps.map((step, index) => (
            <span
              key={step}
              className={`rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] ${
                index === pipelineSteps.length - 1
                  ? 'border border-[#f3aa7f]/45 bg-[#fff1e8] text-[#2f2b26]'
                  : 'border border-[#2f2b26]/10 bg-white text-[#756b62]'
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4 p-3 sm:p-5 flex-1">
        <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Lexical Strategy"
            value={result.effectiveSettings.hybridLexicalStrategy}
          />
          <MetricTile
            label="Candidate Pool"
            value={String(result.effectiveSettings.hybridCandidatePoolSize)}
          />
          <MetricTile
            label="Weights"
            value={`${formatNumber(result.effectiveSettings.hybridVectorWeight, 1)} / ${formatNumber(result.effectiveSettings.hybridLexicalWeight, 1)}`}
          />
          <MetricTile label="Generation" value={`${result.telemetry.generationMs} ms`} />
        </div>

        <SettingsRetrievalLabStageSection
          title="Query Expansion"
          subtitle="Original- und Multi-Queries, die wirklich in den Retrieval-Pfad gegangen sind."
          badge={`${result.retrieval.queryVariants.length} queries`}
          defaultOpen={true}
        >
          <div className="space-y-3 sm:space-y-4">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {result.retrieval.queryVariants.map((query) => (
                <span
                  key={query}
                  className="rounded-full border border-[#2563eb]/25 bg-[#2563eb]/5 px-2 sm:px-3 py-1 sm:py-1.5 font-mono text-[10px] sm:text-[11px] text-[#2563eb]"
                >
                  {query}
                </span>
              ))}
            </div>
            <div className="grid gap-3 sm:gap-4 grid-cols-1">
              {result.retrieval.queryRuns.map((queryRun) => (
                <div key={queryRun.query} className="rounded-lg border border-[#2f2b26]/10 bg-white p-3 sm:p-4 shadow-sm">
                  <div className="mb-2 sm:mb-3 flex items-center justify-between gap-2 sm:gap-3">
                    <p className="font-mono text-xs sm:text-sm text-[#2f2b26] truncate">{queryRun.query}</p>
                    <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] text-[#756b62] whitespace-nowrap">
                      {queryRun.candidateCount} chunks
                    </span>
                  </div>
                  <SettingsRetrievalLabCandidateTable
                    candidates={queryRun.candidates}
                    emptyLabel="Keine Retrieval-Kandidaten für diese Query."
                  />
                  </div>
                  ))}
                  </div>
                  </div>
                  </SettingsRetrievalLabStageSection>

                  <SettingsRetrievalLabStageSection
                  title="Fusion"
                  subtitle="Deduped Kandidaten nach Query-Fusion. Hier wird sichtbar, welche Query einen Chunk hochgezogen hat."
                  badge={`${result.retrieval.fusion.candidateCount} fused`}
                  defaultOpen={false}
                  >
                  <SettingsRetrievalLabCandidateTable
                  candidates={result.retrieval.fusion.candidates}
                  emptyLabel="Keine fusionierten Kandidaten vorhanden."
                  showQueries
                  />
                  </SettingsRetrievalLabStageSection>

                  <SettingsRetrievalLabStageSection
                  title="Rerank"
                  subtitle="Vorher/Nachher-Ranks und Fallback-Status des Rerankers."
                  badge={`${result.retrieval.rerank.outputCount}/${result.retrieval.rerank.inputCount}`}
                  defaultOpen={false}
                  >
                  <div className="mb-2 flex flex-wrap gap-1.5 text-[10px] text-[#756b62] sm:mb-3 sm:gap-2 sm:text-[11px]">
                  <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-1.5 py-1 sm:px-2">
                  enabled: {result.retrieval.rerank.enabled ? 'yes' : 'no'}
                  </span>
                  <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-1.5 py-1 sm:px-2">
                  applied: {result.retrieval.rerank.applied ? 'yes' : 'no'}
                  </span>
                  <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-1.5 py-1 sm:px-2">
                  {result.retrieval.rerank.provider} / {result.retrieval.rerank.model}
                  </span>
                  {result.retrieval.rerank.fallbackReason && (
                  <span className="rounded-full border border-orange-600/25 bg-orange-50 px-1.5 py-1 text-orange-700 sm:px-2">
                  {result.retrieval.rerank.fallbackReason}
                  </span>
                  )}
                  </div>
                  <SettingsRetrievalLabCandidateTable
                  candidates={result.retrieval.rerank.candidates}
                  emptyLabel="Keine Rerank-Daten vorhanden."
                  showQueries
                  showRankMovement
                  />
                  </SettingsRetrievalLabStageSection>

                  <SettingsRetrievalLabStageSection
                  title="Final Context"
                  subtitle="Diese Chunks wurden nach Threshold- und Relevanzprüfung an die Antwortgenerierung weitergereicht."
                  badge={`${result.retrieval.selection.selectedCount} selected`}
                  >
                  <div className="space-y-3 sm:space-y-4">
                  <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricTile label="Selected" value={String(result.retrieval.selection.selectedCount)} />
                  <MetricTile label="Rejected" value={String(result.retrieval.selection.rejectedCount)} />
                  <MetricTile label="No-Overlap Floor" value={formatNumber(result.retrieval.nonOverlapFloor)} />
                  <MetricTile label="Context Size" value={`${result.retrieval.contextCharCount} chars`} />
                  </div>
                  <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Selected Chunks
                  </p>
                  <SettingsRetrievalLabCandidateTable
                  candidates={result.retrieval.selection.selectedChunks}
                  emptyLabel="Keine Chunks wurden in den finalen Kontext aufgenommen."
                  showQueries
                  showSelection
                  />
                  </div>
                  <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Rejected Chunks
                  </p>
                  <SettingsRetrievalLabCandidateTable
                  candidates={result.retrieval.selection.rejectedChunks}
                  emptyLabel="Keine Chunks wurden verworfen."
                  showQueries
                  showSelection
                  />            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700 sm:text-xs sm:tracking-[0.18em]">
                Context Preview
              </p>
              <pre className="overflow-auto whitespace-pre-wrap font-mono text-[10px] sm:text-xs text-[#2f2b26] max-h-[200px] sm:max-h-[300px]">
                {result.retrieval.selection.contextPreview || 'Kein Kontext.'}
              </pre>
            </div>
            <div className="rounded-lg border border-[#2f2b26]/10 bg-white p-4 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-zinc-500">
                Final Sources
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {result.retrieval.sources.length > 0 ? (
                  result.retrieval.sources.map((source) => (
                    <span
                      key={`${source.documentId}-${source.chunkIndex ?? source.title}`}
                      className="rounded-full border border-[#2563eb]/25 bg-[#2563eb]/5 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-[11px] text-[#2563eb]"
                    >
                      {source.title}
                    </span>
                  ))
                ) : (
                  <span className="text-xs sm:text-sm text-zinc-500">Keine deduplizierten Quellen vorhanden.</span>
                )}
              </div>
            </div>
          </div>
        </SettingsRetrievalLabStageSection>

        <SettingsRetrievalLabStageSection
          title="Answer"
          subtitle="Finale Antwort plus System-Prompt-Vorschau und No-Context-Entscheidung."
          badge={result.answer.ok ? 'ok' : 'error'}
        >
          <div className="space-y-3 sm:space-y-4">
            <div
              className={`rounded-lg border p-3 sm:p-4 text-xs sm:text-sm whitespace-pre-wrap ${
                result.answer.ok
                  ? 'border-emerald-200 bg-emerald-50 text-[#2f2b26]'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {result.answer.text || result.answer.error || 'Keine Antwort'}
            </div>
            <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              <MetricTile label="Expansion" value={`${result.telemetry.expansionMs} ms`} />
              <MetricTile label="Retrieval" value={`${result.telemetry.retrievalMs} ms`} />
              <MetricTile label="Selection" value={`${result.telemetry.selectionMs} ms`} />
              <MetricTile label="No Context" value={result.generation.noContextDecision || 'none'} />
            </div>
            <div className="rounded-lg border border-[#2f2b26]/10 bg-white p-3 sm:p-4 shadow-sm">
              <p className="mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-zinc-500">
                System Prompt Preview
              </p>
              <pre className="overflow-auto whitespace-pre-wrap font-mono text-[10px] sm:text-xs text-[#2f2b26] max-h-[200px] sm:max-h-[300px]">
                {result.generation.systemPromptPreview || 'Kein System-Prompt verfügbar.'}
              </pre>
            </div>
            {result.generation.promptAddition && (
              <div className="rounded-lg border border-[#2f2b26]/10 bg-white p-3 sm:p-4 shadow-sm">
                <p className="mb-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-zinc-500">
                  Prompt Addition
                </p>
                <pre className="overflow-auto whitespace-pre-wrap font-mono text-[10px] sm:text-xs text-[#2f2b26] max-h-[150px] sm:max-h-[200px]">
                  {result.generation.promptAddition}
                </pre>
              </div>
            )}
          </div>
        </SettingsRetrievalLabStageSection>
      </div>
    </div>
  );
}
