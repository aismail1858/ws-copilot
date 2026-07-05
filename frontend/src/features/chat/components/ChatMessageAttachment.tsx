import type { ChatAttachment } from '@/types';

interface ChatMessageAttachmentProps {
  attachment: ChatAttachment;
  onOpen?: () => void;
}

export function ChatMessageAttachment({
  attachment,
  onOpen,
}: ChatMessageAttachmentProps) {
  const clickable = Boolean(onOpen);

  const body = (
    <div
      className={[
        'inline-flex min-w-0 items-center gap-3 rounded-2xl border border-[#2f2b26]/12 bg-white px-3 py-2 text-left',
        clickable ? 'hover:border-[#f3aa7f]/45 hover:bg-[#fff1e8]' : '',
      ].join(' ')}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fff1e8] text-[#2f2b26]">
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5A3.375 3.375 0 0 0 10.125 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
          />
        </svg>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-[#2f2b26]">{attachment.filename}</p>
        <p className="text-xs text-[#756b62]">
          {onOpen ? 'Im Panel öffnen' : clickable ? 'Anhang öffnen' : 'Anhang nicht verfügbar'}
        </p>
      </div>
    </div>
  );

  if (onOpen) {
    return (
      <button type="button" onClick={onOpen} className="inline-flex max-w-full text-left">
        {body}
      </button>
    );
  }

  return body;
}
