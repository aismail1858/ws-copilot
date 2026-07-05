import type { ChatMessage } from '../lib/types';
import {
  CHAT_NEW_REQUESTED_EVENT,
  type ChatFolder,
  type ChatHistoryEntry,
  type ChatThread,
} from './historyTypes';
import {
  createEmptyThread,
  emitHistoryChanged,
  ensureActiveThreadId,
  ensureFolders,
  ensureThreads,
  getActiveThread,
  getDefaultFolderId,
  loadActiveThreadId,
  recordDeletedThreadIds,
  resolveFolderId,
  sanitizeTitle,
  saveThreads,
  saveThreadsAndActive,
  setActiveThreadId,
  getPendingFolderId,
  setPendingFolderId,
  removeActiveThreadId,
} from './historyStorage';
import { createRuntimeId } from './historyFolderOperations';

export function loadChatMessages(): ChatMessage[] {
  return getActiveThread()?.messages ?? [];
}

export function saveChatMessages(messages: ChatMessage[]): void {
  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  const activeId = loadActiveThreadId();

  if (activeId === null) {
    const folderId = getPendingFolderId() || getDefaultFolderId(folders);
    const newThread = createEmptyThread(folderId);
    newThread.messages = messages;
    newThread.updatedAt = new Date();
    saveThreadsAndActive([newThread, ...threads], newThread.id);
    setPendingFolderId(null);
    return;
  }

  saveThreads(
    threads.map((thread) => {
      if (thread.id !== activeId) return thread;
      const contentChanged = hasNewMessages(thread.messages, messages);
      return {
        ...thread,
        messages,
        ...(contentChanged ? { updatedAt: new Date() } : {}),
      };
    })
  );
}

function hasNewMessages(prev: ChatMessage[], next: ChatMessage[]): boolean {
  if (prev.length !== next.length) return true;
  return prev.some((msg, i) => msg.id !== next[i].id);
}

export function setGeneratedThreadTitle(threadId: string, title: string): void {
  const trimmedTitle = title.trim();
  if (!threadId || !trimmedTitle) return;

  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  let changed = false;
  const next = threads.map((thread) => {
    if (thread.id !== threadId || thread.title !== 'Neuer Chat') return thread;
    changed = true;
    return { ...thread, title: sanitizeTitle(trimmedTitle), updatedAt: new Date() };
  });

  if (!changed) return;

  saveThreads(next);
}

export function clearChatMessages(): void {
  saveChatMessages([]);
}

export function requestNewChat(folderId?: string): void {
  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  const targetFolderId = resolveFolderId(folderId, folders);

  const emptyThreads = threads.filter(
    (t) => t.messages.length === 0 && t.title === 'Neuer Chat'
  );
  if (emptyThreads.length > 0) {
    recordDeletedThreadIds(emptyThreads.map((t) => t.id));
    const nextThreads = threads.filter((t) => !emptyThreads.includes(t));
    saveThreads(nextThreads);
  }

  setPendingFolderId(targetFolderId);
  removeActiveThreadId();
  window.dispatchEvent(new Event(CHAT_NEW_REQUESTED_EVENT));
}

export function getHistoryEntries(limit = 100): ChatHistoryEntry[] {
  const folders = ensureFolders();
  const allThreads = ensureThreads(folders);
  const threads = sortHistoryThreads(allThreads).slice(0, limit);
  const activeId = loadActiveThreadId();
  return mapThreadsToEntries(threads, activeId);
}

export function searchHistory(query: string, limit = 100): ChatHistoryEntry[] {
  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  const activeId = loadActiveThreadId();
  const normalizedQuery = query.toLowerCase();

  return mapThreadsToEntries(
    sortHistoryThreads(threads.filter((thread) => matchesHistoryQuery(thread, normalizedQuery))).slice(
      0,
      limit
    ),
    activeId
  );
}

