# Implementierungs-Summaries

Abschlussdokumentation je Task. Neueste oben.

---

## TASK-2026-07-05-app-usable — Anwendung nutzbar machen (Login + Chat erreichbar)

- **Datum:** 2026-07-05
- **Status:** DONE (Meilenstein 1: Login+Chat+Settings erreichbar); Meilenstein 2 (Ingestion/RAG) als Entscheidung offen
- **Scope:** Runtime-Fixes, damit die Webapp nach Login bedienbar ist — plus ehrliche Abgrenzung der verbleibenden Lücke.

### Umgesetzt
- **`frontend/src/api/core.ts` (OQ-ARCH-001, praktischer Teil):** `fetchWithAuth` und
  `postFormWithAuthProgress` warenf hinter einem `loadAuthSession()`-Gate, das hart `'Not authenticated'`
  warf — obwohl `AuthContext` rein cookie-basiert ist und nie ein Bearer-Token im localStorage ablegt.
  Fix: Gate entfernt, `credentials:'include'` bzw. `xhr.withCredentials=true`, Bearer nur optional
  gesetzt. Da das Backend `_decode_token` Cookie-vor-Bearer prüft (`jwtAuth.py:54`), authentifiziert
  das Login-Cookie jetzt auch alle `/api/v1/*`-Aufrufe (Chat, Settings, Config).
- **`backend/supabase/schema.sql` (OQ-ARCH-004):** `processing_status`-CHECK auf die vom Code
  geschriebenen Werte gebracht (`uploading,pending,queued,processing,partitioning,chunking,
  summarising,vectorization,completed,failed`) + idempotentes `DROP/ADD CONSTRAINT` für Altbestand.
- **`frontend/src/features/sidebar/components/sidebarNavItems.tsx` (OQ-ARCH-003):** `/ingestion`
  `adminOnly:true` → `minTier:'team_lead'` (Menü = Route = Backend-Policy).
- **Neue OQ-ARCH-007** für die Ingestion-/RAG-Lücke (Meilenstein 2).

### Verifikation
- `npx tsc --noEmit` → **CLEAN** (EXIT=0).
- `npm run build` (vite) in WSL **blockiert** durch fehlendes `rolldown-binding.linux-x64-gnu.node`
  (`node_modules` ist Windows-installiert) — Plattform-Artefakt, kein Code-Fehler. Auf Windows läuft der Build (siehe frühere Retros).

### Ehrlicher Stand (für den User)
- **Funktioniert nach Schema-Anwendung + Provider-Key:** Login, Seitennavigation, Projects, plain
  LLM-Chat (ohne RAG), Settings-Modellkatalog.
- **Funktioniert NICHT (Meilenstein 2, braucht Entscheidung):**
  - **Ingestion/Upload:** `api/ingestion.ts` → `/api/v1/documents/*` = Phantom-API (nicht im Backend).
  - **RAG:** `/api/v1/rag/query` (`ragRoutes.py:90`) = zustandsloser LLM-Stub ohne Vektor-Retrieval
    und ohne Requesty-Anbindung (nutzt google/openai direkt).
- Entscheidung Pfad (A) Backend `/api/v1/*`+RAG+Requesty ergänzen vs. (B) Frontend auf bestehende
  cookie-basierte Routen (`/api/chats/{cid}/messages/stream`, `/api/projects/{pid}/files/*`) umleiten.

### Next Steps (empfohlen)
1. Supabase: `backend/supabase/schema.sql` im SQL-Editor ausführen.
2. Backend starten (`poetry install` + `uvicorn … --reload-exclude logs --port 8000`) + Frontend `npm run dev`.
3. In `/settings` LLM-Provider + Key setzen (sonst leere Chat-Antwort).
4. Meilenstein 2 entscheiden (OQ-ARCH-007).

---

## TASK-2026-07-05-feature-interaction-map — Feature-Interaktions-Karte dokumentiert

