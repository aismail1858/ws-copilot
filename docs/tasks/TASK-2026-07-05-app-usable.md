---
task_id: TASK-2026-07-05-app-usable
title: "Anwendung nutzbar machen (Login + Chat erreichbar); Ingestion/RAG-Gap dokumentiert"
status: DONE
priority: HIGH
owner: Agent
created_at: 2026-07-05
updated_at: 2026-07-05
phase: webapp + infra
kb_references: [KB-011, KB-013]
adr_references: []
---

# Ziel
Die Webapp so weit "nutzbar" machen, dass **Login + Chat + Settings** erreichbar und funktional
sind (Meilenstein 1). Die verbleibende Lücke (Ingestion-Phantom-API, RAG-Stub) sauber als
Entscheidung dokumentieren (Meilenstein 2 — braucht User-Entscheidung, siehe unten).

# Kontext / Befund
Verifizierter Ist-Zustand (nicht aus Doku, sondern aus Code + Runtime-Probe 2026-07-05):
- Backend kompiliert (`py_compile` clean); `AuthContext` läuft **cookie-basiert** (`/api/auth/me`,
  `/api/auth/login` via `apiClient`). Backend `_decode_token` liest **Cookie zuerst, dann Bearer**
  (`jwtAuth.py:54-66`) → Cookie-Auth gilt für ALLE Routen inkl. `/api/v1/*`.
- **Break:** Live-Chat-Pfad `App.tsx` → `ChatPage` → `useChat` → `queryRAGStream` → `fetchWithAuth`
  (`api/core.ts:232`) warf hart `'Not authenticated'`, weil `AuthContext` nie ein Bearer-Token im
  localStorage ablegt. Chat + Upload + Settings-Sync schlugen sofort fehl (OQ-ARCH-001 / KB-011).
- `.env`: `REQUESTY_API_KEY=` leer; `REDIS_URL=redis://localhost:6379/0` bereits korrekt für lokal;
  lokales Redis läuft (`PONG`).
- `schema.sql`: `processing_status`-CHECK veraltet (OQ-ARCH-004); `roles`-Tabelle vorhanden, aber
  Schema ist nicht auf der Supabase-DB angewendet (`/auth/me` joint `roles!users_role_fk`).
- Sidebar `/ingestion` war `adminOnly`, Route erlaubt aber `team_lead` (OQ-ARCH-003).

# Scope
- In Scope:
  - Cookie-Auth im Frontend-`fetchWithAuth`/`postFormWithAuthProgress` nutzbar machen (Gate entfernen,
    `credentials:'include'`/`withCredentials`, Bearer optional) — OQ-ARCH-001 (praktischer Teil).
  - `processing_status`-CHECK in `schema.sql` auf Code-Werte + idempotentes Repair-Statement (OQ-ARCH-004).
  - Sidebar `/ingestion`: `adminOnly` → `minTier:'team_lead'` (OQ-ARCH-003).
  - Type-Check (`tsc --noEmit`) clean.
  - Run-Anleitung + Supabase-Apply-SQL (idempotent, über `schema.sql`).
  - Doku (KB-013, Status, OQ-Resolution, RETRO).
- Out of Scope (Meilenstein 2 — braucht User-Entscheidung, siehe "Folge-Entscheidung"):
  - Ingestion: `api/ingestion.ts` spricht Phantom-API `/api/v1/documents/*`, die im Backend NICHT
    existiert. Echtes Backend ist `/api/projects/{pid}/files/upload-url`+`/confirm`.
  - RAG: `/api/v1/rag/query` (`ragRoutes.py:90`) ist ein zustandsloser LLM-Stub ohne
    `retrieve_context`/Vektorsuche und ohne Requesty-Anbindung (nutzt google/openai/... direkt).
  - SettingsModal-Verdrahtung (OQ-ARCH-006), Projekt-Chat-`:chatId` (OQ-ARCH-002),
    SourceView projektlos (OQ-ARCH-005).