export function selectHistoryEntry(entryId: string): void {
  const folders = ensureFolders();
  let threads = ensureThreads(folders);
  if (!threads.some((thread) => thread.id === entryId)) return;

  const emptyThreads = threads.filter(
    (t) => t.id !== entryId && t.messages.length === 0 && t.title === 'Neuer Chat'
  );
  if (emptyThreads.length > 0) {
    recordDeletedThreadIds(emptyThreads.map((t) => t.id));
    threads = threads.filter((t) => !emptyThreads.includes(t));
    saveThreadsAndActive(threads, entryId);
  } else {
    setActiveThreadId(entryId);
  }
}

export function deleteHistoryEntry(entryId: string): void {
  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  const filtered = threads.filter((thread) => thread.id !== entryId);
  if (filtered.length === threads.length) return;

  recordDeletedThreadIds([entryId]);

  if (filtered.length === 0) {
    const fresh = createEmptyThread(getDefaultFolderId(folders));
    saveThreadsAndActive([fresh], fresh.id);
    return;
  }

  if (loadActiveThreadId() === entryId) {
    saveThreadsAndActive(filtered, filtered[0].id);
  } else {
    saveThreads(filtered);
  }
}

export function togglePinnedHistoryEntry(entryId: string): void {
  const folders = ensureFolders();
  saveThreads(
    ensureThreads(folders).map((thread) =>
      thread.id === entryId ? { ...thread, pinned: !thread.pinned } : thread
    )
  );
}

export function renameHistoryEntry(entryId: string, title: string): void {
  const trimmed = title.trim();
  if (!trimmed) return;
  const folders = ensureFolders();
  saveThreads(
    ensureThreads(folders).map((thread) =>
      thread.id === entryId ? { ...thread, title: sanitizeTitle(trimmed) } : thread
    )
  );
}

export function createHistoryEntryFrom(entryId: string): void {
  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  const base = threads.find((thread) => thread.id === entryId);
  if (!base) return;

  const now = new Date();
  const copy: ChatThread = {
    id: createRuntimeId(),
    title: `${base.title} (Kopie)`,
    pinned: false,
    folderId: base.folderId,
    createdAt: now,
    updatedAt: now,
    messages: base.messages.map((message) => ({
      ...message,
      createdAt: new Date(message.createdAt),
    })),
  };

  saveThreadsAndActive([copy, ...threads], copy.id);
}

export function getActiveThreadFolder(): ChatFolder | null {
  const folders = ensureFolders();
  const active = getActiveThread();
  if (!active) return folders[0] ?? null;
  return folders.find((folder) => folder.id === active.folderId) ?? folders[0] ?? null;
}

export function getActiveThreadPromptAddition(): string {
  return getActiveThreadFolder()?.promptRules?.trim() ?? '';
}

export function getActiveThreadId(): string | null {
  return loadActiveThreadId();
}

export function getActiveThreadTitle(): string {
  const activeId = loadActiveThreadId();
  if (activeId === null) return 'Neuer Chat';

  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  return threads.find((thread) => thread.id === activeId)?.title ?? 'Neuer Chat';
}

function sortHistoryThreads(threads: ChatThread[]) {
  return threads.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

function mapThreadsToEntries(threads: ChatThread[], activeId: string | null): ChatHistoryEntry[] {
  return threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    pinned: thread.pinned,
    active: activeId !== null && thread.id === activeId,
    folderId: thread.folderId,
  }));
}

function matchesHistoryQuery(thread: ChatThread, query: string) {
  if (thread.title.toLowerCase().includes(query)) return true;
  return thread.messages.some((message) => message.content.toLowerCase().includes(query));
}

export {
  createChatFolder,
  createRuntimeId,
  deleteChatFolder,
  findOrCreateFolderByName,
  loadChatFolders,
  moveHistoryEntryToFolder,
  renameChatFolder,
  updateFolderPromptRules,
} from './historyFolderOperations';
