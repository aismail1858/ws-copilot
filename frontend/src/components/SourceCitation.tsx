import type { Source } from '@/types';

interface Props {
  source: Source;
  onClick?: () => void;
}

export default function SourceCitation({ source, onClick }: Props) {
  const label = source.title || source.documentName || source.filename || 'Quelle';
  const href = source.url;

  const inner = (
    <>
      <svg
        className="h-3.5 w-3.5 shrink-0 text-[#756b62]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
        />
      </svg>
      <span className="truncate">{label}</span>
      {(onClick || href) && (
        <svg
          className="h-3 w-3 shrink-0 text-[#756b62] group-hover:text-[#2f2b26]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 20.25h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5"
          />
        </svg>
      )}
    </>
  );

  const className = "group inline-flex max-w-[280px] items-center gap-2 rounded-full border border-[#2f2b26]/12 bg-white px-3 py-2 text-xs text-[#2f2b26] shadow-[0_1px_4px_rgba(47,43,38,0.06),0_4px_12px_rgba(47,43,38,0.04)] transition-colors hover:border-[#f3aa7f]/45 hover:bg-[#fff1e8] hover:shadow-[0_2px_6px_rgba(243,170,127,0.12),0_6px_16px_rgba(243,170,127,0.08)]";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <span className="inline-flex max-w-[280px] items-center gap-2 rounded-full border border-[#2f2b26]/12 bg-white px-3 py-2 text-xs text-[#2f2b26] shadow-[0_1px_4px_rgba(47,43,38,0.06),0_4px_12px_rgba(47,43,38,0.04)]">
      {inner}
    </span>
  );
}
