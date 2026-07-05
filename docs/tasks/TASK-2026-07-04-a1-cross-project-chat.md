---
task_id: TASK-2026-07-04-a1-cross-project-chat
title: "A1: Projektloser, user-scoped Chat (cross-Projekt via accessible_document_ids)"
status: DONE
priority: HIGH
owner: Agent
created_at: 2026-07-04
updated_at: 2026-07-04
phase: backend/chat
kb_references: [KB-007, KB-008]
adr_references: [ADR-004, ADR-001]
---

# Ziel
Den Chat projektlos machen: ein user-scoped Chat, der bei jeder Frage über **alle zugänglichen** Dokumente sucht (cross-Projekt, ADR-001 `accessible_document_ids`), ohne Projekt-Auswahl im UX.

# Scope
- In Scope:
  - `retrieval.utils`: `DEFAULT_PROJECT_SETTINGS` + `get_effective_settings(project_id)` (Defaults bei projektlosem Chat)
  - `retrieval.index`: nutzt `get_effective_settings` (project_id=None sicher)
  - `services/chat_streaming.py` (NEU): projektloser SSE-Stream, extrahiert aus projectRoutes-Logik (DRY), user_id durchgereicht → cross-Projekt-Suche
  - `chatRoutes.py`: neue Route `POST /api/chats/{chat_id}/messages/stream` (Ownership-Check + Settings-Anker aus chat.project_id)
  - `models.ChatCreate.project_id` Optional
  - Frontend: `useChat()` ohne projectId, `streamChat` → `/api/chats/{cid}/messages/stream`, `ChatPage` ohne Projekt-Selector
- Out of Scope:
  - Stufe B (ephemerale In-Chat-Uploads), Stufe C (RBAC-Sharing UX auf Projekte) — ADR-004
  - Konsolidierung der alten projectRoutes-Stream-Route mit dem neuen Helper (Legacy bleibt unangetastet, läuft weiter)
  - Settings-UI für Default-Settings (Werte in Code, später Admin-Seite)

# Checkpoint-Review (AGENTS.md §1)
- `error-log.md`: LM-001..009 gelesen. LM-009 (SSE-Vertrag) direkt angewendet — A1-Stream emittiert dasselbe event-Set wie A0 (Kompatibilität zum Frontend-Parser erhalten).
- `decisions.md`: ADR-001 (ACCEPTED, `accessible_document_ids` existiert), ADR-004 (Stufenmodell).
- **Schlüsselerkenntnis:** `retrieve_context` war bereits user-scoped (`retrieval/index.py:37-41`) — bei gesetztem `user_id` wird `get_accessible_document_ids(user_id)` verwendet. Die A0-Route hat also schon cross-Projekt gesucht; `project_id` war nur Settings-Anker. Damit war A1 kleiner als ursprünglich angenommen.
- `schema.sql:73`: `chats.project_id` ist bereits nullable → **keine Schema-Migration nötig**.

# Aufgaben
- [x] Task anlegen + Checkpoint-Review
- [x] Default-Settings + `get_effective_settings` (retrieval.utils)
- [x] retrieval.index auf `get_effective_settings` umgestellt
- [x] `services/chat_streaming.py` (NEU, projektfrei)
- [x] Neue Route `POST /api/chats/{chat_id}/messages/stream` (chatRoutes)
- [x] `ChatCreate.project_id` Optional
- [x] Frontend: `useChat()`/`streamChat`/`ChatPage` projektlos
- [x] Verify: `py_compile` (Backend) + `npm run build` (Frontend)

# Akzeptanzkriterien
1. Chat kann ohne `project_id` erstellt werden (`POST /api/chats/ {title}`) — **erfüllt** (models Optional, schema nullable)
2. Stream-Endpunkt `POST /api/chats/{chat_id}/messages/stream` existiert und sucht cross-Projekt über `accessible_document_ids(user_id)` — **erfüllt** (`chat_streaming.py` + Route)
3. Projektlose Settings laufen über Defaults (`get_effective_settings`) — **erfüllt**
4. Frontend hat keinen Projekt-Selector mehr; `useChat()` ohne projectId — **erfüllt**
5. `npm run build` clean + `py_compile` OK — **erfüllt**

