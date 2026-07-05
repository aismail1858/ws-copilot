import type { MouseEvent } from 'react';
import { resolveSourceHref } from '@/api/client';
import type { ChatUploadJob } from '@/chat/uploadJobs';
import { getUploadStatusLabel, inferProgress } from '../utils/chatHelpers';
import { UPLOAD_PROCESSING_STATUSES } from '../utils/chatConstants';
import { CircularProgressRing } from './CircularProgressRing';

interface SelectedUploadPreviewCardProps {
  preview: {
    filename: string;
    previewImageUrl: string;
    status: ChatUploadJob['status'] | 'uploading';
    progress: number;
    stage?: string;
    sourceUrl?: string;
  };
  onRemove: () => void;
  onOpen?: () => void;
}

export function SelectedUploadPreviewCard({
  preview,
  onRemove,
  onOpen,
}: SelectedUploadPreviewCardProps) {
  const progress = inferProgress(preview.status, preview.progress);
  const isUploading = preview.status === 'uploading';
  const isProcessing = UPLOAD_PROCESSING_STATUSES.includes(preview.status);
  const sourceHref = resolveSourceHref(preview.sourceUrl);
  const canOpen = Boolean(onOpen || sourceHref);

  const handleClick = () => {
    if (onOpen) {
      onOpen();
      return;
    }
    if (sourceHref) {
      window.open(sourceHref, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onRemove();
  };

  return (
    <div className="inline-flex items-center gap-2 px-0.5 py-1">
      <div
        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-[#2f2b26]/10"
        onClick={handleClick}
        title={canOpen ? 'Klicken zum Oeffnen' : undefined}
        style={canOpen ? { cursor: 'pointer' } : undefined}
      >
        <img
          src={preview.previewImageUrl}
          alt={`Vorschau ${preview.filename}`}
          className="h-full w-full object-cover"
        />
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#2f2b26]/45">
            {isUploading ? (
              <span className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <CircularProgressRing progress={progress} />
            )}
          </div>
        )}
        {canOpen && (
          <div className="absolute inset-0 bg-transparent">
            <div className="absolute inset-0 flex items-center justify-center bg-[#2f2b26]/35 opacity-0 transition-opacity group-hover:opacity-100">
              <svg className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 17 17 7M7 7h10v10"
                />
              </svg>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleRemove}
          className="absolute right-1 top-1 z-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#2f2b26]/75 text-white hover:bg-[#2f2b26]"
          title="Dokument aus Chat-Kontext entfernen"
          aria-label="Dokument entfernen"
        >
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 6l12 12M6 18L18 6"
            />
          </svg>
        </button>
      </div>
      <div className="min-w-0">
        <p className="max-w-[200px] truncate text-xs text-[#2f2b26]">{preview.filename}</p>
        <p
          className={[
            'text-[11px]',
            preview.status === 'completed'
              ? 'text-emerald-700'
              : preview.status === 'failed'
                ? 'text-red-600'
                : 'text-[#2f2b26]',
          ].join(' ')}
        >
          {getUploadStatusLabel(preview.status)}
        </p>
        {isProcessing && (
          <p className="text-[10px] text-[#756b62]">
            {isUploading
              ? preview.stage || 'Datei wird hochgeladen'
              : `${progress}% - ${preview.stage || 'Verarbeitung läuft'}`}
          </p>
        )}
      </div>
    </div>
  );
}