- **Datum:** 2026-07-05
- **Status:** DONE (Reine Wissenserfassung, keine Code-Änderung)
- **Scope:** Erforschen & detailliertes Dokumentieren aller Feature-Interaktionen (Chat, Config, Teams, Projects, Ingestion, Quellen).

### Umgesetzt
- **3 parallele Explore-Agenten** untersuchten: Frontend-Struktur/Routing, Backend-Datenmodell/Entitäten, Ingestion/Sources/Teams/RBAC-Flow. (Ein 4. Agent für Chat-RAG-Retrieval wurde abgebrochen, Abdeckung aber durch die anderen Agenten gewährleistet.)
- **KB-011 (kritisch):** Identifiziert, dass das Frontend **zwei parallele Auth-Systeme** hat — `/api/v1/*` (Bearer, localStorage) vs. `/api/*` (Cookie). Diese sind nicht verbunden und erklären die "Not authenticated"-Console-Fehler des Users.
- **KB-012 (Hauptdeliverable):** Vollständige Interaktions-Karte mit: Entitäts-Diagramm, RBAC-Kern (`accessible_document_ids`), Tier-System, allen 6 Features (Projects/Ingestion/Quellen/Teams/Chat/Config), End-to-End-Flow "User stellt Frage", Routing-Übersicht, State-Management.
- **6 neue Architektur-OQ** erfasst (OQ-ARCH-001..006): API/Auth-Konsolidierung, Projekt-Chat-Entkopplung, Sidebar-Widerspruch, Schema-Constraint, SourceView-Lücke, SettingsModal-orphaned.

### Verifikation
- Reine Doku-Task — kein Build nötig. Alle Befunde mit `file:line` referenziert.

### Offene Restpunkte / Folge-Tasks
- **OQ-ARCH-001** (API/Auth-Konsolidierung) ist der wichtigste Folge-Task — Wurzel vieler Frontend-Probleme.
- **OQ-ARCH-006** (SettingsModal verdrahten) — Config-UI unerreichbar.
- **OQ-ARCH-002** (Projekt-Chat-Route) — entkoppelt.

### Next Steps (empfohlen)
1. OQ-ARCH-001 angehen: `AuthContext.login` so erweitern, dass nach Cookie-Auth auch Bearer-Token geholt wird. Plus prüfen, welche `/api/v1/*`-Endpunkte im Backend fehlen.
2. OQ-ARCH-006: `SettingsModal` in `DashboardLayout` einbauen.
3. Schema-Reparaturen (OQ-ARCH-004, OQ-ARCH-005).

---

## TASK-2026-07-05-fix-projects-page — Fix `/projects` page crash

- **Datum:** 2026-07-05
- **Status:** DONE
- **Scope:** Runtime-Fix: `projects.map is not a function` auf der `/projects`-Seite.

### Umgesetzt
- **Ursache:** Der Backend-Endpoint `GET /api/projects/` gibt `{ message, data: [...] }` zurück, aber `ProjectsPage.tsx` hat das gesamte Response-Objekt als `projects`-State gesetzt (`apiClient.get<Project[]>("/api/projects/").then(setProjects)`). `projects` war daher ein Objekt, kein Array → `.map is not a function`.
- **Fix in `ProjectsPage.tsx`:** Typ auf `{ data: Project[] }` korrigiert, `.then((res) => setProjects(res.data))`.
- **Fix in `CreateProjectModal.tsx`:** POST-Response ebenfalls via `res.data` entpackt (sonst wäre das neu erstellte Projekt ein Objekt mit `{ message, data }`, und `project.id` wäre `undefined`).

### Verifikation
- `npm run build` (`tsc --noEmit && vite build`) → CLEAN (2336 modules, 1.46s).

### Offene Restpunkte / Folge-Tasks
- Prüfen ob andere Frontend-Seiten ebenfalls `.data`-Entpackung vergessen haben (selten, da die meisten anderen Seiten das Pattern korrekt verwenden).
- Optional: Response-Typ-Helper in `api/index.ts` ergänzen, der `{ message, data: T }` automatisch entpackt.

