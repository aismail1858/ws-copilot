import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MessageSquare,
  Settings,
  FileText,
  List,
  ExternalLink,
} from "lucide-react";
import { apiClient } from "../lib/api";
import type {
  Project,
  Chat,
  ProjectSettings,
  FileInfo,
} from "../lib/types";
import KnowledgeBaseSidebar from "../components/projects/KnowledgeBaseSidebar";
import FileDetailsModal from "../components/projects/FileDetailsModal";
import toast from "react-hot-toast";

type Tab = "overview" | "materials" | "settings";

const DEFAULT_SETTINGS: ProjectSettings = {
  embedding_model: "text-embedding-ada-002",
  rag_strategy: "hybrid",
  agent_type: "default",
  chunks_per_search: 5,
  final_context_size: 2000,
  similarity_threshold: 0.7,
  number_of_queries: 3,
  reranking_enabled: true,
  reranking_model: "cross-encoder",
  vector_weight: 0.7,
  keyword_weight: 0.3,
};

function SettingsForm({
  settings,
  projectId,
  onSaved,
}: {
  settings: ProjectSettings;
  projectId: string;
  onSaved: (s: ProjectSettings) => void;
}) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await apiClient.put<ProjectSettings>(
        `/api/projects/${projectId}/settings`,
        form
      );
      onSaved(updated);
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const field = (label: string, key: keyof ProjectSettings, type = "text") => (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={String(form[key])}
        onChange={(e) => {
          const val =
            type === "number"
              ? parseFloat(e.target.value)
              : e.target.value;
          setForm((f) => ({ ...f, [key]: val }));
        }}
        className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {field("Embedding Model", "embedding_model")}
        {field("RAG Strategy", "rag_strategy")}
        {field("Agent Type", "agent_type")}
        {field("Chunks per Search", "chunks_per_search", "number")}
        {field("Final Context Size", "final_context_size", "number")}
        {field("Similarity Threshold", "similarity_threshold", "number")}
        {field("Number of Queries", "number_of_queries", "number")}
        {field("Reranking Model", "reranking_model")}
        {field("Vector Weight", "vector_weight", "number")}
        {field("Keyword Weight", "keyword_weight", "number")}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.reranking_enabled}
          onChange={(e) =>
            setForm((f) => ({ ...f, reranking_enabled: e.target.checked }))
          }
          className="rounded border-slate-300"
        />
        Reranking Enabled
      </label>
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [settings, setSettings] = useState<ProjectSettings>(DEFAULT_SETTINGS);
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);

  useEffect(() => {
    if (!projectId) return;
    apiClient.get<Project>(`/api/projects/${projectId}`).then(setProject);
    apiClient
      .get<{ data: Chat[] }>(`/api/projects/${projectId}/chats`)
      .then((res) => setChats(res.data));
    apiClient
      .get<ProjectSettings>(`/api/projects/${projectId}/settings`)
      .then(setSettings)
      .catch(() => {});
  }, [projectId]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        Loading...
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <List size={16} /> },
    { key: "materials", label: "Materials", icon: <FileText size={16} /> },
    { key: "settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col">
        <div className="border-b border-slate-200 bg-white">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-slate-900">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-slate-500 mt-1">
                {project.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 px-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {tab === "overview" && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="font-semibold text-slate-800 mb-3">Chats</h3>
                {chats.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    No chats yet. Upload materials and start a conversation.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <Link
                        key={chat.id}
                        to={`/projects/${projectId}/chats/${chat.id}`}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-200 transition-colors text-sm"
                      >
                        <MessageSquare size={16} className="text-slate-400" />
                        <span className="flex-1 text-slate-700">
                          {chat.title}
                        </span>
                        <ExternalLink
                          size={14}
                          className="text-slate-400"
                        />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              </div>
          )}

          {tab === "materials" && (
            <div className="text-sm text-slate-500">
              Select a file from the sidebar to view details.
            </div>
          )}

          {tab === "settings" && (
            <div className="max-w-2xl">
              <SettingsForm
                settings={settings}
                projectId={projectId!}
                onSaved={setSettings}
              />
            </div>
          )}
        </div>
      </div>

      {(tab === "overview" || tab === "materials") && (
        <KnowledgeBaseSidebar
          projectId={projectId!}
          onSelectFile={setSelectedFile}
          selectedFileId={selectedFile?.id}
        />
      )}

      <FileDetailsModal
        file={selectedFile}
        projectId={projectId!}
        onClose={() => setSelectedFile(null)}
      />


    </div>
  );
}
