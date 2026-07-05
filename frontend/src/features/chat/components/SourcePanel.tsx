import { SourcePrivacyView } from '@/components/SourcePrivacyView';
import { SourceDocumentOriginalPreview } from '@/features/sources/components/SourceDocumentOriginalPreview';
import { useSourceDocumentData } from '@/features/sources/hooks/useSourceDocumentData';
import type { Source } from '@/types';

interface SourcePanelProps {
  activeSource: Source | null;
  sourcePanelWidth: number;
  isResizingSourcePanel: boolean;
  onClose: () => void;
  onResizeStart: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function SourcePanel({
  activeSource,
  sourcePanelWidth,
  isResizingSourcePanel,
  onClose,
  onResizeStart,
}: SourcePanelProps) {
  if (!activeSource) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 z-30 bg-[#2f2b26]/20 backdrop-blur-sm lg:hidden"
        aria-label="Quellenpanel schliessen"
      />
      <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-2xl flex-col bg-white shadow-2xl shadow-[#2f2b26]/12 lg:hidden">
        <SourcePanelHeader activeSource={activeSource} onClose={onClose} />
        <SourcePanelBody activeSource={activeSource} />
      </aside>
      <aside
        className="absolute inset-y-0 right-0 z-20 hidden flex-col bg-white shadow-2xl shadow-[#2f2b26]/12 lg:flex"
        style={{ width: `${sourcePanelWidth}px` }}
      >
        {isResizingSourcePanel && (
          <div className="absolute inset-0 z-20 cursor-col-resize bg-transparent" aria-hidden="true" />
        )}
        <button
          type="button"
          onMouseDown={onResizeStart}
          className="group absolute inset-y-0 left-0 z-10 w-4 cursor-col-resize bg-transparent outline-none"
          aria-label="Quellenpanel-Breite ändern"
        >
          <span
            className={[
              'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors',
              isResizingSourcePanel ? 'bg-[#f3aa7f]' : 'bg-transparent group-hover:bg-[#f3aa7f]',
            ].join(' ')}
          />
        </button>
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <SourcePanelHeader activeSource={activeSource} onClose={onClose} />
          <SourcePanelBody activeSource={activeSource} />
        </div>
      </aside>
    </>
  );
}

function SourcePanelBody({ activeSource }: { activeSource: Source }) {
  if (activeSource.documentId) {
    return <DocumentPreviewBody source={activeSource} />;
  }

  const details = buildSourceDetails(activeSource);

  return (
    <SourcePrivacyView
      heading="Quelle im Chat"
      title={activeSource.title || activeSource.documentName || activeSource.filename || 'Quelle'}
      secondaryLabel={resolveSecondaryLabel(activeSource)}
      badges={buildSourceBadges(activeSource)}
      details={details}
      note="Der Quelleninhalt wird im Chat-Viewer nicht offen angezeigt. Sichtbar bleiben nur Herkunft und Referenz-Metadaten."
    />
  );
}

function DocumentPreviewBody({ source }: { source: Source }) {
  const { document, chunks, isLoading, error, original } = useSourceDocumentData(source.documentId);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-[#756b62]">Dokument wird geladen...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <p className="text-sm text-[#756b62]">Dokument nicht gefunden.</p>
      </div>
    );
  }

  return (
    <SourceDocumentOriginalPreview
      document={document}
      chunks={chunks}
      originalUrl={original.url}
      originalContentType={original.contentType}
      originalFilename={original.filename}
      originalError={original.error}
      focusExcerpt={source.excerpt || ''}
      focusChunkIndex={source.chunkIndex ?? null}
      resolvedFocusPageNo={source.pageNo ?? null}
      mode="document_only"
    />
  );
}

function SourcePanelHeader({
  activeSource,
  onClose,
}: {
  activeSource: Source | null;
  onClose: () => void;
}) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-[#2f2b26]/10 px-4">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#756b62]">Quelle im Chat</p>
        <h2 className="truncate text-sm text-[#2f2b26]">{activeSource?.title || 'Quelle'}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#2f2b26]/12 text-[#756b62] hover:border-[#f3aa7f]/45 hover:text-[#2f2b26]"
        aria-label="Quellenpanel schliessen"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
        </svg>
      </button>
    </div>
  );
}

function buildSourceBadges(source: Source): string[] {
  const badges: string[] = [];

  if (source.documentId.startsWith('chat-upload:')) {
    badges.push('Chat-Upload');
  }
  if (source.modality === 'image_summary') {
    badges.push('Bild');
  }
  if (typeof source.pageNo === 'number' && source.pageNo > 0) {
    badges.push(`Seite ${source.pageNo}`);
  }
  if (typeof source.chunkIndex === 'number' && source.chunkIndex >= 0) {
    badges.push(`Chunk ${source.chunkIndex}`);
  }
  if (source.hitCount && source.hitCount > 1) {
    badges.push(`${source.hitCount} Chunks`);
  }

  return badges;
}

function buildSourceDetails(source: Source): Array<{ label: string; value: string }> {
  const details: Array<{ label: string; value: string }> = [];
  const filename = (source.filename || '').trim();
  const documentName = (source.documentName || '').trim();
  const url = (source.url || '').trim();

  if (filename) {
    details.push({ label: 'Datei', value: filename });
  }
  if (documentName && documentName.toLowerCase() !== filename.toLowerCase()) {
    details.push({ label: 'Dokument', value: documentName });
  }
  if (url) {
    details.push({ label: 'Referenz', value: url });
  }

  return details;
}

function resolveSecondaryLabel(source: Source): string | null {
  const candidate = (source.documentName || source.filename || '').trim();
  if (!candidate) {
    return null;
  }
  const title = (source.title || '').trim();
  if (title && title.toLowerCase() === candidate.toLowerCase()) {
    return null;
  }
  return candidate;
}
