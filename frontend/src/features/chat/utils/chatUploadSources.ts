import type { Source } from '@/types';

interface ChatUploadSourceInput {
  documentId?: string;
  filename: string;
  excerpt?: string;
  sourceUrl?: string;
}

export function buildChatUploadDocumentId(jobId?: string): string | undefined {
  const normalizedJobId = (jobId || '').trim();
  return normalizedJobId ? `chat-upload:${normalizedJobId}` : undefined;
}

export function buildChatUploadSource({
  documentId,
  filename,
  excerpt,
  sourceUrl,
}: ChatUploadSourceInput): Source | null {
  const normalizedDocumentId = (documentId || '').trim();
  const normalizedSourceUrl = (sourceUrl || '').trim();
  if (!normalizedDocumentId && !normalizedSourceUrl) {
    return null;
  }
  return {
    documentId: normalizedDocumentId || 'chat-upload:attachment',
    title: filename.trim() || 'Chat Upload',
    filename: filename.trim() || undefined,
    documentName: filename.includes('.') ? filename.trim().replace(/\.[^.]+$/, '') : filename.trim() || undefined,
    excerpt: (excerpt || '').trim(),
    score: 1,
    url: normalizedSourceUrl || undefined,
  };
}
