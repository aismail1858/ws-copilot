import {
  CHAT_ACTIVE_THREAD_STORAGE_KEY,
  CHAT_FOLDERS_STORAGE_KEY,
  CHAT_HISTORY_CHANGED_EVENT,
  CHAT_THREADS_STORAGE_KEY,
  DEFAULT_FOLDER_ID,
  LEGACY_MESSAGES_KEY,
  type ChatFolder,
  type ChatThread,
  type SerializedChatHistorySnapshot,
  type SerializedChatFolder,
  type SerializedChatMessage,
  type SerializedChatThread,
} from './historyTypes';

const _rawStorage = localStorage;

function _getInitialUserId(): string | null {
  try {
    const raw = _rawStorage.getItem('ws-copilot-auth-session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.user?.id ?? null;
  } catch {
    return null;
  }
}

let _currentUserId: string | null = _getInitialUserId();

export function setChatStorageUser(userId: string | null): void {
  if (_currentUserId === userId) return;
  _currentUserId = userId;
  if (userId) _migrateGlobalKeysIfNeeded(userId);
}

function _sk(base: string): string {
  return _currentUserId ? `${base}:${_currentUserId}` : base;
}

function _lsGet(key: string): string | null {
  return _rawStorage.getItem(_sk(key));
}

function _lsSet(key: string, value: string): void {
  _rawStorage.setItem(_sk(key), value);
}

function _lsRemove(key: string): void {
  _rawStorage.removeItem(_sk(key));
}

function _migrateGlobalKeysIfNeeded(userId: string): void {
  if (!userId) return;
  const flagKey = `ws-copilot-chat-keys-migrated:${userId}`;
  if (_rawStorage.getItem(flagKey)) return;

  const baseKeys = [
    CHAT_THREADS_STORAGE_KEY,
    CHAT_FOLDERS_STORAGE_KEY,
    CHAT_ACTIVE_THREAD_STORAGE_KEY,
    'ws-copilot-deleted-thread-ids',
    'ws-copilot-pending-folder-id',
    LEGACY_MESSAGES_KEY,
  ];

  for (const baseKey of baseKeys) {
    const globalData = _rawStorage.getItem(baseKey);
    if (globalData === null) continue;
    const scopedKey = `${baseKey}:${userId}`;
    if (_rawStorage.getItem(scopedKey) === null) {
      _rawStorage.setItem(scopedKey, globalData);
    }
    _rawStorage.removeItem(baseKey);
  }

  _rawStorage.setItem(flagKey, '1');
}

export function getActiveThread(): ChatThread | null {
  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  const activeId = ensureActiveThreadId(threads);

  const storedId = loadActiveThreadId();
  if (activeId !== null && activeId !== storedId) {
    setActiveThreadId(activeId);
  }

  return threads.find((thread) => thread.id === activeId) ?? null;
}

export function ensureThreads(folders: ChatFolder[]): ChatThread[] {
  const existing = loadThreads();
  if (existing.length > 0) {
    const normalized = normalizeThreadFolders(existing, folders);
    if (normalized.changed) saveThreads(normalized.threads);
    return normalized.threads;
  }

  const migrated = tryMigrateLegacyMessages(getDefaultFolderId(folders));
  if (migrated.length > 0) {
    saveThreads(migrated);
    setActiveThreadId(migrated[0].id);
    return migrated;
  }

  const initial = createEmptyThread(getDefaultFolderId(folders));
  saveThreads([initial]);
  setActiveThreadId(initial.id);
  return [initial];
}

export function ensureFolders(): ChatFolder[] {
  const loaded = loadFolders();
  const defaultFolder = loaded.find((folder) => folder.id === DEFAULT_FOLDER_ID || folder.isDefault);
  if (defaultFolder) {
    const normalized = loaded.map((folder) => ({
      ...folder,
      isDefault: folder.id === defaultFolder.id,
    }));
    if (defaultFolder.id !== DEFAULT_FOLDER_ID) {
      const next = normalized.map((folder) =>
        folder.id === defaultFolder.id ? { ...folder, id: DEFAULT_FOLDER_ID } : folder
      );
      saveFolders(next);
      return next;
    }
    return normalized;
  }

  const now = new Date();
  const fallback: ChatFolder = {
    id: DEFAULT_FOLDER_ID,
    name: 'Allgemein',
    promptRules: '',
    createdAt: now,
    updatedAt: now,
    isDefault: true,
  };
  saveFolders([fallback, ...loaded]);
  return [fallback, ...loaded];
}

export function ensureActiveThreadId(threads: ChatThread[]): string | null {
  const activeId = loadActiveThreadId();
  if (activeId === null) return null;
  if (threads.some((thread) => thread.id === activeId)) {
    return activeId;
  }
  return threads[0]?.id ?? null;
}

const PENDING_FOLDER_ID_KEY = 'ws-copilot-pending-folder-id';

export function getPendingFolderId(): string | null {
  return _lsGet(PENDING_FOLDER_ID_KEY);
}

export function setPendingFolderId(folderId: string | null): void {
  if (folderId) {
    _lsSet(PENDING_FOLDER_ID_KEY, folderId);
  } else {
    _lsRemove(PENDING_FOLDER_ID_KEY);
  }
}

export function removeActiveThreadId(): void {
  _lsRemove(CHAT_ACTIVE_THREAD_STORAGE_KEY);
  emitHistoryChanged();
}

export function resolveFolderId(folderId: string | undefined, folders: ChatFolder[]): string {
  if (folderId && folders.some((folder) => folder.id === folderId)) return folderId;
  return getDefaultFolderId(folders);
}

export function getDefaultFolderId(folders: ChatFolder[]): string {
  return folders.find((folder) => folder.isDefault)?.id ?? DEFAULT_FOLDER_ID;
}

export function loadThreads(): ChatThread[] {
  try {
    const raw = _lsGet(CHAT_THREADS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const threads: ChatThread[] = [];
    for (const candidate of parsed) {
      if (!isSerializedThread(candidate)) continue;
      const createdAt = new Date(candidate.createdAt);
      const updatedAt = new Date(candidate.updatedAt);
      if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) continue;

      const messages = candidate.messages
        .filter(isSerializedMessage)
        .map((message) => ({ ...message, createdAt: new Date(message.createdAt) }))
        .filter((message) => !Number.isNaN(message.createdAt.getTime()));

      threads.push({
        id: candidate.id,
        title: candidate.title || 'Neuer Chat',
        pinned: Boolean(candidate.pinned),
        folderId: candidate.folderId || DEFAULT_FOLDER_ID,
        createdAt,
        updatedAt,
        messages,
      });
    }

    return threads;
  } catch {
    return [];
  }
}

export function saveThreads(threads: ChatThread[]): void {
  const payload = serializeThreads(threads);
  _lsSet(CHAT_THREADS_STORAGE_KEY, JSON.stringify(payload));
  emitHistoryChanged();
}

export function saveThreadsAndActive(threads: ChatThread[], activeId: string): void {
  const payload = serializeThreads(threads);
  _lsSet(CHAT_THREADS_STORAGE_KEY, JSON.stringify(payload));
  _lsSet(CHAT_ACTIVE_THREAD_STORAGE_KEY, activeId);
  emitHistoryChanged();
}

export function loadChatHistorySnapshot(): SerializedChatHistorySnapshot {
  const folders = ensureFolders();
  const threads = ensureThreads(folders);
  const activeThreadId = ensureActiveThreadId(threads);
  return {
    schemaVersion: 1,
    threads: serializeThreads(threads),
    folders: serializeFolders(folders),
    activeThreadId,
    deletedThreadIds: loadDeletedThreadIds(),
    updatedAt: new Date().toISOString(),
  };
}

export function replaceChatHistorySnapshot(snapshot: SerializedChatHistorySnapshot): void {
  const activeThreadId = resolveSnapshotActiveThreadId(snapshot);
  _lsSet(CHAT_THREADS_STORAGE_KEY, JSON.stringify(snapshot.threads));
  _lsSet(CHAT_FOLDERS_STORAGE_KEY, JSON.stringify(snapshot.folders));
  if (activeThreadId) {
    _lsSet(CHAT_ACTIVE_THREAD_STORAGE_KEY, activeThreadId);
  } else {
    _lsRemove(CHAT_ACTIVE_THREAD_STORAGE_KEY);
  }
  saveDeletedThreadIds(snapshot.deletedThreadIds ?? []);
  emitHistoryChanged();
}

export function mergeChatHistorySnapshots(
  local: SerializedChatHistorySnapshot,
  remote: SerializedChatHistorySnapshot
): SerializedChatHistorySnapshot {
  const remoteHasContent = remote.threads.some((thread) => thread.messages.length > 0);
  const localThreads = remoteHasContent ? local.threads.filter((thread) => !isEmptyDefaultThread(thread)) : local.threads;
  const mergedDeleted = new Set([...(local.deletedThreadIds ?? []), ...(remote.deletedThreadIds ?? [])]);
  const threads = mergeById(localThreads, remote.threads, getThreadTimestamp)
    .filter((thread) => !mergedDeleted.has(thread.id))
    .sort((left, right) => getThreadTimestamp(right) - getThreadTimestamp(left));
  const folders = mergeById(local.folders, remote.folders, getFolderTimestamp);
  return {
    schemaVersion: 1,
    threads,
    folders,
    activeThreadId: pickActiveThreadId(local.activeThreadId, remote.activeThreadId, threads),
    deletedThreadIds: pruneTombstones(Array.from(mergedDeleted)),
    updatedAt: new Date().toISOString(),
  };
}

function serializeThreads(threads: ChatThread[]): SerializedChatThread[] {
  return threads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    pinned: thread.pinned,
    folderId: thread.folderId,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    messages: thread.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt.toISOString(),
    })),
  }));
}

