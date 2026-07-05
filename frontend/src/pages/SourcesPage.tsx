import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiClient } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";

interface Source {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  processing_status: string;
  visibility: string;
  team_id: string | null;
  owner_id: string | null;
  project_id: string | null;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
}

const VIS_LABEL: Record<string, string> = {
  global: "Global (alle)",
  team: "Team",
  members: "Mitglieder",
  private: "Privat",
};
const VIS_COLOR: Record<string, string> = {
  global: "bg-[#fff1e8] text-[#b45f32]",
  team: "bg-blue-100 text-blue-800",
  members: "bg-violet-100 text-violet-800",
  private: "bg-gray-100 text-gray-700",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Ausstehend",
  queued: "In Warteschlange",
  processing: "Wird verarbeitet",
  completed: "Fertig",
  failed: "Fehlgeschlagen",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  queued: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const MOCK_SOURCES: Source[] = [
  {
    id: "demo-1",
    filename: "Produkthandbuch_v3.pdf",
    file_type: "pdf",
    file_size: 2483200,
    processing_status: "completed",
    visibility: "global",
    team_id: null,
    owner_id: null,
    project_id: "demo-proj",
    created_at: "2026-06-28T10:15:00Z",
  },
  {
    id: "demo-2",
    filename: "Onboarding-Guide.pdf",
    file_type: "pdf",
    file_size: 512000,
    processing_status: "completed",
    visibility: "team",
    team_id: "team-1",
    owner_id: null,
    project_id: "demo-proj",
    created_at: "2026-06-30T08:40:00Z",
  },
  {
    id: "demo-3",
    filename: "Q2-Sales-Report.xlsx",
    file_type: "xlsx",
    file_size: 86400,
    processing_status: "completed",
    visibility: "members",
    team_id: null,
    owner_id: null,
    project_id: "demo-proj",
    created_at: "2026-07-02T14:05:00Z",
  },
  {
    id: "demo-4",
    filename: "Team-Meeting-Notes.docx",
    file_type: "docx",
    file_size: 32768,
    processing_status: "completed",
    visibility: "private",
    team_id: null,
    owner_id: null,
    project_id: "demo-proj",
    created_at: "2026-07-03T16:20:00Z",
  },
  {
    id: "demo-5",
    filename: "Vertragsentwurf_v2.pdf",
    file_type: "pdf",
    file_size: 1204000,
    processing_status: "processing",
    visibility: "team",
    team_id: "team-1",
    owner_id: null,
    project_id: "demo-proj",
    created_at: "2026-07-04T09:00:00Z",
  },
  {
    id: "demo-6",
    filename: "Fehlerprotokoll.xlsx",
    file_type: "xlsx",
    file_size: 45000,
    processing_status: "failed",
    visibility: "private",
    team_id: null,
    owner_id: null,
    project_id: "demo-proj",
    created_at: "2026-07-04T10:30:00Z",
  },
];

export default function SourcesPage() {
  const { user } = useAuth();
  const canManage = user?.tier === "admin" || user?.tier === "team_lead";
  const [searchParams] = useSearchParams();
  const forceDemo = searchParams.get("demo") === "1";

  const [sources, setSources] = useState<Source[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisibility, setFilterVisibility] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (forceDemo) {
      setSources(MOCK_SOURCES);
      setDemoMode(true);
      setLoading(false);
      return;
    }
    fetchSources();
    if (canManage) fetchTeams();
  }, [canManage, forceDemo]);

  async function fetchSources() {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get<{ sources: Source[] }>("/api/rbac/sources");
      setSources(res.sources || []);
      setDemoMode(false);
    } catch (err) {
      // API nicht erreichbar -> Demo-Daten als Vorschau anzeigen
      setSources(MOCK_SOURCES);
      setDemoMode(true);
      setError(err instanceof Error ? err.message : "API nicht erreichbar");
    } finally {
      setLoading(false);
    }
  }

  async function fetchTeams() {
    try {
      const res = await apiClient.get<{ teams: Team[] }>("/api/rbac/teams");
      setTeams(res.teams || []);
    } catch {
      /* non-fatal */
    }
  }

  async function changeVisibility(src: Source, visibility: string) {
    setBusyId(src.id);
    try {
      const team_id = visibility === "team" ? src.team_id || teams[0]?.id : null;
      await apiClient.put(`/api/rbac/sources/${src.id}/visibility`, { visibility, team_id });
      setSources((prev) =>
        prev.map((s) => (s.id === src.id ? { ...s, visibility, team_id: team_id ?? s.team_id } : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sichtbarkeit konnte nicht geaendert werden");
    } finally {
      setBusyId(null);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center min-h-0 bg-transparent select-text">
        <p className="text-sm text-[#756b62]">Lade Quellen...</p>
      </main>
    );
  }

  const filteredSources = sources.filter((src) => {
    if (searchQuery && !src.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterVisibility !== "all" && src.visibility !== filterVisibility) return false;
    if (filterStatus !== "all" && src.processing_status !== filterStatus) return false;
    return true;
  });

  return (
    <main className="flex-1 min-h-0 bg-transparent select-text overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-light tracking-[-0.035em] text-[#2f2b26]">Quellen</h1>
          <p className="mt-1 text-sm text-[#756b62]">
            {canManage
              ? "Alle Quellen, die du verwalten kannst. Aendere die Sichtbarkeit pro Quelle."
              : "Quellen, fuer die du Zugriff hast (global / team / direkt zugewiesen)."}
          </p>
        </div>

        {demoMode && (
          <div className="rounded-lg bg-[#fff1e8] border border-[#f3d9c4] px-4 py-3 text-sm text-[#b45f32] flex items-center justify-between gap-3">
            <span>
              <strong>Demo-Vorschau.</strong> {error ? `API nicht erreichbar (${error}).` : ""} Das sind Beispiel­daten, damit du siehst, wie die Seite aussieht. Rufe <code className="font-mono">/sources</code> ohne <code className="font-mono">?demo=1</code> auf, sobald das Backend läuft.
            </span>
            {!forceDemo && (
              <button
                onClick={fetchSources}
                className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-medium text-[#b45f32] border border-[#f3d9c4] hover:bg-[#fff8f1]"
              >
                Neu laden
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Dateiname suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 min-w-[200px] flex-1 max-w-xs rounded-lg border border-[#e5dfd9] bg-white px-3 text-sm text-[#2f2b26] placeholder:text-[#756b62]/60 outline-none focus:border-[#b45f32] focus:ring-1 focus:ring-[#b45f32]/30"
          />
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="h-8 rounded-lg border border-[#e5dfd9] bg-white px-2 text-xs text-[#2f2b26] outline-none"
          >
            <option value="all">Sichtbarkeit: Alle</option>
            <option value="global">Global</option>
            <option value="team">Team</option>
            <option value="members">Mitglieder</option>
            <option value="private">Privat</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-8 rounded-lg border border-[#e5dfd9] bg-white px-2 text-xs text-[#2f2b26] outline-none"
          >
            <option value="all">Status: Alle</option>
            <option value="completed">Fertig</option>
            <option value="processing">Wird verarbeitet</option>
            <option value="queued">In Warteschlange</option>
            <option value="pending">Ausstehend</option>
            <option value="failed">Fehlgeschlagen</option>
          </select>
          {(searchQuery || filterVisibility !== "all" || filterStatus !== "all") && (
            <button
              onClick={() => { setSearchQuery(""); setFilterVisibility("all"); setFilterStatus("all"); }}
              className="h-8 shrink-0 rounded-lg border border-[#e5dfd9] bg-white px-3 text-xs text-[#756b62] hover:bg-[#f9f8f6]"
            >
              Zurücksetzen
            </button>
          )}
          <span className="text-xs text-[#756b62]">
            {filteredSources.length} / {sources.length}
          </span>
        </div>

        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2f2b26]/10 text-left text-[10px] uppercase tracking-wider text-[#756b62]">
                <th className="px-4 py-3 font-medium">Dateiname</th>
                <th className="px-4 py-3 font-medium">Typ</th>
                <th className="px-4 py-3 font-medium">Größe</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sichtbarkeit</th>
                <th className="px-4 py-3 font-medium">Datum</th>
              </tr>
            </thead>
            <tbody>
              {filteredSources.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[#fff1e8] text-[#b45f32]">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75A2.25 2.25 0 0 1 6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75Zm4.125 3h6.75m-6.75 3h6.75m-6.75 3h4.5" />
                        </svg>
                      </span>
                      <p className="text-sm text-[#756b62]">Keine Quellen verfügbar.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSources.map((src) => (
                  <tr key={src.id} className="border-b border-[#2f2b26]/5 hover:bg-[#2f2b26]/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-5 h-5 shrink-0 text-[#756b62]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                        </svg>
                        <span className="font-medium text-[#2f2b26] truncate">{src.filename}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#756b62] uppercase">{src.file_type}</td>
                    <td className="px-4 py-3 text-[#756b62]">{formatFileSize(src.file_size)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[src.processing_status] || "bg-gray-100 text-gray-800"}`}>
                        {STATUS_LABEL[src.processing_status] || src.processing_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <select
                          value={src.visibility}
                          disabled={busyId === src.id || demoMode}
                          onChange={(e) => changeVisibility(src, e.target.value)}
                          className="rounded-lg border border-input bg-transparent px-2 py-1 text-xs disabled:opacity-60"
                        >
                          <option value="private">Privat</option>
                          <option value="global">Global (alle)</option>
                          <option value="team">Team</option>
                          <option value="members">Mitglieder</option>
                        </select>
                      ) : (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${VIS_COLOR[src.visibility] || VIS_COLOR.private}`}>
                          {VIS_LABEL[src.visibility] || src.visibility}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#756b62]">{new Date(src.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </main>
  );
}
