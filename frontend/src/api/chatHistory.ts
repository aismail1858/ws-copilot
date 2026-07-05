import { fetchWithAuth } from './core';
import type { SerializedChatHistorySnapshot } from '@/chat/historyTypes';

export async function fetchChatHistorySnapshot(): Promise<SerializedChatHistorySnapshot> {
  console.info('[chat-history] fetching snapshot from server');
  try {
    const res = await fetchWithAuth('/api/v1/me/chat-history');
    if (!res.ok) {
      console.error('[chat-history] fetch failed', { status: res.status, statusText: res.statusText, url: res.url });
      throw new Error(`Chat history fetch failed (${res.status})`);
    }
    const data = await res.json();
    console.info('[chat-history] fetch success', {
      threadCount: data.threads?.length ?? 0,
      folderCount: data.folders?.length ?? 0,
      activeThreadId: data.activeThreadId,
    });
    return data;
  } catch (error) {
    console.error('[chat-history] fetch error', error);
    throw error;
  }
}

export async function saveChatHistorySnapshot(
  snapshot: SerializedChatHistorySnapshot
): Promise<SerializedChatHistorySnapshot> {
  const threadCount = snapshot.threads?.length ?? 0;
  const folderCount = snapshot.folders?.length ?? 0;
  console.info('[chat-history] saving snapshot to server', { threadCount, folderCount, activeThreadId: snapshot.activeThreadId });
  try {
    const res = await fetchWithAuth('/api/v1/me/chat-history', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (!res.ok) {
      console.error('[chat-history] save failed', { status: res.status, statusText: res.statusText, url: res.url });
      throw new Error(`Chat history save failed (${res.status})`);
    }
    const data = await res.json();
    console.info('[chat-history] save success', { threadCount: data.threads?.length ?? 0, updatedAt: data.updatedAt });
    return data;
  } catch (error) {
    console.error('[chat-history] save error', error);
    throw error;
  }
}