export function loadFolders(): ChatFolder[] {
  try {
    const raw = _lsGet(CHAT_FOLDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    const folders: ChatFolder[] = [];
    for (const candidate of parsed) {
      if (!isSerializedFolder(candidate)) continue;
      const createdAt = new Date(candidate.createdAt);
      const updatedAt = new Date(candidate.updatedAt);
      if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) continue;

      folders.push({
        id: candidate.id,
        name: candidate.name,
        promptRules: (candidate.promptRules ?? '').trim(),
        createdAt,
        updatedAt,
        isDefault: Boolean(candidate.isDefault),
      });
    }
    return folders;
  } catch {
    return [];
  }
}

export function saveFolders(folders: ChatFolder[]): void {
  const payload = serializeFolders(folders);
  _lsSet(CHAT_FOLDERS_STORAGE_KEY, JSON.stringify(payload));
  emitHistoryChanged();
}

function serializeFolders(folders: ChatFolder[]): SerializedChatFolder[] {
  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    promptRules: folder.promptRules,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
    isDefault: folder.isDefault,
  }));
}

export function loadActiveThreadId(): string | null {
  return _lsGet(CHAT_ACTIVE_THREAD_STORAGE_KEY);
}

export function setActiveThreadId(threadId: string): void {
  _lsSet(CHAT_ACTIVE_THREAD_STORAGE_KEY, threadId);
  emitHistoryChanged();
}

