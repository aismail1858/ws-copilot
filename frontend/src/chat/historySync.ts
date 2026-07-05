import { useEffect, useRef, type MutableRefObject } from 'react';
import { fetchChatHistorySnapshot, saveChatHistorySnapshot } from '../api/chatHistory';
import {
  CHAT_HISTORY_CHANGED_EVENT,
} from './historyTypes';
import {
  loadChatHistorySnapshot,
  mergeChatHistorySnapshots,
  replaceChatHistorySnapshot,
  setChatStorageUser,
} from './historyStorage';
import { useAuth } from '../context/AuthContext';

const SYNC_DEBOUNCE_MS = 600;

export function useChatHistorySync(): void {
  const { user } = useAuth();
  const hydratedUserRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setChatStorageUser(null);
      hydratedUserRef.current = null;
      return;
    }
    setChatStorageUser(userId);
    hydrateFromServer(userId, hydratedUserRef);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;
    const push = () => scheduleServerPush(userId, hydratedUserRef, timerRef);
    window.addEventListener(CHAT_HISTORY_CHANGED_EVENT, push);
    return () => {
      window.removeEventListener(CHAT_HISTORY_CHANGED_EVENT, push);
      clearPendingPush(timerRef);
    };
  }, [userId]);
}

async function hydrateFromServer(
  userId: string,
  hydratedUserRef: MutableRefObject<string | null>
): Promise<void> {
  try {
    const local = loadChatHistorySnapshot();
    const remote = await fetchChatHistorySnapshot();
    const merged = mergeChatHistorySnapshots(local, remote);
    replaceChatHistorySnapshot(merged);
    hydratedUserRef.current = userId;
    await saveChatHistorySnapshot(merged);
  } catch {
    hydratedUserRef.current = userId;
  }
}

function scheduleServerPush(
  userId: string,
  hydratedUserRef: MutableRefObject<string | null>,
  timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
): void {
  if (hydratedUserRef.current !== userId) return;
  clearPendingPush(timerRef);
  timerRef.current = setTimeout(() => {
    timerRef.current = null;
    const snapshot = loadChatHistorySnapshot();
    saveChatHistorySnapshot(snapshot).catch(() => {});
  }, SYNC_DEBOUNCE_MS);
}

function clearPendingPush(
  timerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
): void {
  if (!timerRef.current) return;
  clearTimeout(timerRef.current);
  timerRef.current = null;
}