# Abhaengigkeiten
- Phase-1-Infra (Human-Approval) — wie A0, für Runtime-E2E.
- `accessible_document_ids` RPC (ADR-001, Migration `20260704000001_rbac_quellen.sql` muss angewendet sein).

# Risiken
- **Default-Settings sind gehardcoded** (`retrieval.utils.DEFAULT_PROJECT_SETTINGS`). Strategie=hybrid, Threshold=0.5 etc. Später via Admin-Seite konfigurierbar (KB-002 app_models). Für A1-Test ausreichend.
- **Zwei Stream-Routen** (alt projectRoutes + neu chatRoutes) mit ähnlicher Logik — bewusst nicht konsolidiert, um A0 nicht zu gefährden. Cleanup als Folge.

# Betroffene Dateien
- `backend/src/rag/retrieval/utils.py` (+DEFAULT_PROJECT_SETTINGS, +get_effective_settings)
- `backend/src/rag/retrieval/index.py` (get_effective_settings)
- `backend/src/services/chat_streaming.py` (NEU)
- `backend/src/routes/chatRoutes.py` (+Route, imports, Optional handling)
- `backend/src/models/index.py` (ChatCreate.project_id Optional)
- `frontend/src/api/streamChat.ts` (Ziel-URL `/api/chats/{cid}/messages/stream`)
- `frontend/src/api/chatsApi.ts` (projectId optional)
- `frontend/src/hooks/useChat.ts` (projektlos)
- `frontend/src/pages/ChatPage.tsx` (ohne Selector)
- Doku: `decisions.md` (ADR-004), `implementation-summaries.md`, `project-status.md`, `error-log.md`, `knowledge-base.md`

# Size-Hinweis (AGENTS.md §7.1)
- `_run_agent_stream` (chat_streaming.py) ~50 Zeilen — direkte Extraktion der bestehenden astream_events-Schleife aus projectRoutes. [SIZE-EXCEPTION: SSE-Generator-Kontext muss geschlossen bleiben; Aufteilung wuerde den single-yield-Vertrag brechen. Entspricht 1:1 demLegacy-Pattern.]

# Bekannte Fehler aus error-log.md für diesen Task
- LM-009: SSE-Vertrag vor Client-Änderung verifiziert — event-Set + Citation-Ablage identisch zu A0 gehalten, kein Parser-Bruch.
- LM-002/LM-007: Dead-Duplikat-Pruefung — alte projectRoutes-Stream-Route bleibt (ist live für A0), keine Duplikat-Falle.

# DoD-Checkliste
- [x] Akzeptanzkriterien erfuellt
- [x] Checks: `py_compile` (5 Dateien) OK + `npm run build` clean
- [x] Doku aktualisiert (ADR-004, KB-008, Summary, Status, Retro)
- [x] KB-Eintrag (KB-008)
- [x] Summary vorhanden
- [x] project-status aktualisiert
- [x] Fullstack-Slice: neues Backend-Endpunkt + Frontend nutzt es direkt
- [x] Naechste Schritte dokumentiert

# Abschluss-Summary
- Ergebnis: Projektloser cross-Projekt-Chat steht (Backend+Frontend); Builds clean.
- Was geändert: Default-Settings für projektlose Chats; neuer projektfreier SSE-Stream-Service + Route; Frontend ohne Projekt-Selector.
- Offene Restpunkte: Runtime-E2E (Phase-1-Infra); Default-Settings admin-konfigurierbar machen; alte projectRoutes-Stream-Route mit Helper konsolidieren; Stufe B (ephemeraler Upload) + C (RBAC-Sharing UX).
- Empfohlene nächste Schritte:
  1. **Phase-1-Infra freigeben** + `accessible_document_ids`-Migration angewendet → sonst kein Runtime-E2E.
  2. **Runtime-E2E:** Docs in 2 Projekte hochladen → eine Frage im (projektlosen) Chat → Antwort muß Quellen aus BEIDEN Projekten enthalten können.
  3. Danach B (ephemeraler In-Chat-Upload) oder C (RBAC-Sharing-UI).