export function emitHistoryChanged(): void {
  window.dispatchEvent(new Event(CHAT_HISTORY_CHANGED_EVENT));
}

const DELETED_THREADS_KEY = 'ws-copilot-deleted-thread-ids';
const TOMBSTONE_MAX = 200;

export function loadDeletedThreadIds(): string[] {
  try {
    const raw = _lsGet(DELETED_THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function saveDeletedThreadIds(ids: string[]): void {
  _lsSet(DELETED_THREADS_KEY, JSON.stringify(pruneTombstones(ids)));
}

export function recordDeletedThreadIds(ids: string[]): void {
  const existing = loadDeletedThreadIds();
  const merged = new Set([...existing, ...ids]);
  saveDeletedThreadIds(Array.from(merged));
}

export function pruneTombstones(ids: string[]): string[] {
  return ids.slice(-TOMBSTONE_MAX);
}

export function createEmptyThread(folderId: string): ChatThread {
  const now = new Date();
  return {
    id: createId(),
    title: 'Neuer Chat',
    pinned: false,
    folderId,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function sanitizeTitle(content: string): string {
  const compact = content.replace(/\s+/g, ' ').trim();
  if (!compact) return 'Neuer Chat';
  const words = compact.split(' ');
  if (words.length > 8) return words.slice(0, 8).join(' ');
  return compact;
}

const LEADING_FILLER_RE = /^(den|der|die|das|ein|eine|einen|von|zu|im|in|am|auf|aus|mit|fuer|zur|zum|des|dem)\s+/i;

function stripLeadingFiller(text: string): string {
  let prev = '';
  while (prev !== text) {
    prev = text;
    text = text.replace(LEADING_FILLER_RE, '').trim();
  }
  return text;
}

export function capitalizeFirst(text: string): string {
  if (!text) return text;
  return text[0].toUpperCase() + text.slice(1);
}

export function deriveFallbackThreadTitle(firstMessage: string): string {
  const withoutCodeBlocks = firstMessage.replace(/```[\s\S]*?```/g, ' ');
  const withoutInlineCode = withoutCodeBlocks.replace(/`[^`]*`/g, ' ');
  const normalized = withoutInlineCode.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return 'Chat';
  }

  const firstSentence = normalized.split(/[.!?]/, 1)[0]?.trim() || normalized;
  const topic = stripFallbackTitleLeadIn(firstSentence);
  const truncatedWords = firstSentence
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 12)
    .join(' ')
    .trim();
  const topicWords = (topic || truncatedWords)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
    .join(' ')
    .trim();
  const shortened = (topicWords || truncatedWords || firstSentence).trim();
  let cleaned = shortened.replace(/^[`"'([{]+/, '').replace(/[`"')\]}:;,.!?\s]+$/, '').trim();
  cleaned = stripLeadingFiller(cleaned);
  return capitalizeFirst(cleaned) || 'Chat';
}

function stripFallbackTitleLeadIn(value: string): string {
  return value
    .replace(/^(kannst\s+du|kannst|koenntest\s+du|bitte|please)\s+/i, '')
    .replace(/^(mir|uns|fuer\s+mich|fuer\s+uns)\s+/i, '')
    .replace(/^(bitte|mal|kurz)\s+/i, '')
    .replace(/^(erklaere|erklaer|erkläre|hilfe\s+bei|hilf\s+mir\s+bei|zeig\s+mir|show\s+me)\s+/i, '')
    .replace(/^(was\s+ist|was\s+sind|wie\s+funktioniert|warum|wieso|weshalb)\s+/i, '')
    .replace(/^(der|die|das|eine|einen|ein)\s+/i, '')
    .replace(/\s+(erklaeren|erklaerung|erklären)$/i, '')
    .trim();
}

function normalizeThreadFolders(
  threads: ChatThread[],
  folders: ChatFolder[]
): { threads: ChatThread[]; changed: boolean } {
  const knownIds = new Set(folders.map((folder) => folder.id));
  const fallback = getDefaultFolderId(folders);
  let changed = false;

  const next = threads.map((thread) => {
    if (knownIds.has(thread.folderId)) return thread;
    changed = true;
    return { ...thread, folderId: fallback };
  });

  return { threads: next, changed };
}

function tryMigrateLegacyMessages(defaultFolderId: string): ChatThread[] {
  try {
    const raw = _lsGet(LEGACY_MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SerializedChatMessage[];
    const messages = parsed.map((message) => ({
      ...message,
      createdAt: new Date(message.createdAt),
    }));
    _lsRemove(LEGACY_MESSAGES_KEY);
    if (messages.length === 0) return [];

    const firstUser = messages.find((message) => message.role === 'user');
    const title = firstUser ? sanitizeTitle(firstUser.content) : 'Neuer Chat';
    return [
      {
        id: createId(),
        title,
        pinned: false,
        folderId: defaultFolderId,
        createdAt: messages[0].createdAt,
        updatedAt: messages[messages.length - 1].createdAt,
        messages,
      },
    ];
  } catch {
    return [];
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveSnapshotActiveThreadId(snapshot: SerializedChatHistorySnapshot): string | null {
  const active = snapshot.activeThreadId;
  if (active && snapshot.threads.some((thread) => thread.id === active)) return active;
  return snapshot.threads[0]?.id ?? null;
}

function pickActiveThreadId(
  localActiveId: string | null,
  remoteActiveId: string | null,
  threads: SerializedChatThread[]
): string | null {
  if (localActiveId && threads.some((thread) => thread.id === localActiveId)) return localActiveId;
  if (remoteActiveId && threads.some((thread) => thread.id === remoteActiveId)) return remoteActiveId;
  return threads[0]?.id ?? null;
}

function mergeById<T extends { id: string }>(
  localItems: T[],
  remoteItems: T[],
  getTimestamp: (item: T) => number
): T[] {
  const items = new Map<string, T>();
  for (const item of remoteItems) items.set(item.id, item);
  for (const item of localItems) {
    const existing = items.get(item.id);
    if (!existing || getTimestamp(item) >= getTimestamp(existing)) items.set(item.id, item);
  }
  return Array.from(items.values());
}

function getThreadTimestamp(thread: SerializedChatThread): number {
  return Date.parse(thread.updatedAt) || Date.parse(thread.createdAt) || 0;
}

function getFolderTimestamp(folder: SerializedChatFolder): number {
  return Date.parse(folder.updatedAt) || Date.parse(folder.createdAt) || 0;
}

function isEmptyDefaultThread(thread: SerializedChatThread): boolean {
  return thread.messages.length === 0 && thread.title === 'Neuer Chat';
}

function isSerializedThread(value: unknown): value is SerializedChatThread {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SerializedChatThread>;
  if (!item.id || typeof item.id !== 'string') return false;
  if (!item.title || typeof item.title !== 'string') return false;
  if (typeof item.createdAt !== 'string') return false;
  if (typeof item.updatedAt !== 'string') return false;
  return Array.isArray(item.messages);
}

function isSerializedFolder(value: unknown): value is SerializedChatFolder {
  if (!value || typeof value !== 'object') return false;
  const folder = value as Partial<SerializedChatFolder>;
  if (!folder.id || typeof folder.id !== 'string') return false;
  if (!folder.name || typeof folder.name !== 'string') return false;
  if (typeof folder.createdAt !== 'string') return false;
  return typeof folder.updatedAt === 'string';
}

function isSerializedMessage(value: unknown): value is SerializedChatMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<SerializedChatMessage>;
  if (typeof message.id !== 'string') return false;
  if (message.role !== 'user' && message.role !== 'assistant') return false;
  if (typeof message.content !== 'string') return false;
  return typeof message.createdAt === 'string';
}
