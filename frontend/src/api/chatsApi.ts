import { apiClient } from '../lib/api';
import type { Chat, Message } from '../lib/types';

interface ChatCreateResponse {
  message: string;
  data: Chat;
}

interface ChatWithMessages extends Chat {
  messages?: Message[];
  project_id?: string;
}

interface ChatGetResponse {
  message: string;
  data: ChatWithMessages;
}

export async function createChat(params: { title: string; projectId?: string }): Promise<Chat> {
  const body: Record<string, string> = { title: params.title };
  if (params.projectId) body.project_id = params.projectId;
  const res = await apiClient.post<ChatCreateResponse>('/api/chats/', body);
  return res.data;
}

export async function getChat(chatId: string): Promise<{ chat: ChatWithMessages; messages: Message[] }> {
  const res = await apiClient.get<ChatGetResponse>(`/api/chats/${chatId}`);
  return {
    chat: res.data,
    messages: res.data.messages ?? [],
  };
}

export async function listProjectChats(projectId: string): Promise<Chat[]> {
  const res = await apiClient.get<{ data: Chat[] }>(`/api/projects/${projectId}/chats`);
  return res.data ?? [];
}

export async function deleteChat(chatId: string): Promise<void> {
  await apiClient.delete(`/api/chats/${chatId}`);
}
