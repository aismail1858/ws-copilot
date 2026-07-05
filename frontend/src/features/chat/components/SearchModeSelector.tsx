// Search mode selector component for speed/balanced/quality toggle

import type { SearchMode } from '@/types';
import { SEARCH_MODE_OPTIONS } from '../utils/chatConstants';

interface SearchModeSelectorProps {
  mode: SearchMode;
  onChange: (next: SearchMode) => void;
}

export function SearchModeSelector({ mode, onChange }: SearchModeSelectorProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-[#2f2b26]/10 bg-transparent p-1">
      {SEARCH_MODE_OPTIONS.map((option) => {
        const selected = mode === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            title={option.title}
            className={[
              'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
              selected
                ? 'bg-[#fff1e8] text-[#2f2b26] shadow-[inset_0_0_0_1px_rgba(243,170,127,0.30)]'
                : 'text-[#756b62] hover:bg-[#2f2b26]/[0.04] hover:text-[#2f2b26]',
            ].join(' ')}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
