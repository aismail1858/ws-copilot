# Projektstatus

Globaler Projektstatus. Wird bei jedem Session-Start gelesen.

---

## Aktueller Stand

- **Phase:** Nutzbar — Meilenstein 1 (Login + Chat + Settings erreichbar nach Schema-Anwendung + Provider-Key)
- **Status:** Auth-Blocker (OQ-ARCH-001) behoben (KB-013). Verbleibende Runtime-Blocker sind API-Lücken (Ingestion-Phantom-API, RAG-Stub → OQ-ARCH-007), nicht mehr Auth.
- **Letztes Update:** 2026-07-05

---

## Meilensteine

| Meilenstein | Status | Frist | Notes |
|-------------|--------|-------|-------|
| Repository-Struktur | ERREICHT | - | Verzeichnisstruktur steht |
| Memory-System | ERREICHT | - | 4 Gedächtnistypen initialisiert |
| Skills (10 Agenten) | ERREICHT | - | Alle Skills definiert |
| Phasen-Definitionen | ERREICHT | - | 7 Phasen definiert |
| Templates | ERREICHT | - | Task, User Story, ADR, Retro |
| Workflows | ERREICHT | - | Epic, Feature, Hotfix |
| Erstes Feature | OFFEN | - | Workflow Dashboard geplant |

---

## Offene Aufgaben

1. [ ] **Phase-1-Infra freigeben (Human-Approval):** Supabase+pgvector+Schema, S3, Redis, LLM-Key, globales Embedding-Modell in `.env` — sonst kein Runtime-E2E-Test des Chats.
2. [x] **A0 (projektgebundener Chat):** DONE — SSE-Client + `useChat` + Backend-Stream (KB-007). A1 superseded das Frontend.
3. [x] **A1 (projektloser Cross-Projekt-Chat):** DONE — `useChat()` ohne projectId, `chat_streaming.py` (projektlos), neue Route `POST /api/chats/{cid}/messages/stream`. Frontend+Backend py_compile+npm build clean (KB-008, TASK-2026-07-04-a1-cross-project-chat). Runtime-E2E hängt an Phase-1-Infra.
4. [ ] Rollen- & Berechtigungsmodell (Quellen): CODE-COMPLETE — wartet auf Anwendung der Migration `20260704000001_rbac_quellen.sql` (Human-Approval) + E2E. Siehe `docs/tasks/TASK-2026-07-04-rbac-quellen.md`, ADR-001, KB-001.
5. [ ] **Admin-Einstellungsseite (Requesty-Modelle):** CODE-COMPLETE — wartet auf Anwendung der Migration `20260704120001_app_models.sql` (Human-Approval). Siehe `docs/tasks/TASK-2026-07-04-admin-settings-models.md`, KB-002.
6. [ ] **Migration `20260704120001_app_models.sql` anwenden** (Human-Approval nötig, AGENTS.md 3.1) — sonst laufen `/api/(admin/)models` auf fehlende Tabelle
7. [x] **ERR-002 behoben** (Side-Effect der shadcn-Dependency-Neuinstallation) — `npm run build` läuft jetzt sauber
8. [ ] Folge-Task: Requesty-Modellkatalog an Chat-Auswahl (`useChatModels`) + `services/llm.py` anbinden
9. [x] Folge-Task: Frontend-Seiten schrittweise auf shadcn/ui (Base UI) migrieren — Wave 1+2: Alle 19 Dateien migriert, Pfirsich-Brand-Tokens gesetzt, Keine ci-* Klassen mehr im Source-Code (TASK-2026-07-04-shadcn-page-migration)
10. [ ] **MCP-Server fuer agentic RAG:** CODE-COMPLETE — neues Modul `backend/src/mcp/` (FastMCP, Tools `ask_rag`/`search_documents`/`list_projects`), dualer Transport stdio+http, docker-compose Service `mcp`. Braucht `MCP_SERVICE_USER_ID` (UUID) + `mcp`-Dependency; Runtime-Test mit echtem Supabase/env offen. Siehe `docs/tasks/TASK-2026-07-04-mcp-server.md`, ADR-003, KB-006, OQ-MCP-001/002.

---

## Nächste Schritte

