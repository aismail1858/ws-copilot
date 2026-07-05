// Hook: Chat-Modell-Auswahl aus dem admin-gepflegten app_models-Katalog (purpose=chat).
// Der Katalog kommt via GET /api/models; der Nutzer-Default via /auth/me + PUT /api/me/model.
// Auswahl wird im Shared-Store (chat/selectedModel) abgelegt, den useChat beim Senden liest.

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { modelsApi, type AppModel } from '@/lib/api/models';
import {
  getSelectedModelId,
  setSelectedModelId,
  getSelectedModelEventName,
} from '@/chat/selectedModel';

export function useChatModels() {
  const { user } = useAuth();
  const [models, setModels] = useState<AppModel[]>([]);
  const [selectedModelId, setSelectedState] = useState<string | null>(getSelectedModelId());

  // Aktivierte Chat-Modelle laden
  useEffect(() => {
    let alive = true;
    modelsApi
      .listEnabled()
      .then((res) => {
        if (alive) setModels((res.models || []).filter((m) => m.purpose === 'chat'));
      })
      .catch(() => {
        if (alive) setModels([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Server-Default übernehmen, falls lokal noch nichts gewählt ist
  useEffect(() => {
    const serverDefault = user?.default_chat_model_id ?? null;
    if (!getSelectedModelId() && serverDefault) {
      setSelectedModelId(serverDefault);
      setSelectedState(serverDefault);
    }
  }, [user]);

  // Auf Änderungen von außen reagieren (z. B. anderer Tab)
  useEffect(() => {
    const handler = () => setSelectedState(getSelectedModelId());
    window.addEventListener(getSelectedModelEventName(), handler);
    return () => window.removeEventListener(getSelectedModelEventName(), handler);
  }, []);

  const selectModel = useCallback((model_id: string | null) => {
    setSelectedModelId(model_id);
    setSelectedState(model_id);
    modelsApi.setMyModel(model_id).catch(() => {
      // lokal bleibt die Auswahl trotzdem erhalten
    });
  }, []);

  return { models, selectedModelId, selectModel };
}
