import type { ChatMessage } from '../lib/types';

export const CHAT_THREADS_STORAGE_KEY = 'ws-copilot-chat-threads';
export const CHAT_FOLDERS_STORAGE_KEY = 'ws-copilot-chat-folders';
export const CHAT_ACTIVE_THREAD_STORAGE_KEY = 'ws-copilot-active-chat-thread';
export const CHAT_HISTORY_CHANGED_EVENT = 'ws-copilot:chat-history-changed';
export const CHAT_NEW_REQUESTED_EVENT = 'ws-copilot:new-chat-requested';
export const LEGACY_MESSAGES_KEY = 'ws-copilot-chat-messages';
export const DEFAULT_FOLDER_ID = 'default';

export interface ChatFolder {
  id: string;
  name: string;
  promptRules: string;
  createdAt: Date;
  updatedAt: Date;
  isDefault: boolean;
}

export interface ChatHistoryEntry {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  pinned: boolean;
  active: boolean;
  folderId: string;
}

export interface ChatThread {
  id: string;
  title: string;
  pinned: boolean;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: ChatMessage[];
}

export interface SerializedChatMessage extends Omit<ChatMessage, 'createdAt'> {
  createdAt: string;
}

export interface SerializedChatThread {
  id: string;
  title: string;
  pinned: boolean;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
  messages: SerializedChatMessage[];
}

export interface SerializedChatFolder {
  id: string;
  name: string;
  promptRules?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface SerializedChatHistorySnapshot {
  schemaVersion: 1;
  threads: SerializedChatThread[];
  folders: SerializedChatFolder[];
  activeThreadId: string | null;
  deletedThreadIds?: string[];
  updatedAt?: string | null;
}
