import { useState } from "react";
import type { DocumentChunk } from "../../../lib/types";
import DetailInspector from "./DetailInspector";

interface ChunksViewerProps {
  chunks: DocumentChunk[];
}

export default function ChunksViewer({ chunks }: ChunksViewerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const sorted = [...chunks].sort((a, b) => a.chunk_index - b.chunk_index);
  const current = sorted[selectedIndex] || null;

  return (
    <div className="flex gap-4">
      <div className="w-40 shrink-0 space-y-1">
        {sorted.map((chunk, i) => (
          <button
            key={chunk.id}
            onClick={() => setSelectedIndex(i)}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors ${
              i === selectedIndex
                ? "bg-blue-100 text-blue-700 font-medium"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Chunk #{chunk.chunk_index}
            <span className="ml-2 text-slate-400">{chunk.char_count}c</span>
          </button>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <DetailInspector chunk={current} />
      </div>
    </div>
  );
}
