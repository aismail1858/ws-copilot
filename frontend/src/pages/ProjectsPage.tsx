import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { apiClient } from "../lib/api";
import type { Project } from "../lib/types";
import ProjectsGrid from "../components/projects/ProjectsGrid";
import CreateProjectModal from "../components/projects/CreateProjectModal";
import toast from "react-hot-toast";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    apiClient
      .get<{ data: Project[] }>("/api/projects/")
      .then((res) => setProjects(res.data))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await apiClient.delete(`/api/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>
      {loading ? (
        <div className="text-center py-16 text-slate-500">Loading...</div>
      ) : (
        <ProjectsGrid projects={projects} onDelete={handleDelete} />
      )}
      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(project) => setProjects((prev) => [project, ...prev])}
      />
    </div>
  );
}
