// Laufzeit-LLM-Konfig-Typ (genutzt vom Settings-/Retrieval-Lab-System).
// Die frueheren Phantom-Streamer (queryRAGStream/generateChatTitle gegen /api/v1/rag/query
// bzw. /api/v1/chat/title) sind entfernt — der Live-Chat läuft über streamChat.ts
// -> POST /api/chats/{cid}/messages/stream (KB-014). StreamCallbacks entfällt (kein Konsument).
export interface RuntimeLlmConfig {
  provider: 'claude' | 'openai' | 'gemini' | 'ollama' | 'custom';
  model: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  googleApiKey?: string;
  customLlmUrl?: string;
  customLlmApiKey?: string;
  ollamaUrl?: string;
  ollamaApiKey?: string;
}