1. **OQ-ARCH-007 (Ingestion-/RAG-Pfad entscheiden)** — höchste Priorität. Auth-Blocker (OQ-ARCH-001)
   ist behoben (KB-013): Login → Chat → Settings ist funktional. Jetzt blockiert nur noch die
   **API-Lücke**: Ingestion `/api/v1/documents/*` fehlt im Backend (Upload → 404), RAG
   `/api/v1/rag/query` ist zustandsloser LLM-Stub ohne Vektor-Retrieval/Requesty. Pfad (A) Backend
   ergänzen vs. (B) Frontend auf cookie-basierte Routen (`/api/chats/{cid}/messages/stream`,
   `/api/projects/{pid}/files/*`) umleiten.
2. **OQ-ARCH-006 (SettingsModal verdrahten)** — fertige Config-UI (API-Keys, Retrieval-Lab) ist
   unerreichbar.
3. **OQ-ARCH-002 (Projekt-Chat-Route)** — entkoppelt, muss angebunden oder entfernt werden.
4. Schema-Reparaturen: OQ-ARCH-004 (`processing_status`), OQ-ARCH-005 (SourceView projektlos).
5. **Workflow Dashboard** als erstes Feature implementieren (Discovery → Design → Architecture → Implementation).
6. **Testing** des Frameworks (Funktioniert der Workflow? Skills verständlich? Lücken?).

---

## Beteiligte Agenten

| Rolle | Aktueller Status |
|-------|------------------|
| Orchestrator | AKTIV |
| Architect | BEREIT |
| Developer | BEREIT |
| Reviewer | BEREIT |
| Tester | BEREIT |
| DevOps | BEREIT |
| Product Owner | BEREIT |
| Security Expert | BEREIT |
| Skeptic | BEREIT |
| AI Expert | BEREIT |

---

## Bekannte Probleme

- **Runtime-E2E des Chats blockiert** auf Phase-1-Infra (Supabase/S3/Redis/LLM-Key/`.env`, Human-Approval). Frontend-Anbindung A0 ist DONE & build-clean, aber ohne Infra nicht lauffähig testbar (TASK-2026-07-04-a0-chat-rag-test).
- **`REQUESTY_API_KEY` fehlt** in `backend/.env` — ohne diesen Key laufen weder Chat-LLM noch Embeddings.
- **RBAC-Migration `20260704000001_rbac_quellen.sql` nicht angewendet** — `roles`-Tabelle fehlt, `/auth/me` und alle tier-basierten Guards schlagen fehl.
- **Redis läuft nicht** — Celery-Ingestion bricht mit ConnectionError, Dokumente bleiben auf `queued`.
- **Dead Code (S6):** `api/chat.ts`, `api/chatHistory.ts` (Sidebar-Sync gegen Phantom-Endpunkt) — build-stabil, zur Laufzeit fehlerhaft.
- **Zwei parallele Auth-Systeme (KB-011):** `/api/v1/*` (Bearer, localStorage) vs. `/api/*` (Cookie) nicht verbunden → Chat/Config/Ingestion-v2 schlagen mit "Not authenticated" fehl. OQ-ARCH-001.
- **SettingsModal orphaned (OQ-ARCH-006):** Config-UI (API-Keys, Retrieval-Lab) fertig aber nicht eingebaut.
- **Projekt-Chat-Route entkoppelt (OQ-ARCH-002):** `/projects/:pid/chats/:cid` rendert ChatPage, aber `:chatId` wird ignoriert.
- **Schema-Constraint `processing_status` veraltet (OQ-ARCH-004):** Code schreibt Werte, die DB-Constraint ablehnt.
- ~~**`/projects` Seite stürzt mit `projects.map is not a function` ab** — API-Response-Wrapper `{message, data}` nicht entpackt.~~ **GEFIXT** (TASK-2026-07-05-fix-projects-page)

---

## Letzte Änderungen