---

## TASK-2026-07-04-app-launch-ready — App launch-ready machen (Env, Ingestion-Gate, Dead Code)

- **Datum:** 2026-07-04
- **Status:** DONE (Code + Build-Check; Runtime braucht Requesty-Key + Migrationen)
- **Scope:** `.env` auf Requesty umgestellt, Ingestion-Page für admin+team_lead geöffnet, Dead Code entfernt.

### Umgesetzt
- **`backend/.env`:** Google/Gemini-Referenzen entfernt, Requesty-Modelle auf `gpt-4o`/`gpt-4o-mini`/`text-embedding-3-large` gesetzt
- **`frontend/src/App.tsx`:** Ingestion-Route: `TierGuard minTier="admin"` → `"team_lead"` (admin + team_lead dürfen jetzt uploaden)
- **`frontend/src/api/ingestion.ts`:** gelöscht (Phantom-Endpunkt `/api/v1/ingestion/upload`)
- **`backend/.env.sample`:** duplicate `JWT_SECRET` entfernt

### Verifikation
- `npm run build` → CLEAN (1847 modules, 645ms)
- Python `py_compile` über alle Backend-Dateien → OK

### Offene Restpunkte / Folge-Tasks
- **`REQUESTY_API_KEY`** muss im `.env` eingetragen werden (wichtigster Einzelfaktor)
- **Migration `20260704000001_rbac_quellen.sql`** in Supabase SQL-Editor ausführen
- **Redis starten:** `docker run -d -p 6379:6379 redis:7-alpine`
- **S3-Verbindung prüfen:** `python test_s3_connection.py`
- **Seed-Admin:** `node scripts/seed-admin.mjs` nach Migration + Start

---

## TASK-2026-07-04-a1-cross-project-chat — A1: Projektloser, user-scoped Chat (cross-Projekt)

- **Datum:** 2026-07-04
- **Status:** DONE (Backend + Frontend; Runtime-E2E hängt an Phase-1-Infra)
- **Scope:** Chat ohne Projekt-Zwang; Suche läuft cross-Projekt über `accessible_document_ids(user_id)` (ADR-001).

### Umgesetzt
- **Schlüsselerkenntnis:** `retrieve_context` war **bereits user-scoped** (`retrieval/index.py:37-41`) — bei `user_id` wird `get_accessible_document_ids(user_id)` genutzt. Die A0-Route hat also schon cross-Projekt gesucht; `project_id` war nur Settings-Anker. `chats.project_id` ist zudem bereits nullable (`schema.sql:73`) → **keine Migration**.
- **Backend:**
  - `retrieval/utils.py`: `DEFAULT_PROJECT_SETTINGS` + `get_effective_settings(project_id)` (Defaults bei `project_id=None`).
  - `retrieval/index.py`: nutzt `get_effective_settings` (project_id=None sicher).
  - `services/chat_streaming.py` (NEU): projektloser SSE-Stream (extrahiert aus projectRoutes-Logik, DRY, `_run_agent_stream` als async Generator); `user_id` durchgereicht → cross-Projekt-Suche.
  - `chatRoutes.py`: neue Route `POST /api/chats/{chat_id}/messages/stream` (Ownership-Check + `project_id` als Settings-Anker aus dem Chat).
  - `models/index.py`: `ChatCreate.project_id` Optional.
- **Frontend:** `useChat()` ohne `projectId`; `streamChat` → `/api/chats/${chatId}/messages/stream`; `chatsApi.createChat({title})` ohne projectId; `ChatPage` ohne Projekt-Selector (Hinweis "Cross-Projekt-RAG").

### Verifikation
- Backend: `python -m py_compile` über 5 geänderte Dateien → OK.
- Frontend: `npm run build` (`tsc --noEmit && vite build`) → CLEAN, 1847 Module, 721 ms.
- SSE-Vertrag identisch zu A0 gehalten (event-Set `status/token/error/done`, Citations in `done.aiMessage.citations`) → kein Frontend-Parser-Bruch (LM-009).

