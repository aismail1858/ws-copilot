import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Trash2 } from "lucide-react";
import { apiClient } from "../../lib/api";
import type { FileInfo, UploadUrlResponse } from "../../lib/types";
import toast from "react-hot-toast";

interface KnowledgeBaseSidebarProps {
  projectId: string;
  onSelectFile: (file: FileInfo) => void;
  selectedFileId?: string;
}

export default function KnowledgeBaseSidebar({
  projectId,
  onSelectFile,
  selectedFileId,
}: KnowledgeBaseSidebarProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadFiles();
    const interval = setInterval(loadFiles, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const loadFiles = async () => {
    try {
      const data = await apiClient.get<{ data: FileInfo[] }>(
        `/api/projects/${projectId}/files`
      );
      setFiles(data.data);
    } catch {
      // silent
    }
  };

  const onDrop = async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    setUploading(true);
    try {
      const { upload_url, file_id } = await apiClient.post<UploadUrlResponse>(
        `/api/projects/${projectId}/files/upload-url`,
        {
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
        }
      );
      await apiClient.uploadToS3(upload_url, file);
      await apiClient.post(`/api/projects/${projectId}/files/confirm`, {
        file_id,
      });
      toast.success("File uploaded");
      loadFiles();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleDelete = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Delete this file?")) return;
    try {
      await apiClient.delete(
        `/api/projects/${projectId}/files/${fileId}`
      );
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.success("File deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete file");
    }
  };

  return (
    <div className="w-72 bg-white border-l border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          Knowledge Base
        </h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer text-sm transition-colors ${
            isDragActive
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 hover:border-blue-300"
          }`}
        >
          <input {...getInputProps()} />
          <Upload
            size={20}
            className="mx-auto mb-1 text-slate-400"
          />
          {uploading ? (
            <span className="text-slate-500">Uploading...</span>
          ) : isDragActive ? (
            <span className="text-blue-600">Drop file here</span>
          ) : (
            <span className="text-slate-500">
              Drop a file or click to upload
            </span>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => onSelectFile(file)}
            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition-colors ${
              selectedFileId === file.id
                ? "bg-blue-50 text-blue-700"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <FileText size={16} className="shrink-0" />
            <span className="flex-1 truncate">{file.filename}</span>
            {file.processing_status !== "completed" && (
              <span className="text-xs text-amber-500 shrink-0 capitalize">
                {file.processing_status}
              </span>
            )}
            <button
              onClick={(e) => handleDelete(file.id, e)}
              className="p-0.5 text-slate-400 hover:text-red-500 shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