| Datum | Änderung | Verantwortlich |
|-------|----------|----------------|
| 2026-07-05 | **Konfigurierbare Chat-Modelle + Ping-Test + RBAC-Team-Wissen (KB-015):** (A) Chat-Modell aus `app_models` pro Nutzer wählbar, `model_id` fließt in den Stream → `get_chat_llm` (Requesty); Ping-Test `POST /api/admin/models/{id}/test` + Button in Settings. (B) `projects.team_id`; Ingestion setzt `visibility/team_id` (global/team/private) + Dateiliste via `accessible_document_ids`; Admin-Global-Upload `/api/projects/global-files/*`; Projekt-Anlegen auf admin/team_lead. Schema: `projects.team_id`, `users.default_chat_model_id` (idempotent). `py_compile`+`tsc` clean. | Agent |
| 2026-07-05 | **Chat an echten RAG angebunden (Meilenstein 2, KB-014):** `hooks/useChat.ts` von Stub `queryRAGStream` (`/api/v1/rag/query`) auf `createChat`+`streamChatMessage` (`POST /api/chats/{cid}/messages/stream`) umgestellt — Pattern aus `six-figure-rag-web` gespiegelt. Chat durchsucht jetzt die ingestierten Docs (`retrieve_context`+Vektorsuche). `tsc --noEmit` clean. Phantom-/Stub-Dateien zur Löschung markiert. | Agent |
| 2026-07-05 | **App nutzbar (Meilenstein 1):** `fetchWithAuth`/`postFormWithAuthProgress` Cookie-tauglich (OQ-ARCH-001 Auth-Teil, KB-013) → Login-Cookie authentifiziert jetzt auch alle `/api/v1/*`-Aufrufe; `processing_status`-CHECK in `schema.sql` repariert (OQ-ARCH-004); Sidebar `/ingestion` `minTier:'team_lead'` (OQ-ARCH-003). `tsc --noEmit` clean. Meilenstein 2 (Ingestion/RAG) als OQ-ARCH-007 offen. | Agent |
| 2026-07-04 | **App launch-ready gemacht:** `.env` von Gemini auf Requesty umgestellt (gpt-4o/gpt-4o-mini/text-embedding-3-large), Ingestion-Seite für admin+team_lead geöffnet (TierGuard → team_lead), Dead Code `api/ingestion.ts` gelöscht. Build frontend+backend clean. KB-009. | Developer |
| 2026-06-29 | Repository-Struktur / Memory-System / Skills / Phasen / Templates / Workflows initialisiert | Orchestrator |
| 2026-07-04 | Konzept Rollen- & Berechtigungsmodell (Quellen) + ADR-001 + Datenmodell-Diagramm | Architect |
| 2026-07-04 | RBAC-Quellen: Fullstack-Umsetzung code-complete; Migration wartet auf Freigabe | Developer |
| 2026-07-04 | Admin-Einstellungsseite (Requesty-Modelle): Backend CRUD + Frontend-UI code-complete; Migration wartet auf Freigabe | Developer |
| 2026-07-04 | shadcn/ui auf Base UI integriert (ADR-002); ERR-002 als Side-Effect gelöst | Developer |
| 2026-07-04 | MCP-Server fuer agentic RAG (ADR-003), dualer Transport, Service-User-ID-Auth; code-complete (KB-006) | Developer |
| 2026-07-04 | **A0: Chat an echtes Backend angebunden** (projekt-gebunden, SSE). Neuer SSE-Client (`api/streamChat.ts`, `event:`-Dispatch, `done.citations`→Sources) + Chat-CRUD (`api/chatsApi.ts`); `useChat` projekt-gebunden mit create-on-first-send; `ChatPage` schlank mit Projekt-Selector. Backend unverändert. `npm run build` clean. CONFLICT-001 gelöst, ADR-004, KB-007. Runtime-E2E hängt an Phase-1-Infra. | Developer |
| 2026-07-04 | **A1: Projektloser Cross-Projekt-Chat** — `useChat()` ohne projectId, `streamChat` → `/api/chats/{cid}/messages/stream`, `ChatPage` ohne Projekt-Selector. Backend: `services/chat_streaming.py` (NEU, projektlos), `chatRoutes` neue Route, `retrieval.utils` DEFAULT_PROJECT_SETTINGS + `get_effective_settings()`. Cross-Projekt via `accessible_document_ids(user_id)` (ADR-001). Kein Schema-Update nötig. `py_compile` (5 Dateien) + `npm run build` clean. KB-008, ADR-004. Runtime-E2E hängt an Phase-1-Infra. | Developer |
| 2026-07-04 | shadcn-Page-Migration (Wave 1): `--primary`/`--accent` auf Pfirsich-Brand (#f3aa7f) umgestellt; 5 Seiten + DashboardLayout von ci-* auf shadcn migriert; `npm run build` clean (KB-005) | Developer |
| 2026-07-05 | Fix `/projects` page crash: `apiClient.get<Project[]>` → `.get<{data: Project[]}>` mit `.then(res => res.data)` in `ProjectsPage.tsx` und `CreateProjectModal.tsx`. KB-010, LM-011. | Agent |
| 2026-07-05 | **Feature-Interaktions-Karte dokumentiert** (KB-011, KB-012): zwei parallele Auth-Systeme identifiziert, vollständige Entitäts-/Flow-Karte. 6 neue Architektur-OQ (OQ-ARCH-001..006) erfasst. | Agent |