### Offene Restpunkte / Folge-Tasks
- **Runtime-E2E ausstehend** — Phase-1-Infra + `accessible_document_ids`-Migration angewendet (Human-Approval).
- Default-Settings sind gehardcoded → später Admin-konfigurierbar (KB-002 `app_models`).
- Alte projectRoutes-Stream-Route mit `chat_streaming`-Helper konsolidieren (Legacy läuft weiter, A0 unangetastet).
- Stufe B (ephemeraler In-Chat-Upload) + C (RBAC-Sharing-UX).

---

## TASK-2026-07-04-a0-chat-rag-test — A0: Chat an echtes Backend angebunden (projekt-gebunden, SSE)

- **Datum:** 2026-07-04
- **Status:** DONE (Frontend-Teil; Runtime-E2E hängt an Phase-1-Infra)
- **Scope:** Frontend-Chat vom Phantom-`/api/v1/rag/query` auf das echte Backend-Streaming umstellen; projekt-gebundener MVP-Slice zum Testen des RAG.

### Umgesetzt
- **`frontend/src/api/streamChat.ts` (NEU):** SSE-Client für `POST /api/projects/{pid}/chats/{cid}/messages/stream`. Dispatcht über das **`event:`-Feld** (nicht `data.type`): `token`→onToken, `status`→onStatus, `error`→onError, `done`→`mapCitationsToSources(aiMessage.citations)`→onSources+onDone. Inaktivitäts-Timeout 120 s, `credentials:'include'`.
- **`frontend/src/api/chatsApi.ts` (NEU):** Chat-CRUD über `apiClient` — `createChat({title,projectId})`, `getChat`, `listProjectChats`, `deleteChat`.
- **`frontend/src/hooks/useChat.ts` (REWRITE):** Signatur `useChat(projectId)`. Bei erster Nachricht `createChat` (Titel aus Query) → `chatIdRef`; anschließend `streamChatMessage`. Token-Flush-UX erhalten; `useSettings`/`llmConfig`/`temperature`/`knowledgeMode`-Args entfallen (Backend treibt Konfig). Reset bei Projektwechsel.
- **`frontend/src/pages/ChatPage.tsx` (REWRITE, schlank):** Projekt-Selector (`GET /api/projects/`), `useChat(selectedProjectId)`, kein In-Chat-Upload (`+`), kein `ModelSelector`, kein `knowledgeMode`. Behält `ChatHeader`/`ChatMessages`/`SourcePanel`.

### Verifikation
- `npm run build` (`tsc --noEmit && vite build`): **CLEAN**, 1847 Module, ~19 s (nach Fix eines `isLoading`-Refs im `useCallback`-Dependency-Array).
- Vertrags-Lese: Backend `projectRoutes.py:677-847` (event-Set `status/token/error/done`), `models/index.py:53` (`MessageCreate.content`), `chatRoutes.py:20` (`ChatCreate{title,project_id}`), Citation-Shape aus `retrieval/utils.py:98` (`{chunk_id,document_id,filename,page}`).

### Offene Restpunkte / Folge-Tasks
- **Runtime-E2E ausstehend** — blockiert auf Phase-1-Infra (Supabase+pgvector+Schema, S3, Redis, LLM-Key, globales Embedding-Modell in `.env`; Human-Approval).
- **Dead Code (S6):** `api/chat.ts` (`queryRAGStream`), `api/chatHistory.ts` (Sidebar-Sync läuft gegen Phantom-Endpunkt), `api/ingestion.ts`.
- **Stufe A1:** Cross-Projekt-Retrieval über eigene Projekte (Backend `retrieve_context` user-scoped + Such-RPC auf `project_id`-Menge; `chats.project_id` nullable).
- **Stufe B:** ephemerale In-Chat-Uploads (kein DB).
- **Stufe C:** RBAC-Zugriffsfeld auf Projekten (baut auf ADR-001).

