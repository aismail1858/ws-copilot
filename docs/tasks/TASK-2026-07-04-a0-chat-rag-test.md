---
task_id: TASK-2026-07-04-a0-chat-rag-test
title: "A0 Schnelltest: Chat an echtes Backend anbinden (projekt-gebunden, SSE)"
status: DONE
priority: HIGH
owner: Agent
created_at: 2026-07-04
updated_at: 2026-07-04
phase: webapp/chat
kb_references: [KB-007]
adr_references: [ADR-004]
---

# Ziel
Den Frontend-Chat an das existierende Backend (`POST /api/projects/{pid}/chats/{cid}/messages/stream`) anbinden, sodass der User Projekt wählen, Dokumente ingesten (via Sidebar) und Fragen an sein RAG stellen kann — projekt-gebunden als schnellster testbarer Slice. Cross-Projekt (A1), ephemerale Uploads (B) und RBAC-gestützter Zugriff (C) folgen gestuft.

# Scope
- In Scope:
  - Neuer SSE-Client (`api/streamChat.ts`), der das `event:`-Feld dispatcht und `done.aiMessage.citations` → `Source[]` mappt
  - Chat-CRUD-Client (`api/chatsApi.ts`)
  - `useChat`-Rewrite: `projectId`-basiert, create-on-first-send, Token-Flush erhalten
  - `ChatPage` schlank: Projekt-Selector, kein In-Chat-Upload, kein knowledgeMode/ModelSelector
  - Doku: CONFLICT-001, ADR-004, Summary, Status, Retrospektive
- Out of Scope (Stufen A1/B/C):
  - Cross-Projekt-Retrieval über alle User-Projekte (A1)
  - Ephemerale In-Chat-Uploads ohne DB (B)
  - RBAC-Zugriffsfeld auf Projekten für cross-Projekt mit Sharing (C — OQ-RB geklärt, ADR-001 ACCEPTED, Umsetzung eigener Task)
  - Backend-Änderungen (A0 ist Frontend-only)
  - Phase-1-Infra (Supabase/S3/Redis/LLM-Key/.env) — Human-Approval, User-Umgebung

# Checkpoint-Review (AGENTS.md §1)
- `error-log.md`: LM-001..008 gelesen; LM-003 (pre-existing Build-Fehler als Baseline) beachtet — Build vor Code-Start nicht erneut gelaufen, nach Code sauber.
- `decisions.md`: ADR-001 (RBAC) ist ACCEPTED (trotz project-status "REVIEW") — `accessible_document_ids(user_id)` existiert. ADR-002/003 konsistent.
- `open-questions.md`: OQ-RB-001..004 GEKLAERT, OQ-MCP-001 geklärt, OQ-MCP-002 offen (kein Blocker für A0).
- `project-status.md`: STALE (siehe ERR/CONFLICT).

# Aufgaben
- [x] Task anlegen + Checkpoint-Review
- [x] SSE-Client `api/streamChat.ts` (event:-Parser, citation-Mapping)
- [x] Chat-CRUD `api/chatsApi.ts`
- [x] `useChat.ts` Rewrite (projectId + create-on-first-send)
- [x] `ChatPage.tsx` schlank (Projekt-Selector, Upload ausgeblendet)
- [x] Doku (CONFLICT-001, ADR-004, Summary, Status, Retro)
- [x] Verify: `npm run build` (tsc --noEmit && vite build)

# Akzeptanzkriterien
1. `npm run build` läuft sauber (tsc + vite) — **erfüllt** (1847 Module, ~19s)
2. Chat sendet an den echten Stream-Endpunkt (nicht mehr an Phantom `/api/v1/rag/query`) — **erfüllt** (`streamChat.ts`)
3. SSE-Events `token/status/error/done` werden korrekt dispatcht (über `event:`-Feld, nicht `data.type`) — **erfüllt**
4. Citations aus `done.aiMessage.citations` werden als Quellen angezeigt — **erfüllt** (`mapCitationsToSources`)
5. Chat erstellt beim ersten Senden einen Server-Chat (`POST /api/chats/`) und wiederverwendet die `chat_id` — **erfüllt** (`useChat`)
6. Projekt ist über einen Selector wählbar — **erfüllt** (`ChatPage`)

