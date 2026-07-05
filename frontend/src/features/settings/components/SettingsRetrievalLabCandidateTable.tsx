import type { RagLabCandidateResponse } from '@/api/client';

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '-';
  return value.toFixed(digits);
}

function formatRankMovement(candidate: RagLabCandidateResponse) {
  if (candidate.rankBeforeRerank == null || candidate.rankAfterRerank == null) return '-';
  const delta = candidate.rankDelta ?? 0;
  const deltaLabel = delta === 0 ? '0' : delta > 0 ? `+${delta}` : `${delta}`;
  return `${candidate.rankBeforeRerank} -> ${candidate.rankAfterRerank} (${deltaLabel})`;
}

export default function SettingsRetrievalLabCandidateTable({
  candidates,
  emptyLabel,
  showSelection = false,
  showQueries = false,
  showRankMovement = false,
}: {
  candidates: RagLabCandidateResponse[];
  emptyLabel: string;
  showSelection?: boolean;
  showQueries?: boolean;
  showRankMovement?: boolean;
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#2f2b26]/15 bg-white px-3 sm:px-4 py-4 sm:py-6 text-xs sm:text-sm text-[#756b62] shadow-sm">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="-mx-2 overflow-x-auto rounded-lg border border-[#2f2b26]/10 shadow-sm sm:mx-0">
      <table className="w-full text-left text-[10px] text-[#2f2b26] sm:text-xs">
        <thead className="bg-[#fffaf3] text-[#756b62]">
          <tr>
            <th className="px-2 sm:px-3 py-2 w-10 sm:w-12">#</th>
            <th className="px-2 sm:px-3 py-2">Chunk</th>
            <th className="px-2 sm:px-3 py-2 w-14 sm:w-16">Score</th>
            <th className="px-2 sm:px-3 py-2 w-14 sm:w-16">Vector</th>
            <th className="px-2 sm:px-3 py-2 w-14 sm:w-16">Lexical</th>
            <th className="px-2 sm:px-3 py-2 w-14 sm:w-16">Rerank</th>
            {showQueries && <th className="px-2 sm:px-3 py-2 w-40 sm:w-48">Queries</th>}
            {showRankMovement && <th className="px-2 sm:px-3 py-2 w-20 sm:w-24">Rank Delta</th>}
            {showSelection && <th className="px-2 sm:px-3 py-2 w-20 sm:w-24">Status</th>}
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr
              key={`${candidate.documentId}-${candidate.chunkIndex ?? candidate.title}-${candidate.rank ?? 0}`}
              className="border-t border-[#2f2b26]/10 align-top"
            >
              <td className="px-2 sm:px-3 py-1.5 sm:py-2 text-zinc-500">{candidate.rank ?? '-'}</td>
              <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                <div className="space-y-1">
                  <div className="font-medium text-[#2f2b26] text-[10px] sm:text-xs">{candidate.title}</div>
                  <div className="text-[10px] text-zinc-500 sm:text-xs">{candidate.excerpt}</div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-[11px] text-zinc-500">
                    <span>doc {candidate.documentId}</span>
                    <span>chunk {candidate.chunkIndex ?? '-'}</span>
                    {candidate.pageNo != null && <span>page {candidate.pageNo}</span>}
                    {candidate.filename && <span>{candidate.filename}</span>}
                  </div>
                </div>
              </td>
              <td className="px-2 sm:px-3 py-1.5 sm:py-2">{formatNumber(candidate.score)}</td>
              <td className="px-2 sm:px-3 py-1.5 sm:py-2">{formatNumber(candidate.vectorScore)}</td>
              <td className="px-2 sm:px-3 py-1.5 sm:py-2">{formatNumber(candidate.lexicalScore)}</td>
              <td className="px-2 sm:px-3 py-1.5 sm:py-2">{formatNumber(candidate.rerankScore)}</td>
              {showQueries && (
                <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                  <div className="flex max-w-[200px] sm:max-w-[280px] flex-wrap gap-1 sm:gap-1.5">
                    {candidate.sourceQueries.length > 0 ? (
                      candidate.sourceQueries.map((query) => (
                        <span
                          key={query}
                          className="rounded-full border border-[#2563eb]/25 bg-[#2563eb]/5 px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] text-[#2563eb]"
                        >
                          {query}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-500">-</span>
                    )}
                  </div>
                </td>
              )}
              {showRankMovement && <td className="px-2 sm:px-3 py-1.5 sm:py-2">{formatRankMovement(candidate)}</td>}
              {showSelection && (
                <td className="px-2 sm:px-3 py-1.5 sm:py-2">
                  {candidate.selected ? (
                    <span className="rounded-full border border-emerald-600/25 bg-emerald-50 px-1.5 py-1 text-[10px] text-emerald-700 sm:px-2 sm:text-[11px]">
                      selected
                    </span>
                  ) : (
                    <span className="rounded-full border border-[#2f2b26]/10 bg-[#fffaf3] px-1.5 sm:px-2 py-1 text-[10px] sm:text-[11px] text-[#756b62]">
                      {candidate.selectionReason || 'rejected'}
                    </span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