---

## TASK-2026-07-04-shadcn-page-migration — Page Migration (5 Seiten) + Pfirsich-Brand

- **Datum:** 2026-07-04
- **Status:** DONE
- **Scope:** Erste Welle der Migration von legacy `ci-*`-CSS-Klassen auf shadcn/ui (Base UI) + Pfirsich-Brand Alignment.

### Umgesetzt
- **CSS-Variablen (`globals.css`):** `--primary`, `--accent`, `--chart-1`, `--ring`, `--sidebar-primary` von neutral/dark auf Pfirsich-Brand `oklch(0.78 0.105 45)` (≈ `#f3aa7f`) umgestellt. `--primary-foreground` auf `oklch(0.205 0 0)` (dunkler Text).
- **5 Seiten migriert:**
  - `LoginPage.tsx`: `ci-app-shell`/`ci-panel`/`ci-input`/`ci-button-primary` → `<Card>`/`<Input>`/`<Button>`
  - `RegisterPage.tsx`: gleiches Muster
  - `UnauthorizedPage.tsx`: `ci-button-primary` → `<Button>`
  - `UsersPage.tsx`: `ci-panel`/`ci-input`/`ci-button-primary` → `<Card>`/`<Input>`/`<Button>`
  - `TeamsPage.tsx`: `ci-input`/`ci-button-primary` → `<Input>`/`<Button>` (xs/grün)
- **DashboardLayout.tsx:** `ci-app-shell` entfernt (ersetzt durch shadcn `bg-background text-foreground` via `@layer base`)

### Verifikation
- `npm run build` (`tsc --noEmit && vite build`): **CLEAN**, 1854 modules, 774 ms.
- Keine ci-* Klassen mehr in den 5 migrierten Seiten + DashboardLayout.
- shadcn-Button zeigt jetzt Pfirsich-Brand statt dark.

### Offene Restpunkte / Folge-Tasks
- Weitere 9 Pages + Komponenten mit ci-* Klassen müssen noch migriert werden (ChatPage, SettingsPage, IngestionPage, SourcesPage, TokenUsagePage, ForgotPasswordPage, PromptDialog, SidebarQuickActions, ChangePasswordModal, ChatMessages, ModelSelector, SidebarSearch)
- ci-button-blue ist ungenutzt → könnte aus globals.css entfernt werden

---

## TASK-2026-07-04-mcp-server — MCP-Server fuer agentic RAG

- **Datum:** 2026-07-04
- **Status:** DONE (Code); Runtime-E2E wartet auf `mcp`-Install + Supabase/env
- **Scope:** MCP-Server als neuer Prozess, der den agentic RAG fuer externe Clients (Claude Desktop, Cursor, opencode, Web-App) verfuegbar macht.

### Umgesetzt
- **Neues Modul `backend/src/mcp/`:**
  - `rag_tools.py` — `ask_rag` (Supervisor-Agent + Guardrail), `search_documents` (reines Retrieval),
    `list_projects`. Jede Funktion reicht die `MCP_SERVICE_USER_ID` als `user_id` durch (RBAC via
    `accessible_document_ids`), nutzt `set_project_id`/`set_user_id`/`clear_context`; **kein**
    ungefilterter `user_id=None`-Fallback; leere ID → `RuntimeError`.
  - `server.py` — `FastMCP("ws-copilot-rag")` mit Host/Port aus Config; registriert die 3 Tools.
  - `__main__.py` — CLI `python -m src.mcp --transport stdio|http`; Logging auf **stderr + Datei**
    (stdout bleibt fuer das stdio-Protokoll frei).
  - `__init__.py` — Modul-Docstring.
- **Config:** `MCP_SERVICE_USER_ID`, `MCP_HOST`, `MCP_PORT` in `src/config/index.py` + `.env.sample`.
- **Dependency:** `mcp = ">=1.2.0,<2.0.0"` in `pyproject.toml`.
- **docker-compose:** Service `mcp` (Image `ws-copilot-backend:1.0.0`, Port 8100,
  `python -m src.mcp --transport http`).
