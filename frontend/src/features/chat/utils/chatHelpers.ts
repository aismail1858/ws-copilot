// Chat feature helper functions

import type { RagKnowledgeMode, SearchMode } from '@/types';

// Use a local type for the upload job status
type UploadJobStatus = 'uploading' | 'pending' | 'active' | 'completed' | 'failed' | 'canceled';

export function inferProgress(status: UploadJobStatus, raw?: number): number {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    const safe = Math.max(0, Math.min(100, raw));
    if (status === 'completed' || status === 'failed' || status === 'canceled') return 100;
    return Math.min(99, safe);
  }
  if (status === 'completed' || status === 'failed' || status === 'canceled') return 100;
  if (status === 'active') return 55;
  if (status === 'pending') return 20;
  if (status === 'uploading') return 8;
  return 0;
}

export function loadChatKnowledgeMode(): RagKnowledgeMode {
  const CHAT_KNOWLEDGE_MODE_STORAGE_KEY = 'ws-copilot-chat-knowledge-mode';
  try {
    const value = (localStorage.getItem(CHAT_KNOWLEDGE_MODE_STORAGE_KEY) || '').trim().toLowerCase();
    if (value === 'docs_plus_model' || value === 'search') {
      return value;
    }
  } catch {
    // fall back to default mode
  }
  return 'docs_plus_model';
}

export function persistChatKnowledgeMode(mode: RagKnowledgeMode): void {
  const CHAT_KNOWLEDGE_MODE_STORAGE_KEY = 'ws-copilot-chat-knowledge-mode';
  try {
    localStorage.setItem(CHAT_KNOWLEDGE_MODE_STORAGE_KEY, mode);
  } catch {
    // best effort
  }
}

export function loadChatSearchMode(): SearchMode {
  const CHAT_SEARCH_MODE_STORAGE_KEY = 'ws-copilot-chat-search-mode';
  try {
    const value = (localStorage.getItem(CHAT_SEARCH_MODE_STORAGE_KEY) || '').trim().toLowerCase();
    if (value === 'speed' || value === 'balanced' || value === 'deep' || value === 'auto') {
      return value;
    }
    if (value === 'quality') {
      return 'deep';
    }
  } catch {
    // fall back to default
  }
  return 'auto';
}

export function persistChatSearchMode(mode: SearchMode): void {
  const CHAT_SEARCH_MODE_STORAGE_KEY = 'ws-copilot-chat-search-mode';
  try {
    localStorage.setItem(CHAT_SEARCH_MODE_STORAGE_KEY, mode);
  } catch {
    // best effort
  }
}

export function getUploadStatusLabel(status: UploadJobStatus): string {
  if (status === 'uploading') return 'Upload';
  if (status === 'pending') return 'Wartet';
  if (status === 'active') return 'Ingestion';
  if (status === 'completed') return 'Bereit';
  if (status === 'failed') return 'Fehlgeschlagen';
  if (status === 'canceled') return 'Entfernt';
  return status;
}

export function buildFallbackPreviewImage(fileName: string): string {
  const extension = fileName.split('.').pop()?.toUpperCase() || 'DOC';
  const safeExtension = extension.replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'DOC';
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 192 192">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#18181b" />
        <stop offset="100%" stop-color="#3f3f46" />
      </linearGradient>
    </defs>
    <rect width="192" height="192" fill="url(#bg)"/>
    <rect x="34" y="24" width="124" height="144" rx="16" fill="#0f172a" stroke="#52525b" stroke-width="2"/>
    <rect x="52" y="46" width="88" height="10" rx="5" fill="#71717a"/>
    <rect x="52" y="66" width="74" height="10" rx="5" fill="#52525b"/>
    <rect x="52" y="86" width="60" height="10" rx="5" fill="#52525b"/>
    <text x="96" y="140" text-anchor="middle" fill="#e4e4e7" font-size="26" font-family="Arial, sans-serif" font-weight="700">${safeExtension}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function buildPreviewImageUrl(file: File): string {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return buildFallbackPreviewImage(file.name);
}

export async function buildPreviewExcerpt(file: File): Promise<string> {
  const FILE_PREVIEW_MAX_CHARS = 900;
  const FILE_PREVIEW_READ_BYTES = 16 * 1024;

  const suffix = file.name.toLowerCase().split('.').pop() || '';
  if (suffix === 'pdf') {
    return 'PDF-Vorschau: Textauszug wird nach der Ingestion verfügbar.';
  }
  if (suffix === 'docx') {
    return 'DOCX-Vorschau: Textauszug wird nach der Ingestion verfügbar.';
  }
  if (suffix === 'pptx') {
    return 'PPTX-Vorschau: Textauszug wird nach der Ingestion verfügbar.';
  }

  if (!['txt', 'md', 'html', 'htm', 'js', 'php', 'ts'].includes(suffix)) {
    return 'Keine Inline-Vorschau für diesen Dateityp verfügbar.';
  }

  const head = await file.slice(0, FILE_PREVIEW_READ_BYTES).text();
  const normalized =
    suffix === 'html' || suffix === 'htm'
      ? head.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : head.replace(/\s+/g, ' ').trim();
  if (!normalized) return 'Datei ist leer oder enthält nur Leerzeichen.';
  if (normalized.length <= FILE_PREVIEW_MAX_CHARS) return normalized;
  return `${normalized.slice(0, FILE_PREVIEW_MAX_CHARS)}...`;
}

export function clampSourcePanelWidth(requestedWidth: number): number {
  const MIN_SOURCE_PANEL_WIDTH = 320;
  const MAX_SOURCE_PANEL_WIDTH = 1600;

  if (typeof window === 'undefined') {
    return Math.max(MIN_SOURCE_PANEL_WIDTH, Math.min(MAX_SOURCE_PANEL_WIDTH, requestedWidth));
  }

  const viewportLimitedMax = Math.floor(window.innerWidth * 0.96);
  const maxWidth = Math.max(
    MIN_SOURCE_PANEL_WIDTH,
    Math.min(MAX_SOURCE_PANEL_WIDTH, viewportLimitedMax)
  );

  return Math.max(MIN_SOURCE_PANEL_WIDTH, Math.min(maxWidth, requestedWidth));
}
