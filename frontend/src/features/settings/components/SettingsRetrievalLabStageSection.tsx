import type { ReactNode } from 'react';

export default function SettingsRetrievalLabStageSection({
  title,
  subtitle,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-xl border border-[#2f2b26]/10 bg-white transition-colors shadow-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-[#2f2b26]/[0.04] transition-colors">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-semibold text-[#2f2b26] truncate">{title}</p>
          <p className="text-[10px] sm:text-xs text-zinc-500 truncate">{subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {badge && (
            <span className="rounded-full border border-[#2563eb]/25 bg-[#2563eb]/5 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-[#2563eb] whitespace-nowrap">
              {badge}
            </span>
          )}
          <svg
            className="h-4 w-4 shrink-0 text-[#756b62] transition-transform group-open:rotate-180"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </summary>
      <div className="border-t border-[#2f2b26]/10 px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">{children}</div>
    </details>
  );
}