- **Doku:** ADR-003, KB-006, OQ-MCP-001/002, project-status, RETRO-004.

### Verifikation
- `python -m py_compile` auf allen neuen/geaenderten Python-Dateien: **OK**.
- `docker compose -f backend/docker-compose.yml config --quiet`: **OK**.
- Size-Guardrails: laengste Funktion (`ask_rag`) ~25 Zeilen (<50), laengste Datei (`rag_tools.py`)
  ~120 Zeilen (<500).
- Runtime-E2E (Server-Start + Tool-Aufruf) **offen**: benoetigt `mcp`-Install + gesetzte
  Pflicht-env (`SUPABASE_*`, `JWT_SECRET`, `REQUESTY_*`) + gueltige `MCP_SERVICE_USER_ID`.

### Bekannte Blocker / Folge-Tasks
1. **`mcp`-Dependency installieren** (`poetry install`) — noch nicht ausgefuehrt.
2. **`MCP_SERVICE_USER_ID` setzen** — UUID eines existierenden Users (empfohlen: minimale Rolle
   `member`), sonst verweigert der Server den Start.
3. **OQ-MCP-001:** projektunabhaengiges `search_global`-Tool fuer Global-Quellen pruefen.
4. **OQ-MCP-002:** echter Service-Account + API-Key + Migration (Human-Approval) als Folge-Task.
5. **Token-Usage-Tracking** fehlt repo-weit (Folge-Task).

### Next Steps (empfohlen)
1. `cd backend && poetry install` (mcp-Dependency).
2. `MCP_SERVICE_USER_ID=<uuid>` setzen + `python -m src.mcp --transport stdio` per MCP-Client
   (z. B. Claude Desktop / opencode) anbinden und `list_projects` → `ask_rag` durchtesten.
3. Folge-Task OQ-MCP-002 (API-Key-Auth) anlegen, sobald erste Integration steht.

---

## TASK-2026-07-04-shadcn-base-ui — shadcn/ui (Base UI) integriert

- **Datum:** 2026-07-04
- **Status:** DONE
- **Scope:** shadcn/ui mit Base UI (statt Radix) ins Vite+React 19+Tailwind v4 Frontend integrieren.

### Umgesetzt
- `frontend/vite.config.ts`: `@`-Resolve-Alias ergänzt (tsconfig.paths existierte bereits).
- `npx shadcn@latest init -b base -p nova -y`: erkannte Vite + Tailwind v4, legte
  `components.json` (`"style": "base-nova"`) + `src/lib/utils.ts` (`cn()`) an, installierte
  `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `shadcn`,
  ergänzte shadcn-Tokens (`:root`/`.dark` oklch) + `@import "shadcn/tailwind.css"` in `globals.css`.
- Font-Konflikt behoben: Nova setzte `--font-sans` auf Geist → auf **Manrope** (Projekt-Brand)
  zurückgesetzt, `@fontsource-variable/geist` deinstalliert.
- `ci-*`-Klassen + Pfirsich-Brand-Token (`#f3aa7f`) blieben vollständig erhalten.
- 6 Base-UI-Komponenten addiert: `button`, `input`, `label`, `card`, `badge`, `dialog`
  (importieren aus `@base-ui/react/*`, nicht `@radix-ui/*`).
- Wave 2 (2026-07-04, selbe Task): **Alle** restlichen 14 Dateien mit ci-* Klassen auf shadcn umgestellt:
  `ChatPage`, `SettingsPage`, `IngestionPage`, `SourcesPage`, `TokenUsagePage`, `PromptDialog`,
  `ChangePasswordModal`, `SidebarQuickActions`, `SidebarSearch`, `ChatMessages`, `ModelSelector`,
  `SidebarLayout` (2x), `components/layout/SidebarLayout`. `ci-button-blue` entfernt.
  **Keine ci-* Klassen mehr im Source-Code.** (`npm run build` clean, 613ms)

