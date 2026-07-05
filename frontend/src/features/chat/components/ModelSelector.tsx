// Modellselektor (Chat): schlanke Auswahl über aktivierte app_models (purpose=chat).
// Ersatz für das frühere Multi-Provider-UI;wahl fließt via chat/selectedModel in den Stream.

import { useState, useEffect, useRef, useMemo } from 'react';
import { useChatModels } from '../hooks/useChatModels';

export function ModelSelector() {
  const { models, selectedModelId, selectModel } = useChatModels();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? models.filter((m) => `${m.label} ${m.model_id}`.toLowerCase().includes(q))
      : models;
  }, [models, query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const selected = models.find((m) => m.model_id === selectedModelId);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={models.length === 0}
        className="flex items-center gap-1.5 rounded-xl border border-[#2f2b26]/10 bg-transparent px-2.5 py-1.5 text-xs text-[#756b62] transition-colors hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26] disabled:cursor-not-allowed disabled:opacity-50"
        title={selected?.model_id || 'Modell wählen'}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
        <span className="max-w-[180px] truncate font-medium">
          {selected?.label || 'Modell wählen'}
        </span>
        <svg
          className={`w-3 h-3 text-[#756b62] transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.53 16.28a.75.75 0 0 1-1.06 0l-7.5-7.5a.75.75 0 0 1 1.06-1.06L12 14.69l6.97-6.97a.75.75 0 1 1 1.06 1.06l-7.5 7.5Z" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-2 w-64 overflow-hidden rounded-2xl border border-[#2f2b26]/10 bg-white shadow-2xl shadow-[#2f2b26]/12 z-50">
          <div className="p-2 border-b border-[#2f2b26]/10">
            <input
              type="text"
              autoFocus
              placeholder="Modell suchen..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ci-input w-full rounded-lg py-1.5 px-2 text-[11px] placeholder:text-[#756b62]/70"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1.5">
            {filtered.map((m) => {
              const isSel = m.model_id === selectedModelId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    selectModel(m.model_id);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11px] transition-colors ${
                    isSel
                      ? 'text-[#2f2b26]'
                      : 'text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]'
                  }`}
                >
                  <span className="truncate">{m.label}</span>
                  {isSel && (
                    <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-2 py-3 text-center text-[11px] text-[#756b62]">Keine Modelle</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
