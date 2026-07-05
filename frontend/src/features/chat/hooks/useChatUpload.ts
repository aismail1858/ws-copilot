// Hook for managing chat file uploads

import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { ingestFile, fetchJobStatus } from '@/api/client';
import { buildChatKnowledgeBaseId, type ChatUploadJob } from '@/chat/uploadJobs';
import {
  inferProgress,
  buildPreviewImageUrl,
  buildPreviewExcerpt,
  getUploadStatusLabel,
} from '../utils/chatHelpers';
import { UPLOAD_PROCESSING_STATUSES } from '../utils/chatConstants';

interface SelectedUploadPreview {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  excerpt: string;
  previewImageUrl: string;
  localId?: string;
  jobId?: string;
  status: ChatUploadJob['status'] | 'uploading';
  progress: number;
  stage?: string;
  error?: string;
  sourceUrl?: string;
}

export function useChatUpload(activeThreadId: string | null) {
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedUploadPreview, setSelectedUploadPreview] = useState<SelectedUploadPreview | null>(null);
  const uploadSessionRef = useRef(0);
  const previousPreviewUrlRef = useRef<string | null>(null);

  const knowledgeBaseId = buildChatKnowledgeBaseId(activeThreadId);

  useEffect(() => {
    const previousUrl = previousPreviewUrlRef.current;
    const currentUrl = selectedUploadPreview?.previewImageUrl ?? null;
    if (previousUrl && previousUrl !== currentUrl && previousUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previousUrl);
    }
    previousPreviewUrlRef.current = currentUrl;
  }, [selectedUploadPreview?.previewImageUrl]);

  useEffect(() => {
    return () => {
      const currentUrl = previousPreviewUrlRef.current;
      if (currentUrl && currentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, []);

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const uploadSession = ++uploadSessionRef.current;
      if (!knowledgeBaseId) {
        setUploadError('Aktiver Chat wird geladen, bitte kurz warten.');
        return;
      }
      setUploadError(null);
      setIsUploadingFile(true);
      const initialPreview: SelectedUploadPreview = {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        excerpt: 'Vorschau wird geladen...',
        previewImageUrl: buildPreviewImageUrl(file),
        status: 'uploading',
        progress: 0,
        stage: 'Datei wird hochgeladen',
      };
      setSelectedUploadPreview(initialPreview);
      try {
        const excerpt = await buildPreviewExcerpt(file);
        if (uploadSession !== uploadSessionRef.current) return;
        setSelectedUploadPreview((prev) =>
          prev
            ? {
                ...prev,
                excerpt,
              }
            : prev
        );

        const jobResult = await ingestFile(file, { knowledgeBaseId });
        if (uploadSession !== uploadSessionRef.current) return;
        const localId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setSelectedUploadPreview((prev) =>
          prev
            ? {
                ...prev,
                localId,
                jobId: jobResult.jobId,
                status: jobResult.status,
                progress: inferProgress(jobResult.status, jobResult.progress),
                stage: jobResult.stage || 'Ingestion gestartet',
                error: jobResult.error,
                excerpt: jobResult.excerpt ?? prev.excerpt,
                sourceUrl: jobResult.sourceUrl,
              }
            : prev
        );
      } catch (err) {
        if (uploadSession !== uploadSessionRef.current) return;
        const message = err instanceof Error ? err.message : 'Upload fehlgeschlagen';
        setUploadError(message);
        setSelectedUploadPreview((prev) =>
          prev
            ? {
                ...prev,
                status: 'failed',
                progress: 100,
                stage: 'Upload fehlgeschlagen',
                error: message,
              }
            : prev
        );
      } finally {
        if (uploadSession === uploadSessionRef.current) {
          setIsUploadingFile(false);
        }
      }
    },
    [knowledgeBaseId]
  );

  return {
    isUploadingFile,
    uploadError,
    setUploadError,
    selectedUploadPreview,
    setSelectedUploadPreview,
    handleFileChange,
    uploadSessionRef,
  };
}

type ChatUploadJobsUpdater = (previous: ChatUploadJob[]) => ChatUploadJob[];

export function useChatUploadPolling(
  chatUploadJobs: ChatUploadJob[],
  activeThreadId: string | null,
  updateChatUploadJobs: (modifier: ChatUploadJobsUpdater) => void
) {
  const knowledgeBaseId = buildChatKnowledgeBaseId(activeThreadId);
  const hasPendingUploads = chatUploadJobs.some(
    (job) => job.status === 'pending' || job.status === 'active'
  );

  useEffect(() => {
    if (!knowledgeBaseId || !hasPendingUploads) return;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      const pendingJobs = chatUploadJobs.filter(
        (job) => job.status === 'pending' || job.status === 'active'
      );
      if (pendingJobs.length === 0) return;

      const updates: ChatUploadJob[] = [];
      for (const job of pendingJobs) {
        try {
          const status = await fetchJobStatus(job.jobId);
          updates.push({
            ...job,
            status: status.status,
            stage: status.stage ?? job.stage,
            progress: status.progress ?? job.progress,
            error: status.error ?? job.error,
            excerpt: status.excerpt ?? job.excerpt,
            sourceUrl: status.sourceUrl ?? job.sourceUrl,
            documentId: status.documentId ?? job.documentId,
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore fetch errors for now
        }
      }

      if (updates.length === 0) return;
      const updateMap = new Map(updates.map((entry) => [entry.jobId, entry]));
      updateChatUploadJobs((prev) =>
        prev.map((job) => {
          const next = updateMap.get(job.jobId);
          return next ? { ...job, ...next } : job;
        })
      );
    };

    void poll();
    const timer = setInterval(() => {
      if (!cancelled) {
        void poll();
      }
    }, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [chatUploadJobs, knowledgeBaseId, hasPendingUploads, updateChatUploadJobs]);
}

export type { SelectedUploadPreview };
export { getUploadStatusLabel, UPLOAD_PROCESSING_STATUSES };
