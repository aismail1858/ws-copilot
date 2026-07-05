import type { ChatUploadJob } from '@/chat/uploadJobs';
import { MODEL_OPTION_SEPARATOR as MODEL_OPTION_SEPARATOR_SHARED } from '../../../shared/src/constants/chat';

// Chat feature constants

export const MODEL_OPTION_SEPARATOR = MODEL_OPTION_SEPARATOR_SHARED;
export const DEFAULT_SOURCE_PANEL_WIDTH = 520;
export const MIN_SOURCE_PANEL_WIDTH = 320;
export const MAX_SOURCE_PANEL_WIDTH = 1600;
export const MAX_CHAT_UPLOAD_JOBS = 1;
export const FILE_PREVIEW_MAX_CHARS = 900;
export const FILE_PREVIEW_READ_BYTES = 16 * 1024;
export const CHAT_KNOWLEDGE_MODE_STORAGE_KEY = 'ws-copilot-chat-knowledge-mode';

export const UPLOAD_PROCESSING_STATUSES: Array<ChatUploadJob['status'] | 'uploading'> = [
  'uploading',
  'pending',
  'active',
];

export const CHAT_KNOWLEDGE_MODE_OPTIONS: Array<{
  id: 'docs_only' | 'docs_plus_model' | 'search';
  label: string;
  title: string;
}> = [
  { id: 'docs_plus_model', label: 'Auto', title: 'Auto-Modus' },
  { id: 'search', label: 'Suche', title: 'Websuche' },
];

export const CHAT_SEARCH_MODE_STORAGE_KEY = 'ws-copilot-chat-search-mode';

export const SEARCH_MODE_OPTIONS: Array<{
  id: 'auto' | 'speed' | 'balanced' | 'deep';
  label: string;
  title: string;
}> = [
  { id: 'auto', label: 'Auto', title: 'Auto: Router entscheidet zwischen Schnell, Balanciert und Deep' },
  { id: 'speed', label: 'Schnell', title: 'Schnell: Nur SearXNG-Suchergebnisse, keine LLM-Veredelung' },
  { id: 'balanced', label: 'Balanciert', title: 'Balanciert: URL-Auswahl per LLM, dann Antwort' },
  { id: 'deep', label: 'Tief', title: 'Tief: URL-Auswahl + Faktextraktion + Reranking' },
];

export const EXAMPLE_QUESTIONS = [
  'Was ist das AppSkript?',
  'Was sind unsere Coding Guidelines?',
  'Erkläre den Unterschied zwischen synchronen und asynchronen Tasks.',
  'Wie verwende ich die JobRouter JavaScript API in einem Dialog?',
];
