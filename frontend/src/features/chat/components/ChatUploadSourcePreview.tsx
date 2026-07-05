import { resolveSourceHref } from '@/api/client';
import type { Source } from '@/types';

interface ChatUploadSourcePreviewProps {
  source: Source;
}

export function ChatUploadSourcePreview({
  source,
}: ChatUploadSourcePreviewProps) {
  const href = resolveSourceHref(source.url, source);

  // Append #toolbar=0 to hide Chrome's native PDF viewer toolbar
  const viewerHref = href ? `${href}#toolbar=0` : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[#2f2b26]/10 px-4 py-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#756b62]">Ephemerer Upload</p>
          <p className="text-xs text-[#756b62]">Direkt aus dem aktiven Chat-Kontext.</p>
        </div>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center rounded-full border border-[#2f2b26]/12 px-3 py-1.5 text-xs text-[#756b62] hover:border-[#f3aa7f]/45 hover:text-[#2f2b26]"
          >
            Original öffnen
          </a>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden bg-white">
        {viewerHref ? (
          <object data={viewerHref} className="h-full w-full bg-white" aria-label={source.title}>
            <UnavailablePreview href={href} />
          </object>
        ) : (
          <UnavailablePreview />
        )}
      </div>
    </div>
  );
}

function UnavailablePreview({ href }: { href?: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-[#2f2b26]/12 bg-white px-4 py-4 text-sm text-[#756b62]">
        <p>Dieses Dokument kann hier nicht inline angezeigt werden.</p>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-full border border-[#2f2b26]/12 px-3 py-1.5 text-xs text-[#756b62] hover:border-[#f3aa7f]/45 hover:text-[#2f2b26]"
          >
            Original öffnen
          </a>
        )}
      </div>
    </div>
  );
}
