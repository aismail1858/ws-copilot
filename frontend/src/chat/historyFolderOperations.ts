import type { ChatFolder } from './historyTypes';
import {
  ensureFolders,
  ensureThreads,
  getDefaultFolderId,
  resolveFolderId,
  saveFolders,
  saveThreads,
} from './historyStorage';

export function loadChatFolders(): ChatFolder[] {
  return ensureFolders().slice().sort(sortFolders);
}

export function createChatFolder(name: string, promptRules = ''): ChatFolder | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  const folders = ensureFolders();
  const existing = folders.find((folder) => folder.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing;

  const now = new Date();
  const folder: ChatFolder = {
    id: createRuntimeId(),
    name: trimmed,
    promptRules: promptRules.trim(),
    createdAt: now,
    updatedAt: now,
    isDefault: false,
  };

  saveFolders([...folders, folder]);
  return folder;
}

export function renameChatFolder(folderId: string, nextName: string): void {
  const trimmed = nextName.trim();
  if (!trimmed) return;
  const folders = ensureFolders();
  saveFolders(
    folders.map((folder) =>
      folder.id === folderId && !folder.isDefault
        ? { ...folder, name: trimmed, updatedAt: new Date() }
        : folder
    )
  );
}

export function updateFolderPromptRules(folderId: string, promptRules: string): void {
  const folders = ensureFolders();
  saveFolders(
    folders.map((folder) =>
      folder.id === folderId
        ? { ...folder, promptRules: promptRules.trim(), updatedAt: new Date() }
        : folder
    )
  );
}

export function deleteChatFolder(folderId: string): void {
  const folders = ensureFolders();
  const target = folders.find((folder) => folder.id === folderId);
  if (!target || target.isDefault) return;

  const nextFolders = folders.filter((folder) => folder.id !== folderId);
  const fallbackId = getDefaultFolderId(folders);
  saveFolders(nextFolders);
  saveThreads(
    ensureThreads(nextFolders).map((thread) =>
      thread.folderId === folderId ? { ...thread, folderId: fallbackId } : thread
    )
  );
}

export function findOrCreateFolderByName(name: string): ChatFolder | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const folders = ensureFolders();
  const existing = folders.find((folder) => folder.name.toLowerCase() === trimmed.toLowerCase());
  return existing ?? createChatFolder(trimmed);
}

export function moveHistoryEntryToFolder(entryId: string, folderId: string): void {
  const folders = ensureFolders();
  const targetFolderId = resolveFolderId(folderId, folders);
  saveThreads(
    ensureThreads(folders).map((thread) =>
      thread.id === entryId ? { ...thread, folderId: targetFolderId } : thread
    )
  );
}

function sortFolders(left: ChatFolder, right: ChatFolder) {
  if (left.isDefault !== right.isDefault) return left.isDefault ? 1 : -1;
  return left.name.localeCompare(right.name, 'de', { sensitivity: 'base' });
}

export function createRuntimeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
