import { useState, useEffect } from "react";
import { apiClient } from "../../lib/api";
import type { FileInfo, DocumentChunk } from "../../lib/types";
import Modal from "./document-details/Modal";
import ModalHeader from "./document-details/ModalHeader";
import PipelineTabs from "./document-details/PipelineTabs";
import ChunksViewer from "./document-details/ChunksViewer";

interface FileDetailsModalProps {
  file: FileInfo | null;
  projectId: string;
  onClose: () => void;
  mockChunks?: DocumentChunk[];
}

export default function FileDetailsModal({
  file,
  projectId,
  onClose,
  mockChunks,
}: FileDetailsModalProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;
    if (mockChunks) {
      setChunks(mockChunks);
      return;
    }
    setLoading(true);
    apiClient
      .get<DocumentChunk[]>(
        `/api/projects/${projectId}/files/${file.id}/chunks`
      )
      .then(setChunks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [file, projectId, mockChunks]);

  if (!file) return null;

  const steps = [
    { key: "partitioning", label: "Partitioning" },
    { key: "chunking", label: "Chunking" },
    { key: "summarising", label: "Summarising" },
    { key: "vectorization", label: "Vectorization" },
  ];

  const currentStepIndex = steps.findIndex(
    (s) => s.key === file.processing_status
  );

  return (
    <Modal onClose={onClose}>
      <ModalHeader title={file.filename} onClose={onClose} />
      <div className="p-4">
        <PipelineTabs
          steps={steps}
          currentStep={currentStepIndex}
          processingStatus={file.processing_status}
        />
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500">
              Loading chunks...
            </div>
          ) : chunks.length > 0 ? (
            <ChunksViewer chunks={chunks} />
          ) : (
            <div className="text-center py-8 text-slate-400">
              {file.processing_status === "completed"
                ? "No chunks available"
                : "Processing..."}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
