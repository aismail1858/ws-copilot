import { useEffect, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { apiClient } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import FileDetailsModal from "../components/projects/FileDetailsModal";
import type { DocumentChunk } from "../lib/types";

interface Project {
  id: string;
  name: string;
}

interface ProcessingDetails {
  partitioning?: { elements_found?: unknown };
  chunking?: { total_chunks?: number };
  summarising?: { current_chunk?: number; total_chunks?: number };
  [key: string]: unknown;
}

interface Document {
  id: string;
  project_id: string | null;
  filename: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  processing_details: ProcessingDetails | null;
  created_at: string;
  updated_at: string;
  task_id: string | null;
  visibility?: string;
  team_id?: string | null;
}

const statusConfig: Record<string, { label: string; color: string; animate?: boolean }> = {
  pending:      { label: "Ausstehend",    color: "bg-yellow-100 text-yellow-800" },
  queued:       { label: "Warteschlange", color: "bg-blue-100 text-blue-800", animate: true },
  processing:   { label: "Processing",    color: "bg-purple-100 text-purple-800", animate: true },
  partitioning: { label: "Partitioning",  color: "bg-sky-100 text-sky-800", animate: true },
  chunking:     { label: "Chunking",      color: "bg-indigo-100 text-indigo-800", animate: true },
  summarising:  { label: "Summarising",   color: "bg-violet-100 text-violet-800", animate: true },
  vectorization:{ label: "Vectorization", color: "bg-pink-100 text-pink-800", animate: true },
  completed:    { label: "Fertig",        color: "bg-green-100 text-green-800" },
  failed:       { label: "Fehlgeschlagen",color: "bg-red-100 text-red-800" },
};

function generateMockData(): { projects: Project[]; docsByProject: Record<string, Document[]> } {
  const projects: Project[] = [
    { id: "p1", name: "Wissensdatenbank HR" },
    { id: "p2", name: "Produktdokumentation" },
  ];
  const docsByProject: Record<string, Document[]> = {
    p1: [
      { id: "d1", project_id: "p1", filename: "Mitarbeiterhandbuch_2026.pdf", file_type: "application/pdf", file_size: 2_456_000, processing_status: "completed", processing_details: { partitioning: { elements_found: 142 }, chunking: { total_chunks: 28 }, summarising: { current_chunk: 28, total_chunks: 28 } }, created_at: "2026-07-03T09:15:00Z", updated_at: "2026-07-03T09:15:00Z", task_id: "t1" },
      { id: "d2", project_id: "p1", filename: "Betriebsvereinbarungen_2026.docx", file_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", file_size: 892_000, processing_status: "summarising", processing_details: { partitioning: { elements_found: 67 }, chunking: { total_chunks: 14 }, summarising: { current_chunk: 8, total_chunks: 14 } }, created_at: "2026-07-04T08:00:00Z", updated_at: "2026-07-04T08:00:00Z", task_id: "t2" },
      { id: "d3", project_id: "p1", filename: "Datenschutzrichtlinie.pdf", file_type: "application/pdf", file_size: 1_200_000, processing_status: "chunking", processing_details: { partitioning: { elements_found: 89 }, chunking: { total_chunks: 0 } }, created_at: "2026-07-04T09:30:00Z", updated_at: "2026-07-04T09:30:00Z", task_id: "t3" },
      { id: "d4", project_id: "p1", filename: "Onboarding_Checkliste.txt", file_type: "text/plain", file_size: 45_000, processing_status: "failed", processing_details: null, created_at: "2026-07-02T14:00:00Z", updated_at: "2026-07-02T14:00:00Z", task_id: null },
    ],
    p2: [
      { id: "d5", project_id: "p2", filename: "API_Dokumentation_v3.pdf", file_type: "application/pdf", file_size: 3_200_000, processing_status: "completed", processing_details: { partitioning: { elements_found: 215 }, chunking: { total_chunks: 42 }, summarising: { current_chunk: 42, total_chunks: 42 } }, created_at: "2026-07-01T10:00:00Z", updated_at: "2026-07-01T10:00:00Z", task_id: "t4" },
      { id: "d6", project_id: "p2", filename: "Architekturuebersicht.pptx", file_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", file_size: 5_800_000, processing_status: "vectorization", processing_details: { partitioning: { elements_found: 180 }, chunking: { total_chunks: 35 }, summarising: { current_chunk: 35, total_chunks: 35 } }, created_at: "2026-07-04T07:00:00Z", updated_at: "2026-07-04T07:00:00Z", task_id: "t5" },
      { id: "d7", project_id: "p2", filename: "README.md", file_type: "text/markdown", file_size: 12_000, processing_status: "partitioning", processing_details: { partitioning: { elements_found: 0 } }, created_at: "2026-07-04T10:00:00Z", updated_at: "2026-07-04T10:00:00Z", task_id: "t6" },
      { id: "d8", project_id: "p2", filename: "Changelog_v3.1.md", file_type: "text/markdown", file_size: 8_500, processing_status: "pending", processing_details: null, created_at: "2026-07-04T10:05:00Z", updated_at: "2026-07-04T10:05:00Z", task_id: null },
    ],
  };
  return { projects, docsByProject };
}

const mockChunksByDoc: Record<string, DocumentChunk[]> = {
  d1: [
    { id: "c1", content: "1.1 Allgemeine Grundsaetze\nDie Firma [Name] legt grossen Wert auf ein respektvolles und wertschaetzendes Miteinander. Dieses Mitarbeiterhandbuch dient als verbindliche Grundlage fuer alle Beschaeftigten.", chunk_index: 0, page_number: 1, char_count: 182 },
    { id: "c2", content: "1.2 Arbeitszeitregelung\nDie regulaere Arbeitszeit betraegt 40 Stunden pro Woche. Kernarbeitszeit ist von 9:00 bis 15:00 Uhr. Flexible Arbeitszeitgestaltung ist nach Absprache mit der Fuehrungskraft moeglich.", chunk_index: 1, page_number: 2, char_count: 198 },
    { id: "c3", content: "1.3 Urlaubsanspruch\nJeder Mitarbeiter hat Anspruch auf 30 Werktage Urlaub pro Kalenderjahr. Die Urlaubsplanung erfolgt in Abstimmung mit dem Team und der Fuehrungskraft.", chunk_index: 2, page_number: 3, char_count: 165 },
    { id: "c4", content: "Tabelle: Gehaltsstufen\n| Stufe | Mindestgehalt | Regelgehalt |\n|-------|--------------|------------|\n| E1    | 32.000       | 36.000     |\n| E2    | 38.000       | 44.000     |\n| E3    | 45.000       | 52.000     |", chunk_index: 3, page_number: 4, char_count: 145 },
  ],
  d5: [
    { id: "c5", content: "GET /api/projects\nReturns a list of all projects accessible to the current user.\n\nResponse:\n```json\n{ \"data\": [{ \"id\": \"...\", \"name\": \"...\" }] }\n```", chunk_index: 0, page_number: 1, char_count: 156 },
    { id: "c6", content: "POST /api/projects/{project_id}/files/upload-url\nGenerates a presigned S3 URL for uploading a file.\n\nRequest body:\n```json\n{ \"filename\": \"...\", \"file_type\": \"...\", \"file_size\": 1234 }\n```", chunk_index: 1, page_number: 2, char_count: 198 },
    { id: "c7", content: "POST /api/projects/{project_id}/files/confirm\nConfirms a file upload and triggers the ingestion pipeline via Celery.", chunk_index: 2, page_number: 3, char_count: 132 },
  ],
};

export default function IngestionPage() {
  const { user } = useAuth();
  const isAdmin = user?.tier === "admin";
  const [globalUpload, setGlobalUpload] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [docsByProject, setDocsByProject] = useState<Record<string, Document[]>>({});
  const [globalDocs, setGlobalDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const hasActiveJobs = Object.values(docsByProject).some((docs) =>
    docs.some((d) => d.processing_status !== "completed" && d.processing_status !== "failed")
  );

  useEffect(() => {
    fetchData();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (hasActiveJobs) {
      intervalRef.current = setInterval(fetchData, 4000);
    }
  }, [hasActiveJobs]);

  async function fetchData() {
    setError("");
    try {
      const projectRes = await apiClient.get<{ data: Project[] }>("/api/projects");
      const projects = projectRes.data || [];
      setProjects(projects);

      const docMap: Record<string, Document[]> = {};
      for (const project of projects) {
        const fileRes = await apiClient.get<{ data: Document[] }>(`/api/projects/${project.id}/files`);
        docMap[project.id] = fileRes.data || [];
      }
      setDocsByProject(docMap);
      // Globale Dokumente (für alle Nutzer) via RBAC-Quellen
      try {
        const sourcesRes = await apiClient.get<{ sources: Array<Record<string, unknown>> }>("/api/rbac/sources");
        const globalSrcs = (sourcesRes.sources || []).filter((s) => s.visibility === "global");
        setGlobalDocs(
          globalSrcs.map((s) => ({
            id: String(s.id),
            project_id: null,
            filename: String(s.filename ?? "Dokument"),
            file_type: String(s.file_type ?? ""),
            file_size: Number(s.file_size ?? 0),
            processing_status: String(s.processing_status ?? "pending"),
            processing_details: null,
            created_at: String(s.created_at ?? new Date().toISOString()),
            updated_at: String(s.created_at ?? new Date().toISOString()),
            task_id: null,
            visibility: "global",
            team_id: null,
          }))
        );
      } catch {
        setGlobalDocs([]);
      }
      setIsDemo(false);
    } catch (err) {
      if (!isDemo) {
        const mock = generateMockData();
        setProjects(mock.projects);
        setDocsByProject(mock.docsByProject);
        setGlobalDocs([]);
        setIsDemo(true);
      }
      setError(isDemo ? "" : (err instanceof Error ? err.message : "Fehler"));
    } finally {
      setLoading(false);
    }
  }

  const onDrop = async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    const isGlobal = isAdmin && globalUpload;
    if (!isGlobal && !selectedProjectId) return;
    setUploading(true);
    try {
      const base = isGlobal ? "/api/projects/global-files" : `/api/projects/${selectedProjectId}/files`;
      const res = await apiClient.post<{ data: { upload_url: string; s3_key: string; document: { id: string } } }>(
        `${base}/upload-url`,
        { filename: file.name, file_type: file.type, file_size: file.size, ...(isGlobal ? { visibility: "global" } : {}) }
      );
      const { upload_url, s3_key } = res.data;
      await apiClient.uploadToS3(upload_url, file);
      await apiClient.post(`${base}/confirm`, { s3_key });
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-800" };
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
        {cfg.animate && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
        {cfg.label}
      </span>
    );
  }

  function summarisingProgress(doc: Document): number | null {
    const s = doc.processing_details?.summarising;
    if (!s?.current_chunk || !s?.total_chunks) return null;
    return Math.round((s.current_chunk / s.total_chunks) * 100);
  }

  function ProgressBar({ value }: { value: number }) {
    return (
      <div className="w-32 bg-[#f3f2f1] rounded-full h-1.5">
        <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${value}%` }} />
      </div>
    );
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-0 bg-transparent select-text">
        <p className="text-sm text-[#756b62]">Lade Ingestion-Daten...</p>
      </main>
    );
  }

  const allDocuments = Object.values(docsByProject).flat();

  return (
    <main className="flex-1 min-h-0 bg-transparent select-text overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        {isDemo && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            Demo-Modus — Kein Backend erreichbar. Zeige Beispiel-Daten zur Visualisierung.
            <button onClick={() => { setLoading(true); setIsDemo(false); fetchData(); }} className="ml-auto underline hover:no-underline">Erneut versuchen</button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light tracking-[-0.035em] text-[#2f2b26]">Ingestion</h1>
            <p className="mt-1 text-sm text-[#756b62]">
              {allDocuments.length} Dokumente &middot;{" "}
              {allDocuments.filter((d) => d.processing_status === "completed").length} fertig &middot;{" "}
              {allDocuments.filter((d) => d.processing_status === "failed").length} fehlgeschlagen
              {isDemo && <span className="ml-2 text-amber-600">(Demo-Daten)</span>}
            </p>
          </div>
          <button
            onClick={fetchData}
            className="text-sm text-[#756b62] hover:text-[#2f2b26] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
            Aktualisieren
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {!isDemo && (
          <div className="rounded-xl border border-[#e5dfd9] bg-white p-4 space-y-3">
            <h2 className="text-sm font-medium text-[#2f2b26]">Neues Dokument hochladen</h2>
            {isAdmin && (
              <label className="inline-flex items-center gap-2 text-xs text-[#756b62] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={globalUpload}
                  onChange={(e) => setGlobalUpload(e.target.checked)}
                  className="accent-[#b45f32]"
                />
                Global für alle Nutzer ingestieren (als Admin)
              </label>
            )}
            <div className="flex gap-3 items-start">
              <div className="flex-1 space-y-1">
                <label className="text-xs text-[#756b62]">Projekt auswählen</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
                >
                  <option value="">-- Projekt wählen --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-[#756b62]">&nbsp;</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer text-sm transition-colors ${
                    isDragActive ? "border-blue-400 bg-blue-50" : "border-[#e5dfd9] hover:border-[#d0c8be]"
                  } ${!selectedProjectId && !globalUpload ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input {...getInputProps()} />
                  {uploading ? (
                    <span className="text-[#756b62]">Wird hochgeladen...</span>
                  ) : isDragActive ? (
                    <span className="text-blue-600">Datei hier ablegen</span>
                  ) : (
                    <span className="text-[#756b62]">Klicken oder Datei hierher ziehen</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {allDocuments.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <svg className="w-12 h-12 mx-auto text-[#756b62]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
            </svg>
            <p className="text-sm text-[#756b62]">Keine Dokumente vorhanden. Lade Dateien in einem Projekt hoch, um die Ingestion zu starten.</p>
          </div>
        )}

        {globalDocs.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-medium text-[#2f2b26] flex items-center gap-2">
              Globale Dokumente
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#eef2ff] text-[#4338ca]">für alle</span>
              <span className="text-xs text-[#756b62] font-normal">({globalDocs.length})</span>
            </h2>
            <div className="space-y-1.5">
              {globalDocs.map((doc) => (
                <div key={doc.id} className="rounded-xl border border-[#e5dfd9] bg-white px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <svg className="w-8 h-8 shrink-0 text-[#756b62]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v4l2 2" />
                    </svg>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#2f2b26] truncate">{doc.filename}</p>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#eef2ff] text-[#4338ca]">Global</span>
                        <StatusBadge status={doc.processing_status} />
                      </div>
                      <p className="text-xs text-[#756b62] mt-0.5">
                        {formatFileSize(doc.file_size)} &middot; {doc.file_type} &middot; {new Date(doc.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {projects.map((project) => {
          const docs = docsByProject[project.id] || [];
          if (docs.length === 0) return null;
          return (
            <section key={project.id} className="space-y-2">
              <h2 className="text-sm font-medium text-[#2f2b26] flex items-center gap-2">
                {project.name}
                <span className="text-xs text-[#756b62] font-normal">({docs.length})</span>
              </h2>
              <div className="space-y-1.5">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="rounded-xl border border-[#e5dfd9] bg-white px-4 py-3 hover:border-[#d0c8be] hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <svg className="w-8 h-8 shrink-0 text-[#756b62]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#2f2b26] truncate">{doc.filename}</p>
                            {doc.visibility && doc.visibility !== "private" && (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#eef2ff] text-[#4338ca]">
                                {doc.visibility === "global" ? "Global" : "Team"}
                              </span>
                            )}
                            <StatusBadge status={doc.processing_status} />
                          </div>
                          <p className="text-xs text-[#756b62] mt-0.5">
                            {formatFileSize(doc.file_size)} &middot; {doc.file_type} &middot; {new Date(doc.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-xs text-[#756b62] space-y-1 text-right min-w-[140px]">
                        {doc.processing_details?.partitioning && (
                          <p>Elemente gefunden</p>
                        )}
                        {doc.processing_details?.chunking && (doc.processing_details.chunking.total_chunks ?? 0) > 0 && (
                          <p>{doc.processing_details.chunking.total_chunks} Chunks</p>
                        )}
                        {doc.processing_details?.summarising && (doc.processing_details.summarising.total_chunks ?? 0) > 0 && (
                          <div className="flex items-center justify-end gap-2">
                            <span>{doc.processing_details.summarising.current_chunk}/{doc.processing_details.summarising.total_chunks}</span>
                            <ProgressBar value={summarisingProgress(doc) ?? 0} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {selectedDoc && (
          <FileDetailsModal
            file={{
              id: selectedDoc.id,
              filename: selectedDoc.filename,
              file_type: selectedDoc.file_type,
              file_size: selectedDoc.file_size,
              processing_status: selectedDoc.processing_status,
              created_at: selectedDoc.created_at,
            }}
            projectId={selectedDoc.project_id ?? ""}
            onClose={() => setSelectedDoc(null)}
            mockChunks={isDemo ? mockChunksByDoc[selectedDoc.id] : undefined}
          />
        )}
      </div>
    </main>
  );
}
