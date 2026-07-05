import type { JobStatus } from '../lib/types';

const STORAGE_KEY_PREFIX = 'ws-copilot-chat-upload-jobs';

export interface ChatUploadJob {
  localId: string;
  jobId: string;
  filename: string;
  status: JobStatus['status'];
  progress?: number;
  stage?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
  excerpt?: string;
  sourceUrl?: string;
  documentId?: string;
}

function buildStorageKey(threadId: string | null): string {
  const suffix = threadId?.trim() || 'global';
  return `${STORAGE_KEY_PREFIX}:${suffix}`;
}

export function loadChatUploadJobs(threadId: string | null): ChatUploadJob[] {
  try {
    const raw = localStorage.getItem(buildStorageKey(threadId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is ChatUploadJob =>
          Boolean(item && typeof item === 'object' && typeof (item as ChatUploadJob).jobId === 'string')
      )
      .map((item) => ({
        ...item,
        createdAt: String(item.createdAt),
        updatedAt: String(item.updatedAt),
      }));
  } catch {
    return [];
  }
}

export function saveChatUploadJobs(threadId: string | null, jobs: ChatUploadJob[]): void {
  try {
    localStorage.setItem(buildStorageKey(threadId), JSON.stringify(jobs));
  } catch {
  }
}

export function buildChatKnowledgeBaseId(threadId: string | null): string | undefined {
  if (!threadId) return undefined;
  return `chat-${threadId}`;
}