# Aufgaben
- [x] Quellen-Review (Status/Error-Log/OQ/KB)
- [x] `frontend/src/api/core.ts`: `fetchWithAuth` + `postFormWithAuthProgress` cookie-tauglich
- [x] `backend/supabase/schema.sql`: `processing_status`-CHECK + Repair-Block
- [x] `frontend/src/features/sidebar/components/sidebarNavItems.tsx`: Ingestion `minTier:'team_lead'`
- [x] Verify: `tsc --noEmit` clean (vite build in WSL blockiert durch rolldown-Native-Binding, s. RETRO)
- [x] Run-Anleitung + Apply-Hinweis
- [x] Doku (KB-013, project-status, OQ-Resolution, RETRO, Summary)

# Akzeptanzkriterien
1. Nach Cookie-Login werden `/api/v1/*`-Aufrufe (Chat/Settings) authentifiziert mitgeschickt (kein
   hartes `'Not authenticated'` mehr bei fehlendem localStorage-Token).
2. `schema.sql` erlaubt die vom Code geschriebenen `processing_status`-Werte + repariert Altbestand.
3. Sidebar-Menü „Ingestion" sichtbar für `team_lead` (konsistent mit Route + Backend).
4. `tsc --noEmit` ohne Fehler.

# Abhaengigkeiten (User-Seite, Human-Approval)
1. **Supabase-Schema anwenden:** Inhalt von `backend/supabase/schema.sql` im Supabase SQL-Editor
   ausführen (idempotent). Sonst schlägt `/auth/me` am fehlenden `roles`-Join fehl.
2. **Backend-Deps + Start:** `cd backend && poetry install && uvicorn src.server:app --reload
   --reload-exclude logs --port 8000` (LM-001). Celery-Worker für Ingestion:
   `celery -A src.services.celery worker -l info`.
3. **Frontend-Start:** `cd frontend && npm run dev` (Port 5173).
4. **LLM für Chat:** In `/settings` (admin) Provider + API-Key + Modell setzen — Default
   `llmProvider='gemini'` ohne Key liefert keine Antwort. Requesty via Provider `custom`
   (`customLlmUrl=REQUESTY_BASE_URL`, Key, `gpt-4o`) oder echten OpenAI/Google-Key.

# Risiken
- Cross-Origin-Cookies (5173→8000): funktionieren via `credentials:'include'` + Backend-CORS
  (`allow_credentials=True`, `5173` erlaubt) + `SameSite=Lax`/gleicher Host `localhost`. Fallback
  bei 401: `backendUrl` im Settings-UI leeren → Aufrufe laufen same-origin über den Vite-Proxy.
- Meilenstein 2 (Ingestion/RAG) ist **nicht** durch diese Task gelöst — siehe "Folge-Entscheidung".

# Folge-Entscheidung (Meilenstein 2 — User wählt)
Echte End-to-End-Nutzbarkeit (Chat mit echten Dokumenten-Quellen + Upload) erfordert, dass die
Ingestion-/RAG-Lücke geschlossen wird. Zwei Pfade:
- **(A) Backend ergänzen:** `/api/v1/documents/*` (ingest/jobs/documents) + `/api/v1/rag/query` an
  echten RAG (`retrieve_context`) + Requesty (`services/llm.py`) anbinden. Frontend bleibt.
- **(B) Frontend umleiten:** Live-Chat/Upload auf das bestehende cookie-basierte Backend umstellen
  (`/api/chats/{cid}/messages/stream` via A0/A1-`streamChat.ts`; `/api/projects/{pid}/files/*`).
  Dann `/api/v1/*`-Layer + `useChat`-Rewert abandonen.
Entscheidung offen → siehe `docs/open-questions.md` OQ-ARCH-001 (Rest) + neue OQ-ARCH-007.

# Betroffene Dateien
- `frontend/src/api/core.ts`
- `backend/supabase/schema.sql`
- `frontend/src/features/sidebar/components/sidebarNavItems.tsx`

# DoD-Checkliste
- [x] Akzeptanzkriterien erfuellt
- [x] Checks ausgefuehrt (`tsc --noEmit`)
- [x] Dokumentation aktualisiert (KB-013, project-status, open-questions)
- [x] Summary in `docs/implementation-summaries.md`
- [x] `docs/project-status.md` aktualisiert
- [x] Fehler-Retrospektive in `docs/error-log.md`
