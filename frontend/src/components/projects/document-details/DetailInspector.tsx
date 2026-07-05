import type { DocumentChunk } from "../../../lib/types";

interface DetailInspectorProps {
  chunk: DocumentChunk | null;
}

export default function DetailInspector({ chunk }: DetailInspectorProps) {
  if (!chunk) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        Select a chunk to inspect
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span>Chunk #{chunk.chunk_index}</span>
        <span>{chunk.char_count} chars</span>
        {chunk.page_number && <span>Page {chunk.page_number}</span>}
      </div>
      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
        {chunk.content}
      </p>
    </div>
  );
}
