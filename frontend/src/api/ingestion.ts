import type {
  CrawlPreviewResult,
  Document,
  DocumentDeleteResult,
  IngestionOperation,
  IngestionWorkerStatus,
  JobStatus,
  KnowledgeResetResult,
  OperationDeleteResult,
  StoredChunk,
} from '@/types';
import { mapIngestionError, readHttpErrorDetail } from '../shared/src/utils/errors.js';
import {
  fetchWithAuth,
  postFormWithAuthProgress,
  type UploadProgressCallback,
} from './core';

export async function ingestFile(
  file: File,
  opts: {
    knowledgeBaseId?: string;
    chunkSize?: number;
    chunkOverlap?: number;
    semanticChunking?: boolean;
    onUploadProgress?: UploadProgressCallback;
  } = {}
): Promise<JobStatus> {
  const form = new FormData();
  form.append('file', file);
  form.append('knowledgeBaseId', opts.knowledgeBaseId ?? 'default');
  if (opts.chunkSize != null) form.append('chunkSize', String(opts.chunkSize));
  if (opts.chunkOverlap != null) form.append('chunkOverlap', String(opts.chunkOverlap));
  if (opts.semanticChunking != null) form.append('semanticChunking', String(opts.semanticChunking));

  const res = await postFormWithAuthProgress(
    '/api/v1/documents/ingest',
    form,
    opts.onUploadProgress
  );
  if (!res.ok) {
    const detail = await readHttpErrorDetail(res);
    throw new Error(mapIngestionError(res.status, detail));
  }
  return res.json() as Promise<JobStatus>;
}

export async function ingestUrl(
  url: string,
  opts: {
    knowledgeBaseId?: string;
    chunkSize?: number;
    chunkOverlap?: number;
    semanticChunking?: boolean;
    maxDepth?: number;
    sameDomain?: boolean;
    mode?: 'crawl' | 'single';
    maxPages?: number;
    useSitemap?: boolean;
    useLlmsTxt?: boolean;
    useNavigation?: boolean;
    maxSeedUrls?: number;
  } = {}
): Promise<JobStatus> {
  const normalizedMaxPages =
    typeof opts.maxPages === 'number' && Number.isFinite(opts.maxPages)
      ? Math.max(1, Math.min(1200, Math.round(opts.maxPages)))
      : 50;
  const res = await fetchWithAuth('/api/v1/documents/ingest/url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      knowledgeBaseId: opts.knowledgeBaseId ?? 'default',
      chunkSize: opts.chunkSize,
      chunkOverlap: opts.chunkOverlap,
      semanticChunking: opts.semanticChunking,
      maxDepth: opts.maxDepth ?? 2,
      sameDomain: opts.sameDomain ?? true,
      mode: opts.mode ?? 'crawl',
      maxPages: normalizedMaxPages,
      useSitemap: opts.useSitemap ?? true,
      useLlmsTxt: opts.useLlmsTxt ?? true,
      useNavigation: opts.useNavigation ?? true,
      maxSeedUrls: opts.maxSeedUrls ?? 40,
    }),
  });
  if (!res.ok) {
    const detail = await readHttpErrorDetail(res);
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.json() as Promise<JobStatus>;
}

export async function previewCrawlUrls(
  url: string,
  opts: {
    maxDepth?: number;
    sameDomain?: boolean;
    mode?: 'crawl' | 'single';
    maxPages?: number;
    useSitemap?: boolean;
    useLlmsTxt?: boolean;
    useNavigation?: boolean;
    maxSeedUrls?: number;
  } = {}
): Promise<CrawlPreviewResult> {
  const normalizedMaxPages =
    typeof opts.maxPages === 'number' && Number.isFinite(opts.maxPages)
      ? Math.max(1, Math.min(1200, Math.round(opts.maxPages)))
      : 50;
  const res = await fetchWithAuth('/api/v1/documents/ingest/url/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      maxDepth: opts.maxDepth ?? 2,
      sameDomain: opts.sameDomain ?? true,
      mode: opts.mode ?? 'crawl',
      maxPages: normalizedMaxPages,
      useSitemap: opts.useSitemap ?? true,
      useLlmsTxt: opts.useLlmsTxt ?? true,
      useNavigation: opts.useNavigation ?? true,
      maxSeedUrls: opts.maxSeedUrls ?? 40,
    }),
  });
  if (!res.ok) {
    const detail = await readHttpErrorDetail(res);
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return res.json() as Promise<CrawlPreviewResult>;
}