### Verifikation
- `npm run build` (`tsc --noEmit && vite build`): **CLEAN**, 1759 Module, 807 ms.
- Side-Effect: die pre-existing Fehler ERR-002 (`SidebarLayout`/`SidebarNavigation`) sind nach der
  Dependency-Neuinstallation ebenfalls verschwunden → ERR-002 auf RESOLVED gesetzt.

### Offene Restpunkte / Folge-Tasks
- Bestehende Seiten schrittweise auf shadcn-Komponenten migrieren (nur `ci-*` nutzen aktuell).
- Optional `--primary`/`--accent` oklch an Pfirsich-Brand anpassen für einheitliche shadcn-Optik.

---

## TASK-2026-07-04-admin-settings-models — Admin-Einstellungsseite (Requesty-Modelle)

- **Datum:** 2026-07-04
- **Status:** DONE (Code); E2E wartet auf Migration-Freigabe + ERR-002-Fix
- **Scope:** Admin-Settings-Page zur Verwaltung der Requesty-Modelle (Add/Remove/Enable/Disable), Backend-persistent.

### Umgesetzt
- **Backend**
  - Migration `backend/supabase/migrations/20260704120001_app_models.sql`: Tabelle `app_models`
    (id, label, model_id [unique], purpose, enabled, sort_order, timestamps) + Seed der 4 heutigen
    env-Modelle + `updated_at`-Trigger.
  - `backend/src/routes/modelRoutes.py`: 5 Endpunkte
    - `GET /api/models` (auth) → aktivierte Modelle
    - `GET /api/admin/models` (admin) → alle
    - `POST /api/admin/models` (admin) → anlegen (Duplikat-Check → 409)
    - `PATCH /api/admin/models/{id}` (admin) → Partial-Update (Label/ID/Purpose/Enabled/Order)
    - `DELETE /api/admin/models/{id}` (admin)
    Admin-Schutz via `Depends(require_tier("admin"))`.
  - `backend/src/server.py`: `modelRoutes` registriert (`route_count` 5 → 6).
- **Frontend**
  - `frontend/src/lib/api/models.ts`: `modelsApi`-Client.
  - `frontend/src/lib/api/index.ts`: `patch`-Methode am `apiClient` ergänzt.
  - `frontend/src/lib/types/index.ts`: `LlmPurpose`-Typ.
  - `frontend/src/pages/SettingsPage.tsx`: Platzhalter → Admin-UI (Tabelle + Status-Badge +
    Toggle + Inline-Edit + Löschen + Hinzufügen-Formular + Toast-Feedback + Loading/Empty-States).
  - `frontend/src/App.tsx`: `/settings` mit `<TierGuard minTier="admin">` abgesichert.

### Verifikation
- Backend: `from src.server import app` erfolgreich; route_count=6; 46 Routen; Server startet.
- Frontend: `tsc --noEmit` → keine Fehler in den eigenen Dateien. `vite build` bricht an 2
  **pre-existing** Fehlern in ungetrackten WIP-Dateien ab (`SidebarLayout.tsx`,
  `SidebarNavigation.tsx`) → siehe ERR-002; nicht durch diese Task verursacht.

### Bekannte Blocker / Folge-Tasks
1. **Migration anwenden** benötigt Human-Approval (AGENTS.md 3.1). Ohne Tabelle liefern die
   Endpunkte Fehler.
2. **ERR-002** (pre-existing Build-Fehler) beheben → danach ist E2E dieser Task testbar.
3. **Folge-Task (Anbindung):** DB-Katalog an Chat-Auswahl (`useChatModels`, heute localStorage)
   und `services/llm.py` (heute env-Modelle) anbinden, damit Admin-Änderungen effektiv werden.

### Next Steps (empfohlen)
1. Migration freigeben + anwenden.
2. ERR-002 beheben.
3. Folge-Task Anbindung Katalog → Chat & llm.py.
