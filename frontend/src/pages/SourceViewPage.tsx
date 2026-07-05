import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiClient } from "../lib/api";

interface Chunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  original_content: Record<string, unknown>;
  type: string[];
  page_number: number | null;
  char_count: number | null;
  created_at: string;
}

interface Document {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  created_at: string;
}

export default function SourceViewPage() {
  const { projectId, documentId } = useParams();
  const [doc, setDoc] = useState<Document | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (projectId && documentId) {
      fetchDocumentAndChunks(projectId, documentId);
    }
  }, [projectId, documentId]);

  async function fetchDocumentAndChunks(pid: string, did: string) {
    setLoading(true);
    setError("");
    try {
      const fileRes = await apiClient.get<{ data: Document[] }>(`/api/projects/${pid}/files`);
      const found = (fileRes.data || []).find((f) => f.id === did);
      setDoc(found || null);

      const chunkRes = await apiClient.get<{ data: Chunk[] }>(`/api/projects/${pid}/files/${did}/chunks`);
      setChunks(chunkRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Laden des Dokuments");
    } finally {
      setLoading(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function getTypeBadges(types: string[]) {
    const colors: Record<string, string> = {
      text: "bg-blue-100 text-blue-800",
      table: "bg-purple-100 text-purple-800",
      image: "bg-green-100 text-green-800",
    };
    return types.map((t) => (
      <span key={t} className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${colors[t] || "bg-gray-100 text-gray-800"}`}>
        {t}
      </span>
    ));
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-0 bg-transparent select-text">
        <p className="text-sm text-[#756b62]">Lade Chunks...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-0 bg-transparent select-text">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-600">{error}</p>
          <Link to="/sources" className="text-sm underline underline-offset-2 text-[#756b62] hover:text-[#2f2b26]">
            Zurück zu den Quellen
          </Link>
        </div>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-0 bg-transparent select-text">
        <div className="text-center space-y-4">
          <p className="text-sm text-[#756b62]">Dokument nicht gefunden.</p>
          <Link to="/sources" className="text-sm underline underline-offset-2 text-[#756b62] hover:text-[#2f2b26]">
            Zurück zu den Quellen
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 min-h-0 bg-transparent select-text overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/sources" className="text-[#756b62] hover:text-[#2f2b26] transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-light tracking-[-0.035em] text-[#2f2b26]">{doc.filename}</h1>
            <p className="text-sm text-[#756b62]">
              {formatFileSize(doc.file_size)} &middot; {doc.file_type} &middot; {chunks.length} Chunks &middot; {new Date(doc.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {chunks.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-sm text-[#756b62]">Keine Chunks für dieses Dokument. Möglicherweise wird es noch verarbeitet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="rounded-xl border border-[#e5dfd9] bg-white px-4 py-3 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#756b62]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#2f2b26]">Chunk #{chunk.chunk_index}</span>
                    {chunk.page_number != null && <span>Seite {chunk.page_number}</span>}
                    {chunk.char_count != null && <span>{chunk.char_count} Zeichen</span>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getTypeBadges(chunk.type)}
                  </div>
                </div>
                <pre className="text-sm text-[#2f2b26] whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
                  {chunk.content}
                </pre>
                {chunk.original_content && Object.keys(chunk.original_content).length > 0 && (
                  <details className="text-xs text-[#756b62]">
                    <summary className="cursor-pointer hover:text-[#2f2b26]">Originalinhalt anzeigen</summary>
                    <pre className="mt-2 text-xs text-[#2f2b26] whitespace-pre-wrap font-sans bg-[#f8f6f4] rounded-lg p-3 max-h-64 overflow-y-auto">
                      {JSON.stringify(chunk.original_content, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