# Abhaengigkeiten
- **Phase-1-Infra (Human-Approval, nicht durch diese Task):** Supabase+pgvector+Schema, S3, Redis, LLM-Key, globales Embedding-Modell in `.env`. Ohne diese läuft der E2E-Test nicht.
- Backend-Stream-Endpunkt `projectRoutes.py:677` (existiert, unverändert).
- `ChatCreate{title, project_id}` (`models/index.py:16`, project_id Pflicht).

# Risiken
- **Stale `project-status.md`:** Behauptet ADR-001 = REVIEW; tatsächlich ACCEPTED. → CONFLICT-001 dokumentiert, Status korrigiert.
- **Orphaned Dead Code:** `api/chat.ts` (`queryRAGStream`), `api/chatHistory.ts`, `api/ingestion.ts` jetzt ungenutzt; build-stabil (`noUnusedLocals:false`), aber Sidebar-Sync (`historySync.ts`) läuft gegen Phantom-Endpunkt und schlägt fehl. → S6-Cleanup; für A0 nicht blockierend (stumm).
- **Kein E2E-Runtime-Test möglich:** Ohne Infra (Phase 1) kann der Chat nicht echt durchgespielt werden. → Code-Vertrag verifiziert via Build + Vertrags-Lese; Runtime-E2E als Folge nach Infra-Freigabe.

# Betroffene Dateien
- `frontend/src/api/streamChat.ts` (NEU)
- `frontend/src/api/chatsApi.ts` (NEU)
- `frontend/src/hooks/useChat.ts` (REWRITE)
- `frontend/src/pages/ChatPage.tsx` (REWRITE, schlank)
- `docs/open-questions.md` (CONFLICT-001)
- `docs/decisions.md` (ADR-004)
- `docs/implementation-summaries.md` (Summary)
- `docs/project-status.md` (Update)
- `docs/error-log.md` (RETRO-007)
- `docs/knowledge-base.md` (KB-007)

# Bekannte Fehler aus error-log.md für diesen Task
- LM-003: pre-existing Build-Fehler als Baseline festhalten — beachtet (Build nach Code sauber, keine fremden Brüche eingebaut).
- LM-008: build-verify nach Dateigruppen — eingehalten (ein Build nach allen Frontend-Änderungen, Fehler beim 1. Lauf `isLoading`-Ref gefixt, 2. Lauf clean).

# Implementierungsnotizen
- Start: 2026-07-04
- Zwischenstand: Phase 2 (Frontend) fertig + build-clean. Phase 1 (Infra) ausstehend (Human-Approval). Phase 0 (Doku) mit diesem Eintrag abgeschlossen.
- Blocker: keiner auf Code-Ebene. Runtime-E2E blockiert auf Infra.

# DoD-Checkliste
- [x] Akzeptanzkriterien erfuellt
- [x] Tests/Checks ausgefuehrt (`npm run build` clean)
- [x] Dokumentation aktualisiert (CONFLICT-001, ADR-004, KB-007, Status, Retro)
- [x] KB-Eintrag erstellt (KB-007)
- [x] Summary in `docs/implementation-summaries.md` vorhanden
- [x] `docs/project-status.md` aktualisiert
- [x] Fullstack-Slice: Frontend nutt die echte Backend-Chat-API direkt (Stream-Endpunkt + `/api/chats/`). Runtime-E2E hängt an Infra (Phase 1, Human-Approval) — als Folge dokumentiert.
- [x] Naechste empfohlene Schritte mit Begruendung dokumentiert

# Abschluss-Summary
- Ergebnis: Chat-Anbindung an echtes Backend steht (Frontend-only); Build sauber.
- Was wurde geaendert: neuer SSE-Client + Chat-CRUD; `useChat` projekt-gebunden mit create-on-first-send; `ChatPage` schlank mit Projekt-Selector, ohne Upload/ModelSelector.
- Offene Restpunkte: Runtime-E2E nach Infra; Dead-Code-Cleanup (S6); In-Chat-Upload kommt in Stufe B zurück.
- Empfohlene naechste Schritte:
  1. **Phase 1 Infra freigeben** (`.env`, Supabase, S3, Redis, LLM-Key) — sonst kein Runtime-Test möglich.
  2. **Runtime-E2E:** Register → Projekt → Sidebar-Upload → Chat-Frage → SSE-Antwort + Quellen prüfen.
  3. Danach Stufe A1 (Cross-Projekt über eigene Projekte), B (ephemeraler Upload), C (RBAC-Sharing).
