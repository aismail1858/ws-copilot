import { apiClient } from "./index";
import type { LlmPurpose } from "../types";

export interface AppModel {
  id: string;
  label: string;
  model_id: string;
  purpose: LlmPurpose;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ModelCreateInput {
  label: string;
  model_id: string;
  purpose?: LlmPurpose;
  enabled?: boolean;
  sort_order?: number;
}

export interface ModelUpdateInput {
  label?: string;
  model_id?: string;
  purpose?: LlmPurpose;
  enabled?: boolean;
  sort_order?: number;
}

export const modelsApi = {
  listAll: () => apiClient.get<{ models: AppModel[] }>("/api/admin/models"),
  listEnabled: () => apiClient.get<{ models: AppModel[] }>("/api/models"),
  getMyModel: () =>
    apiClient.get<{ model_id: string | null }>("/api/me/model"),
  setMyModel: (model_id: string | null) =>
    apiClient.put<{ model_id: string | null }>("/api/me/model", { model_id }),
  test: (id: string) =>
    apiClient.post<{ ok: boolean; latency_ms?: number; error?: string; model_id: string }>(
      `/api/admin/models/${id}/test`
    ),
  create: (data: ModelCreateInput) =>
    apiClient.post<{ message: string; model: AppModel }>("/api/admin/models", data),
  update: (id: string, data: ModelUpdateInput) =>
    apiClient.patch<{ message: string; model: AppModel }>(`/api/admin/models/${id}`, data),
  remove: (id: string) =>
    apiClient.delete<{ message: string }>(`/api/admin/models/${id}`),
};