export async function fetchJobStatus(jobId: string): Promise<JobStatus> {
  const res = await fetchWithAuth(`/api/v1/documents/jobs/${jobId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<JobStatus>;
}

export async function fetchIngestionWorkerStatus(): Promise<IngestionWorkerStatus> {
  const res = await fetchWithAuth('/api/v1/documents/worker-status');
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<IngestionWorkerStatus>;
}

export async function cancelIngestionJob(jobId: string): Promise<JobStatus> {
  const res = await fetchWithAuth(`/api/v1/documents/jobs/${jobId}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<JobStatus>;
}

type RawDocument = Partial<Document> & {
  source_type?: Document['sourceType'];
  source_url?: string;
  source_hash?: string;
  created_at?: string;
  chunk_count?: number;
};

function mapDocument(doc: RawDocument): Document {
  return {
    id: doc.id ?? '',
    title: doc.title ?? 'Unbekanntes Dokument',
    sourceType: doc.sourceType ?? doc.source_type ?? 'upload',
    sourceUrl: doc.sourceUrl ?? doc.source_url,
    sourceHash: doc.sourceHash ?? doc.source_hash,
    status: doc.status ?? 'pending',
    createdAt: doc.createdAt ?? doc.created_at ?? new Date(0).toISOString(),
    chunkCount: doc.chunkCount ?? doc.chunk_count,
  };
}

export async function fetchDocuments(): Promise<Document[]> {
  const res = await fetchWithAuth('/api/v1/documents');
  if (!res.ok) return [];
  const raw = (await res.json()) as RawDocument[];
  return raw.map((doc) => mapDocument(doc));
}

export async function fetchDocument(documentId: string): Promise<Document> {
  const res = await fetchWithAuth(`/api/v1/documents/${encodeURIComponent(documentId)}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const raw = (await res.json()) as RawDocument;
  return mapDocument(raw);
}

export async function fetchIngestionOperations(): Promise<IngestionOperation[]> {
  const res = await fetchWithAuth('/api/v1/documents/operations');
  if (!res.ok) return [];
  const raw = (await res.json()) as Array<
    Partial<IngestionOperation> & {
      operation_id?: string;
      operation_type?: string;
      document_count?: number;
      chunk_count?: number;
      created_at?: string;
    }
  >;
  return raw.map((item) => ({
    operationId: item.operationId ?? item.operation_id ?? '',
    operationType: item.operationType ?? item.operation_type ?? 'unknown',
    source: item.source ?? 'Unbekannt',
    documentCount: item.documentCount ?? item.document_count ?? 0,
    chunkCount: item.chunkCount ?? item.chunk_count ?? 0,
    createdAt: item.createdAt ?? item.created_at ?? new Date(0).toISOString(),
  }));
}

type RawStoredChunk = Partial<StoredChunk> & {
  document_id?: string;
  document_title?: string;
  source_url?: string;
  created_at?: string;
  has_embedding?: boolean;
};

function mapStoredChunk(chunk: RawStoredChunk): StoredChunk {
  return {
    id: chunk.id ?? '',
    documentId: chunk.documentId ?? chunk.document_id ?? '',
    documentTitle: chunk.documentTitle ?? chunk.document_title ?? 'Unbekanntes Dokument',
    sourceUrl: chunk.sourceUrl ?? chunk.source_url,
    content: chunk.content ?? '',
    metadata: (chunk.metadata as Record<string, unknown> | undefined) ?? {},
    createdAt: chunk.createdAt ?? chunk.created_at ?? new Date(0).toISOString(),
    hasEmbedding: chunk.hasEmbedding ?? chunk.has_embedding,
  };
}

export async function fetchOperationChunks(
  operationId: string,
  limit = 500
): Promise<StoredChunk[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 5000));
  const res = await fetchWithAuth(
    `/api/v1/documents/operations/${encodeURIComponent(operationId)}/chunks?limit=${boundedLimit}`
  );
  if (!res.ok) return [];
  const raw = (await res.json()) as RawStoredChunk[];
  return raw.map((chunk) => mapStoredChunk(chunk));
}

export async function fetchDocumentChunks(
  documentId: string,
  limit = 200
): Promise<StoredChunk[]> {
  const boundedLimit = Math.max(1, Math.min(limit, 2000));
  const res = await fetchWithAuth(
    `/api/v1/documents/${encodeURIComponent(documentId)}/chunks?limit=${boundedLimit}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const raw = (await res.json()) as RawStoredChunk[];
  return raw.map((chunk) => mapStoredChunk(chunk));
}

export async function deleteIngestionOperation(
  operationId: string
): Promise<OperationDeleteResult> {
  const res = await fetchWithAuth(
    `/api/v1/documents/operations/${encodeURIComponent(operationId)}`,
    {
      method: 'DELETE',
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const raw = (await res.json()) as
    | Partial<OperationDeleteResult>
    | {
        operation_id?: string;
        documents_deleted?: number;
        chunks_deleted?: number;
        embeddings_deleted?: number;
      };
  return {
    operationId:
      ('operationId' in raw && typeof raw.operationId === 'string' ? raw.operationId : undefined) ??
      ('operation_id' in raw && typeof raw.operation_id === 'string'
        ? raw.operation_id
        : operationId),
    documentsDeleted:
      ('documentsDeleted' in raw && typeof raw.documentsDeleted === 'number'
        ? raw.documentsDeleted
        : undefined) ??
      ('documents_deleted' in raw && typeof raw.documents_deleted === 'number'
        ? raw.documents_deleted
        : 0),
    chunksDeleted:
      ('chunksDeleted' in raw && typeof raw.chunksDeleted === 'number'
        ? raw.chunksDeleted
        : undefined) ??
      ('chunks_deleted' in raw && typeof raw.chunks_deleted === 'number' ? raw.chunks_deleted : 0),
    embeddingsDeleted:
      ('embeddingsDeleted' in raw && typeof raw.embeddingsDeleted === 'number'
        ? raw.embeddingsDeleted
        : undefined) ??
      ('embeddings_deleted' in raw && typeof raw.embeddings_deleted === 'number'
        ? raw.embeddings_deleted
        : 0),
  };
}

export async function fetchDocumentOriginal(documentId: string): Promise<{
  blob: Blob;
  contentType: string;
  filename: string | null;
}> {
  const res = await fetchWithAuth(`/api/v1/documents/${encodeURIComponent(documentId)}/original`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const blob = await res.blob();
  const contentType = res.headers.get('Content-Type') || blob.type || 'application/octet-stream';
  const disposition = res.headers.get('Content-Disposition') || '';
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  return {
    blob,
    contentType,
    filename: filenameMatch?.[1] ?? null,
  };
}

export async function deleteIngestedDocument(
  documentId: string
): Promise<DocumentDeleteResult> {
  const res = await fetchWithAuth(`/api/v1/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const raw = (await res.json()) as
    | Partial<DocumentDeleteResult>
    | {
        document_id?: string;
        documents_deleted?: number;
        chunks_deleted?: number;
        embeddings_deleted?: number;
      };
  return {
    documentId:
      ('documentId' in raw && typeof raw.documentId === 'string' ? raw.documentId : undefined) ??
      ('document_id' in raw && typeof raw.document_id === 'string'
        ? raw.document_id
        : documentId),
    documentsDeleted:
      ('documentsDeleted' in raw && typeof raw.documentsDeleted === 'number'
        ? raw.documentsDeleted
        : undefined) ??
      ('documents_deleted' in raw && typeof raw.documents_deleted === 'number'
        ? raw.documents_deleted
        : 0),
    chunksDeleted:
      ('chunksDeleted' in raw && typeof raw.chunksDeleted === 'number'
        ? raw.chunksDeleted
        : undefined) ??
      ('chunks_deleted' in raw && typeof raw.chunks_deleted === 'number' ? raw.chunks_deleted : 0),
    embeddingsDeleted:
      ('embeddingsDeleted' in raw && typeof raw.embeddingsDeleted === 'number'
        ? raw.embeddingsDeleted
        : undefined) ??
      ('embeddings_deleted' in raw && typeof raw.embeddings_deleted === 'number'
        ? raw.embeddings_deleted
        : 0),
  };
}

export async function resetKnowledgeDatabase(): Promise<KnowledgeResetResult> {
  const res = await fetchWithAuth('/api/v1/documents/reset-db', {
    method: 'DELETE',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  const raw = (await res.json()) as
    | Partial<KnowledgeResetResult>
    | {
        documents_deleted?: number;
        chunks_deleted?: number;
        operations_deleted?: number;
        embeddings_deleted?: number;
      };
  return {
    documentsDeleted:
      ('documentsDeleted' in raw && typeof raw.documentsDeleted === 'number'
        ? raw.documentsDeleted
        : undefined) ??
      ('documents_deleted' in raw && typeof raw.documents_deleted === 'number'
        ? raw.documents_deleted
        : 0),
    chunksDeleted:
      ('chunksDeleted' in raw && typeof raw.chunksDeleted === 'number'
        ? raw.chunksDeleted
        : undefined) ??
      ('chunks_deleted' in raw && typeof raw.chunks_deleted === 'number' ? raw.chunks_deleted : 0),
    operationsDeleted:
      ('operationsDeleted' in raw && typeof raw.operationsDeleted === 'number'
        ? raw.operationsDeleted
        : undefined) ??
      ('operations_deleted' in raw && typeof raw.operations_deleted === 'number'
        ? raw.operations_deleted
        : 0),
    embeddingsDeleted:
      ('embeddingsDeleted' in raw && typeof raw.embeddingsDeleted === 'number'
        ? raw.embeddingsDeleted
        : undefined) ??
      ('embeddings_deleted' in raw && typeof raw.embeddings_deleted === 'number'
        ? raw.embeddings_deleted
        : 0),
  };
}
