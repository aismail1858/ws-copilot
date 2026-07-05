import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import type { Project } from "../../lib/types";

interface ProjectsGridProps {
  projects: Project[];
  onDelete: (id: string) => void;
}

export default function ProjectsGrid({ projects, onDelete }: ProjectsGridProps) {
  const navigate = useNavigate();

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg">No projects yet</p>
        <p className="text-sm mt-1">Create your first project to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => navigate(`/projects/${project.id}`)}
          className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 truncate">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-2">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
