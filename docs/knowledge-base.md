# Knowledge Base

Langlebiges Projektwissen. Einträge referenzieren Tasks/ADRs mit `[KB-XXX]`.

---

## [KB-013] Cookie-Auth gilt für ALLE Routen — `/api/v1/*`-Gate war der einzige Break (OQ-ARCH-001 fix)

- **Quelle:** TASK-2026-07-05-app-usable
- **Stand:** 2026-07-05

KB-011/KB-012 beschrieben "zwei parallele Auth-Systeme" als harte Blocker. Verifikation 2026-07-05
relativiert das **für den Live-Pfad**: Das Backend `_decode_token` (`jwtAuth.py:54-66`) liest das
Cookie **vor** dem Bearer — d.h. das Login-Cookie authentifiziert auch jedes `/api/v1/*` (Chat, Config).
Der einzige echte Break war das Frontend-Gate in `fetchWithAuth` (`api/core.ts:232`), das bei
fehlendem localStorage-Bearer hart `'Not authenticated'` warf, **bevor** überhaupt angefragt wurde.

**Fix (angewendet):** Gate entfernt, `credentials:'include'` / `xhr.withCredentials=true`, Bearer
optional. Damit ist Login → Chat → Settings mit der **bestehenden** Cookie-Session funktional.

**Was weiterhin NICHT gelöst ist** (kein Auth-, sondern API-Problem):
- `/api/v1/rag/query` (`ragRoutes.py:90`) **existiert** (KB-012 „12.10" ist hier stale), ist aber ein
  **zustandsloser LLM-Stub ohne `retrieve_context`/Vektorsuche** und ohne Requesty-Anbindung
  (nutzt google/openai direkt). Chat antwortet nur als plain LLM, nicht als RAG.
- `/api/v1/documents/*` (`api/ingestion.ts`) **existiert im Backend gar nicht** → Upload 404.
  Echtes Ingestion-Backend: `/api/projects/{pid}/files/upload-url` + `/confirm`.
- `AuthContext` schreibt weiterhin **keinen** Bearer in localStorage — irrelevant, solange
  `fetchWithAuth` das Cookie nutzt. Würde nur relevant, falls man den A0/A1-`streamChat`-Pfad
  (KB-007/008) wieder aktiviert (der ist cookie-only).

**Konsequenz:** "Not authenticated" beim Chat ist behoben. "Chat findet keine Dokumente" / "Upload
schlägt fehl" sind **andere** Probleme (RAG-Stub / Phantom-API, OQ-ARCH-007).

---

## [KB-015] Konfigurierbare Chat-Modelle + Ping-Test + RBAC-Team-Wissen

- **Quelle:** User-Spec 2026-07-05 (Plan `okay-beachte-folgendes-…`); Tasks #7–#11
- **Stand:** 2026-07-05

### A) Konfigurierbare Chat-Modelle + Ping-Test
- **Modellkatalog** = `app_models` (purpose=chat). `GET /api/models` liefert aktivierte Chat-Modelle.
- **Pro Nutzer gemerkt** (`users.default_chat_model_id`, neue Spalte): `GET/PUT /api/me/model`; `/auth/me`
  liefert den Default mit. Im Chat über `ModelSelector`/`useChatModels` jederzeit änderbar.
- **Modell fließt in den Stream**: `POST /api/chats/{cid}/messages/stream` Body `{content, model_id?}`;
  `chat_streaming._resolve_chat_model_id` wählt (gewählt → erster aktivierter chat → Singleton).
  `services/llm.get_chat_llm(model_id)` baut eine **Requesty**-`ChatOpenAI`. Agenten
  (`create_supervisor_agent`/`create_simple_rag_agent`) nehmen jetzt eine `chat_llm`-Instanz (vorher
  Model-String via `init_chat_model` = OpenAI-Default, NICHT Requesty — latent gefixt). Auch
  `prepare_prompt_and_invoke_llm` nutzt die Instanz.
- **Ping-Test** (Admin, nur Settings): `POST /api/admin/models/{pk}/test` → `get_chat_llm(model_id).ainvoke("Ping")`
  mit 15s-Timeout → `{ok, latency_ms}` / `{ok:false, error}`. Button pro Modell-Zeile.
- **Frontend-Auswahl** läuft über den Shared-Store `chat/selectedModel` (`getSelectedModelId`), den
  `useChat` beim Senden liest (kein Prop-Drilling). `ModelSelector`/`useChatModels` wurden von
  Multi-Provider/Stub auf app_models umgestellt.

### B) RAG mit Rollen-/Team-Zugriff (Projekt gehört zu Team)
- **Schema:** `projects.team_id` (FK→teams) neu. `project_documents.visibility/team_id` existierten
  bereits; `accessible_document_ids(user_id)` war **bereits** der RBAC-Anker (global/team/owned/members).
- **Ingestion setzt Sichtbarkeit** (`projectFilesRoutes.upload-url`): admin+`visibility='global'` →
  global; Projekt mit `team_id` → `visibility='team'`; sonst private. Datei-Liste filtert jetzt über
  `accessible_document_ids` (Team-Mitglieder sehen Team-Docs, nicht nur `user_id==self`).
- **Admin-Global**: `POST /api/projects/global-files/upload-url`+`/confirm` (admin) → Doc mit
  `project_id=None, visibility='global'` (für alle). IngestionPage hat einen Admin-Umschalter.
- **Projekt-Anlegen** auf admin/team_lead beschränkt; `team_id` wird verknüpft (team_lead nur für
  eigenes Team). Team-Lead nimmt Mitglieder auf (`_assert_can_manage_team` war bereits admin-oder-lead).
- **Mitglieder in mehreren Teams** → Schema via `team_members` n:n bereits unterstützt.

### Schema-Migrationen (additiv, idempotent — User wendet `schema.sql` an)
- `projects.team_id` (inkl. FK nach teams-Anlage)
- `users.default_chat_model_id`

### Verify
- `py_compile` Backend + `tsc --noEmit` Frontend je clean.
- Runtime-Test steht aus (Schema-Anwendung + Requesty-Key + Services).

---

## [KB-014] Live-Chat an echten RAG angebunden (Backend = Source of Truth)

- **Quelle:** TASK-2026-07-05-app-usable (Meilenstein 2), Referenz `six-figure-rag-web`/`six-figure-rag-api`
- **Stand:** 2026-07-05

Der Live-Chat (`hooks/useChat.ts`, montiert via `App.tsx` → `pages/ChatPage`) streamt jetzt gegen das
**echte** RAG-Backend statt gegen den Stub.

**Was läuft (Pattern aus `six-figure-rag-web` gespiegelt):**
1. Server-Chat bei erstem Senden eines Threads angelegt: `chatsApi.createChat({title})` →
   `POST /api/chats/` (cookie). Pro Thread wird die chatId in localStorage (`ws-copilot-thread-chatids`)
   gemappt, damit jeder Thread seinen Server-Chat behält.
2. Stream: `streamChat.ts` `streamChatMessage` → `POST /api/chats/{cid}/messages/stream`, Body
   `{content}`. SSE über `event:`/`data:`; `status|token|error|done`.
3. `done` liefert `{userMessage, aiMessage}`; `aiMessage.citations` → `mapCitationsToSources` →
   `onSources` (Quellen im SourcePanel).
4. Backend: `chatRoutes.py:186` → `chat_streaming.stream_chat_response(project_id, chat_id, user_id,
   msg)` → `create_supervisor_agent`/`create_simple_rag_agent` → `retrieve_context` →
   `accessible_document_ids(user_id)` + `vector_search_document_chunks` über die **eigenen Docs**.

**Konfig kommt vom Backend** (kein client-seitiges `runtimeLlmConfig`/`history`/`knowledgeMode` mehr,
wie in `six-figure-rag-web`). Modell = `appConfig["agent_model_id"]`, Embedding = Requesty.

**Verlust gegangen (nur vom Stub emittiert, echtes RAG sendet sie nicht):** Reasoning-Stream,
`answerMode`-Badge, Retrieval-Diagnostik/Stage-Timings, KI-Titel (Titel jetzt client-seitig beim
`createChat` abgeleitet). Reine Nice-to-haves.

**Jetzt ungenutzt / zur Löschung markiert (Human-Approval, AGENTS.md 3.1):**
- Frontend: `api/chat.ts` (`queryRAGStream`, `generateChatTitle`), `api/ingestion.ts` (Phantom
  `/api/v1/documents/*`, In-Chat-Upload), `api/chatHistory.ts`, `api/admin.ts` (Stub).
  (`api/client.ts` + `api/core.ts` bleiben — Settings/Upload-UI nutzt `fetchWithAuth` weiter.)
- Backend: `/api/v1/rag/query` + `/api/v1/chat/title` (`ragRoutes.py`) — Stubs ohne Konsumenten.

**Verify:** `tsc --noEmit` clean. Runtime-Verify durch User ausstehend (braucht Schema-Anwendung +
`REQUESTY_API_KEY` + Backend/Celery/Frontend-Start).

---

## [KB-001] Requesty ist das einzige LLM-/Embedding-Gateway

- **Quelle:** TASK-2026-07-04-admin-settings-models, `backend/src/services/llm.py`, `backend/.env.sample`
- **Stand:** 2026-07-04

Das Backend nutzt ausschliesslich **Requesty** (`https://api.requesty.ai/v1`) als OpenAI-kompatiblen
Gateway für Chat-, Mini- und Embedding-Modelle. Es gibt **kein** echtes Multi-Provider-Setup, obwohl
das Frontend-`AppSettings`-Modell (`frontend/src/lib/types/index.ts`) historisch Felder für
Anthropic/OpenAI/Google/Ollama/Custom enthält — diese sind im Backend nicht angebunden.

**Konsequenz für neue Arbeit:** Modell-Konfiguration orientiert sich am Requesty-Katalog, nicht am
Multi-Provider-`AppSettings`-Modell. Der Admin-Katalog (`app_models`, siehe KB-002) ist die
zukünftige Single-Source-of-Truth für verfügbare Modelle.

---

## [KB-002] Modellkatalog `app_models` (Admin-pflegbar)

- **Quelle:** TASK-2026-07-04-admin-settings-models, Migration `20260704120001_app_models.sql`
- **Stand:** 2026-07-04

Verfügbare Modelle werden in der Tabelle `public.app_models` gepflegt
(`label`, `model_id` [unique], `purpose ∈ {chat,mini,embeddings,embeddings_llm}`, `enabled`,
`sort_order`). Verwaltung via `/api/admin/models` (Admin-Tier). Lesend für alle authentifizierten
Nutzer via `/api/models` (nur aktivierte).

**Noch nicht angebunden (Folge-Task):** `services/llm.py` liest weiterhin env-Variablen
(`REQUESTY_CHAT_MODEL` usw.) mit `lru_cache`. Die Chat-Modellauswahl im Frontend
(`useChatModels`) liest `AppSettings` aus `localStorage`. Beide müssen auf `/api/models`
umgestellt werden, damit Admin-Änderungen durchschlagen.

---

## [KB-003] Frontend-Guards sind tier-basiert (`TierGuard`), nicht rollen-basiert

- **Quelle:** TASK-2026-07-04-admin-settings-models (Beobachtung), `frontend/src/App.tsx`
- **Stand:** 2026-07-04

`App.tsx` verwendet `TierGuard` (`minTier ∈ {admin, team_lead, member}`) statt eines
`RoleGuard(role)`. Die rbac-Task (ADR-001) hat dies umgestellt. Neue Admin-Routen also immer mit
`<TierGuard minTier="admin">` absichern. `useAuth().user.tier` liefert den Tier (aus `/auth/me`).

---

## [KB-004] Frontend = Vite + React 19 (Migration von Next.js läuft)

- **Quelle:** git-status Beobachtung 2026-07-04
- **Stand:** 2026-07-04

Das Frontend wurde von Next.js (`frontend/src/app/...`, App-Router) auf **Vite + React 19 + Tailwind v4**
migriert (`frontend/src/main.tsx`, `vite.config.ts`). Migration ist teils WIP: einige
Layout-Dateien (`SidebarLayout`, `SidebarNavigation`) haben noch Typfehler (ERR-002). Bei
Frontend-Arbeit `npm run build` (`tsc --noEmit && vite build`) ausführen und pre-existing Fehler
nicht der eigenen Task anlasten.

---

## [KB-005] UI-Library: shadcn/ui auf Base UI (ADR-002)

- **Quelle:** TASK-2026-07-04-shadcn-base-ui, ADR-002
- **Stand:** 2026-07-04 (Wave 2 abgeschlossen)

UI-Komponenten kommen ab sofort über **shadcn/ui** mit **Base UI**-Primitives (`@base-ui/react`,
NICHT Radix). Setup: `components.json` (`"style": "base-nova"`, `"baseColor": "neutral"`), `cn()` in
`src/lib/utils.ts`, Komponenten in `src/components/ui/`. Neue Komponenten hinzufügen mit
`npx shadcn@latest add <name> -y`.

**Wichtig:**
- `init -y` überspringt NICHT den Preset-Prompt — `-p <name>` (z. B. `nova`) nötig für non-interactive Run.
- Nova-Preset setzt `--font-sans` auf Geist. Projekt-Brand ist aber **Manrope** → bei Re-Init/
  Preset-Wechsel Manrope in `globals.css` (`--font-sans` + body) wiederherstellen.
- **ci-* Klassen sind vollständig aus dem Source-Code entfernt** (Stand Wave 2, 2026-07-04).
  Alle 19 Dateien (6 Pages + 2 Layouts + 11 Komponenten/Hilfsdateien) nutzen jetzt entweder
  `<Button>`, `<Input>`, `<Card>`, `<Badge>` oder direkte Tailwind-Klassen. Keine ci-* CSS-Klassen
  mehr in `src/pages/`, `src/components/`, `src/features/`. Die ci-* Definitionen in `globals.css`
  bleiben als Fallback, können aber bereinigt werden.
- Pfirsich-Brand-Tokens (`--primary`, `--accent`, `--chart-1`, `--ring`, `--sidebar-primary` auf
  `oklch(0.78 0.105 45)` = `#f3aa7f`) sind seit Wave 1 gesetzt.
- Pfad-Alias `@/*` in `tsconfig.json` UND `vite.config.ts` (`resolve.alias`) nötig.
- **ci-button-blue** entfernt (war ungenutzt).

---

## [KB-006] MCP-Server nutzt den agentic RAG per Direkt-Import (kein HTTP)

- **Quelle:** TASK-2026-07-04-mcp-server, ADR-003, `backend/src/mcp/`
- **Stand:** 2026-07-04

Der MCP-Server (`backend/src/mcp/`) exposet den agentic RAG fuer externe Clients (Claude Desktop,
Cursor, opencode, Web-App). Wichtig fuer Folge-Arbeit:

- **Wiederverwendung ohne HTTP-Umweg:** die Tools rufen direkt
  `create_supervisor_agent` (`agents/supervisor_agent/agent.py:244`) bzw.
  `retrieve_context` (`rag/retrieval/index.py:18`) auf — kein Fetch gegen die FastAPI.
- **Identität = `MCP_SERVICE_USER_ID`** (env, UUID). Diese `user_id` wird **immer** durchgereicht,
  damit `accessible_document_ids(user_id)` (ADR-001) die Zugriffsmenge berechnet. Es gibt bewusst
  **keinen** `user_id=None`-Fallback (der wuerde RBAC umgehen, siehe `retrieval/index.py:40`).
  Leere ID → Server verweigert den Start.
- **Transports:** `python -m src.mcp --transport stdio` (lokale Clients, Default) und
  `--transport http` (`streamable-http` auf `MCP_HOST:MCP_PORT`, docker-compose Service `mcp`).
- **stdio-Kontrakt:** stdout ist exklusiv fuer JSON-RPC; Logging geht auf stderr + `logs/mcp.log`
  (siehe `src/mcp/__main__.py`). NIEMALS `print()`/stdout-Logger in MCP-Code.
- **Tools:** `ask_rag(question, project_id)` → `{answer, citations}`;
  `search_documents(query, project_id)` → `{snippets, count, citations}`;
  `list_projects()` → Projektliste des Service-Users.
- **Offen:** Global-Quellen (`project_id IS NULL`, OQ-RB-001) sind ueber projektbezogene Tools nur
  bedingt erreichbar (OQ-MCP-001). Token-Usage-Tracking fehlt repo-weit (Folge-Task).

---

## [KB-007] Chat-SSE-Vertrag Frontend ↔ Backend (projekt-gebunden, A0)

- **Quelle:** TASK-2026-07-04-a0-chat-rag-test, ADR-004, CONFLICT-001
- **Stand:** 2026-07-04

Der Frontend-Chat spricht seit A0 das **echte** Backend an (vorher Phantom `/api/v1/rag/query`).
Wichtig fuer Folge-Arbeit (A1/B/C):

- **Stream-Endpunkt:** `POST /api/projects/{project_id}/chats/{chat_id}/messages/stream`,
  Body `{"content": "<frage>"}` (`MessageCreate.content`, `models/index.py:53`). Cookie-Auth
  (`credentials:'include'`).
- **SSE-Dispatch ueber `event:`-Feld, NICHT `data.type`.** Backend emittiert `event: token|status|error|done`
  OHNE `type`-Feld im JSON (`projectRoutes.py:775,778,804,836`). Der alte Frontend-Parser las nur
  `data:`-Zeilen und dispatchte auf `parsed.type` → hat jedes Backend-Event ignoriert. Fix:
  `frontend/src/api/streamChat.ts` (`parseSseBlock`/`dispatchEvent`).
- **Citations kommen im `done`-Event** als `data.aiMessage.citations`, Shape
  `{chunk_id, document_id, filename, page}` (`retrieval/utils.py:98`). KEIN separates `sources`-Event.
  Mapping → `Source[]` via `mapCitationsToSources` (`streamChat.ts`).
- **Chat-Create ist Pflicht vor Stream:** `POST /api/chats/` mit `{title, project_id}` (project_id
  NOT NULL, `models/index.py:16`). `useChat` macht create-on-first-send und hält `chatIdRef`.
- **Backend treibt die Konfig** (Modell, Strategie, Embedding). Frontend sendet keine `llmConfig`/
  `temperature`/`knowledgeMode` mehr. Embedding = global (`.env`/Admin); Wechsel → Re-Ingestion.
- **Stufen (ADR-004):** A0 projekt-gebunden ✓ → A1 cross-Projekt (eigene) → B ephemeraler Upload
  → C RBAC-Sharing. A0 ist strenge Teilmenge: Client-URL wird in A1 nur getauscht.
- **Dead Code bis S6:** `api/chat.ts` (`queryRAGStream`), `api/chatHistory.ts` (Sidebar-Sync gegen
  Phantom), `api/ingestion.ts` — build-stabil (`noUnusedLocals:false`), aber zur Laufzeit fehlerhaft.

---

## [KB-008] Projektloser Cross-Projekt-Chat (A1)

- **Quelle:** TASK-2026-07-04-a1-cross-project-chat, ADR-004, ADR-001
- **Stand:** 2026-07-04

Seit A1 ist der Chat **projektlos**: `useChat()` nutzt `POST /api/chats/{chat_id}/messages/stream`,
`project_id` ist beim Chat-Erlegen optional (nur als Settings-Anker im chat-Objekt, `schema.sql:73`).

**Warum Projektlos?** `retrieve_context` (`retrieval/index.py:37-41`) nutzt bereits `user_id` für
`get_accessible_document_ids(user_id)` — cross-Projekt-Suche funktioniert automatisch, wenn `user_id`
gesetzt ist. `project_id` dient nur als Fallback-Settings-Anker (wenn gesetzt → `get_project_settings`,
sonst `DEFAULT_PROJECT_SETTINGS`).

**Endpunkt-Aenderung (A0 → A1):**
- A0: `POST /api/projects/{pid}/chats/{cid}/messages/stream`
- A1 (Frontend): `POST /api/chats/{cid}/messages/stream`

**SSE-Vertrag bleibt identisch** (LM-009): `event: status|token|error|done` + `done.aiMessage.citations`.

**Defaults (`retrieval/utils.py`):** `DEFAULT_PROJECT_SETTINGS` = strategy=hybrid,
agent_type=simple, similarity_threshold=0.5, top_k=5.

**Folge-Aspekte:** Default-Settings admin-konfigurierbar (KB-002, Stufe B); Stufe B (ephemeraler
Upload) + C (RBAC-Sharing-UI) nach ADR-004.

---

## [KB-009] App launch-ready: Requesty-Env, Ingestion für admin+team_lead, Dead Code entfernt

- **Quelle:** TASK-2026-07-04-app-launch-ready
- **Stand:** 2026-07-04

### `.env` Requesty-Konfiguration
Das Backend nutzt Requesty als einziges LLM/Embedding-Gateway (`services/llm.py`):
- `REQUESTY_API_KEY` — muss vom User gesetzt werden (z.B. `sk-...`)
- `REQUESTY_BASE_URL=https://api.requesty.ai/v1`
- `REQUESTY_CHAT_MODEL=gpt-4o`
- `REQUESTY_MINI_MODEL=gpt-4o-mini`
- `REQUESTY_EMBEDDINGS_MODEL=text-embedding-3-large` (1536-dim)
- `REQUESTY_EMBEDDINGS_LLM_MODEL=gpt-4o`
- `AGENT_MODEL_ID=openai:gpt-4o`

Keine Google/Gemini-Referenzen mehr. Der alte `GOOGLE_API_KEY` und `LLM_MODEL=gemma-4-31b-it` sind entfernt.

### Ingestion-Berechtigung
Die Ingestion-Seite (`/ingestion`) verwendet `TierGuard minTier="team_lead"`:
- **admin** (Rang 0) → Zugriff ✅
- **team_lead** (Rang 1) → Zugriff ✅
- **member** (Rang 2) → Zugriff ❌ (weitergeleitet zu /unauthorized)

Mitglieder sind reine Konsumenten (OQ-RB-003).

### Dead Code entfernt
- `frontend/src/api/ingestion.ts` gelöscht (rief Phantom-Endpunkt `/api/v1/ingestion/upload`)
- Der echte Upload läuft über `IngestionPage.tsx` → `POST /api/projects/{id}/files/upload-url` (S3-Presigned-URL-Flow)

---

## [KB-010] API-Responses sind immer mit `{ message, data }` gewrappt

- **Quelle:** TASK-2026-07-05-fix-projects-page, `backend/src/routes/projectRoutes.py`
- **Stand:** 2026-07-05

Alle FastAPI-Endpunkte wrappen ihre Ergebnisse in `{ "message": "...", "data": <payload> }`.
Das Frontend `apiClient` (`res.json()`) liefert das komplette Objekt, nicht die nackten Daten.

**Konsequenz:** Bei jedem `apiClient.get/post/...` muss `.data` aus der Response entpackt werden:
```typescript
apiClient.get<{ data: T[] }>("/api/...").then((res) => setData(res.data))
```

Das Muster wird konsistent in `IngestionPage.tsx`, `SourceViewPage.tsx` usw. verwendet.
`ProjectsPage.tsx` und `CreateProjectModal.tsx` fehlte dies → `projects.map is not a function`.

---

## [KB-011] ZWEI parallele API/Auth-Systeme im Frontend (kritischer Architekturbefund)

- **Quelle:** TASK-2026-07-05-feature-interaction-map
- **Stand:** 2026-07-05

Das Frontend enthält **zwei nebeneinander existierende API- und Auth-Subsysteme**, die unterschiedliche
Backend-Namespaces ansprechen und nicht sauber verbunden sind. Das ist die Wurzel vieler Frontend-Probleme.

| Subsystem | API-Layer | Auth | Endpunkte | Hauptverwender |
|---|---|---|---|---|
| **Modern (v1)** | `src/api/*` via `fetchWithAuth` (`api/core.ts:226`) | Bearer-Token aus localStorage `ws-copilot-auth-session` (`auth/session.ts`) | `/api/v1/*` | Chat-RAG (`queryRAGStream`), Ingestion v2, Config/LLM-Settings, Chat-History-Sync |
| **Legacy** | `src/lib/api/index.ts` (`apiClient`) | Cookie (`credentials:"include"`, `lib/api/index.ts:16`) | `/api/*` (ohne v1) | Auth (`/auth/*`), Projects, Chats CRUD, Models, Users, Teams, Sources |

**Das Problem:** `AuthContext` (`context/AuthContext.tsx:43-60`) läuft cookie-basiert und schreibt
**keinen** Bearer-Token in localStorage. `fetchWithAuth` (`api/core.ts:232-235`) wirft aber
`"Not authenticated"`, wenn die Session fehlt. Beide Welten sind nicht verdrahtet — das erklärt die
"`[chat-history] fetch error: Not authenticated`"-Fehler, die der User in der Console sieht.

**Konsequenz für neue Arbeit:**
- Beim Debug von "Not authenticated"-Fehlern prüfen, **welches** Auth-System die jeweilige Seite nutzt.
- Die `AuthContext`-Login registriert den User nur für `/api/*` (Cookie). Die `/api/v1/*`-Aufrufe
  (Chat, Settings-Sync, Ingestion v2) brauchen einen **separaten** Login-Flow, der bisher fehlt.
- Siehe OQ-ARCH-001 (Konsolidierung offen).

**Endpunkt-Zuordnung (wichtig):**

| Frontend-API-Datei | Auth | Pfad | Zweck |
|---|---|---|---|
| `api/chat.ts:153` | Bearer | `POST /api/v1/rag/query` | Chat-Streaming (SSE) |
| `api/chat.ts:95` | Bearer | `POST /api/v1/chat/title` | Titel-Generierung |
| `api/config.ts:177,191` | Bearer | `GET/PUT /api/v1/config` | App-Config |
| `api/config.ts:265,276` | Bearer | `GET/PUT /api/v1/me/llm-config` | User-LLM-Config |
| `api/config.ts:526,537` | Bearer | `GET/PUT /api/v1/me/llm-secrets` | API-Keys |
| `api/ingestion.ts:37,69` | Bearer | `POST /api/v1/documents/ingest[/url]` | Ingestion v2 |
| `api/chatHistory.ts:7,32` | Bearer | `GET/PUT /api/v1/me/chat-history` | Sidebar-Sync |
| `lib/api/models.ts:32-38` | Cookie | `/api/admin/models` | Modellkatalog (admin) |
| `api/chatsApi.ts:19-41` | Cookie | `/api/chats/*` | Chat-CRUD |
| `lib/api/index.ts` (generic) | Cookie | `/api/projects/*`, `/api/auth/*`, etc. | Projects, Auth, Users, Teams |
| `api/streamChat.ts:80` | **keine** | `POST /api/chats/:id/messages/stream` | **orphan** — nicht in `useChat` verwendet |
| `api/admin.ts:1-10` | — | — | **komplett gestubbt** (leere Returns) |

**Viele `/api/v1/*`-Endpunkte existieren im Backend aktuell NICHT** (siehe CONFLICT-001). Sie sind
Frontend-Wünsche, die auf Backend-Seite noch fehlen. Das erklärt warum Chat/Config-Sync zur Laufzeit
fehlschlagen, obwohl der Build sauber ist.

---

## [KB-012] Feature-Interaktions-Karte (Wie alles zusammenhängt)

- **Quelle:** TASK-2026-07-05-feature-interaction-map
- **Stand:** 2026-07-05

Vollständige Karte aller Feature-Interaktionen. Das ist das zentrale Gedächtnis für "wie hängen
Chat, Config, Teams, Projects, Ingestion, Quellen zusammen".

### 12.1 Entitäts-Beziehungen (Datenmodell)

```
roles (1) ──< users (n)              app_models (Konfig, kein FK)
              │
   ┌──────────┼──────────────────────────────┐
   │          │ (owner)                       │ (lead)
   ▼          ▼                               ▼
projects   teams ──< team_members >── users   (Mitgliedschaft n:n)
   │          │
   │ 1:1      │ team_id (nullable)
   ▼          ▼
project_settings  project_documents (Quellen) ──< document_chunks (embedding vector(1536))
                          │
                          ├── project_id (nullable! globale/team-Quellen)
                          ├── user_id (Uploader)
                          ├── owner_id (Eigentümer)
                          ├── team_id (für visibility='team')
                          └── visibility: global|team|members|private

users ──< chats (project_id nullable, projektlos ADR-004) ──< messages (citations jsonb)
                          │
                          └── zugriff über accessible_document_ids(user_id) — nicht über project!

project_documents ──< source_members (visibility='members' Einzel-Zuweisung n:n)
```

**Alle FKs in `backend/supabase/schema.sql`.** `project_settings` hat 1:1 (logisch, erzwungen in
`projectRoutes.py:112-129`, nicht DB-unique). `chats.project_id` & `project_documents.project_id`
sind beide **nullable** (ADR-004, OQ-RB-001).

### 12.2 RBAC-Kern: `accessible_document_ids(p_user)` (DER Anker)

Definiert als PostgreSQL RPC in `schema.sql:239-250`. Ein User sieht ein Dokument, wenn EINE Bedingung
zutrifft:
1. `visibility='global'` → jeder (nur Admin darf setzen, `rbacRoutes.py:247`)
2. `owner_id = p_user` → Eigentümer
3. `user_id = p_user` → Uploader (Kompatibilitätsspalte)
4. `visibility='team' AND team_id ∈ team_members` → Team-Mitglied
5. `visibility='members' AND id ∈ source_members` → explizit zugewiesen

**Wichtig:** `project_id` ist **kein** Filterkriterium in dieser RPC. Projekt-Zugehörigkeit spielt für
den Dokument-Zugriff **keine Rolle mehr** — nur noch für S3-Pfad und Settings-Anker.

**Diese eine Funktion ist die Single-Source-of-Truth für ZUGRIFF.** Sie wird genutzt von:
- `rag/retrieval/index.py:38` — RAG-Suche (cross-Projekt)
- `routes/rbacRoutes.py:219` — `/api/rbac/sources` (Quellen-Ansicht)
- `services/access.py:7` — Python-Wrapper
- MCP-Server (implizit über `user_id`-Übergabe)

**Das bedeutet:** Was ein User in `/sources` sehen kann, danach kann auch der Chat suchen. Es gibt
keine separate Filterlogik.

### 12.3 Tier-System (admin < team_lead < member)

`TIER_RANK = {admin:0, team_lead:1, member:2}` (`jwtAuth.py:18`). Niedrigerer Wert = mehr Rechte.
Tier wird pro Request aus DB gejoint (JWT enthält nur `role`).

| Aktion | admin | team_lead | member |
|---|---|---|---|
| User verwalten (`/users`) | ✅ | ❌ | ❌ |
| Teams anlegen | ✅ | ❌ | ❌ |
| Team-Mitglieder verwalten | ✅ | eigene Teams | ❌ |
| Quellen hochladen (`/ingestion`) | ✅ | ✅ | ❌ |
| `visibility='global'` setzen | ✅ | ❌ | ❌ |
| `visibility='team'` setzen | ✅ | eigenes Team | ❌ |
| Chat nutzen + Quellen lesen | ✅ | ✅ | ✅ (nur zugewiesene/global) |

Frontend: `TierGuard minTier=...` in `App.tsx` prüft Rang. Sidebar-Filter in
`sidebarNavItems.tsx` (`adminOnly` / `minTier`).

### 12.4 Feature 1: PROJECTS

**Frontend:** `ProjectsPage.tsx` (Liste), `ProjectDetailPage.tsx` (Detail mit Tabs).
**Backend:** `routes/projectRoutes.py` → `GET/POST/PUT/DELETE /api/projects/*`.
**Tabellen:** `projects`, `project_settings` (1:1 beim Anlegen erzeugt, `projectRoutes.py:112-129`).

Projekt = Container für: eigene Chats, eigene Settings (RAG-Strategie, Modelle), eigene Uploads.
**Bedeutung schwindet:** Seit ADR-004 ist Chat projektlos; Quellen-Zugriff läuft über
`accessible_document_ids` nicht über `project_id`.

### 12.5 Feature 2: INGESTION (Upload → Chunks → Embeddings)

**Frontend:** `IngestionPage.tsx` (354 Zeilen). Guard: `TierGuard team_lead` (`App.tsx:62`), Sidebar
aber `adminOnly` (`sidebarNavItems.tsx:47`) — **Widerspruch** (OQ-ARCH-003).

**3-Phasen-Upload-Flow:**
1. `POST /api/projects/{pid}/files/upload-url` → S3-Presigned-URL (1h gültig) + DB-Record
   (`project_documents`, status=`pending`, `visibility='private'`). Backend: `projectFilesRoutes.py:69-185`.
2. Browser → S3 PUT (direkt, `lib/api/index.ts:37-44`).
3. `POST /api/projects/{pid}/files/confirm` → status=`queued` + `celery.delay(document_id)`
   (`projectFilesRoutes.py:246`).

**Celery-Worker** (`services/celery.py`, Broker=Redis): `process_document(document_id)` in
`rag/ingestion/index.py:15-64`:
1. Partitioning (S3→/tmp, `unstructured` zerlegt in Text/Tabellen/Bilder)
2. Chunking (`chunk_by_title`, max 3000 chars)
3. Summarising (pro Chunk KI-Zusammenfassung bei Tabellen/Bildern — Live-Status-Updates!)
4. Vectorization (OpenAI-Embeddings 1536-dim in Batches à 10, Retry+Backoff)

**Geschriebene Tabellen:** `project_documents` (Status-Maschine), `document_chunks` (Embeddings).
Frontend pollt alle 4s den Status (`IngestionPage.tsx:100`).

**Status-Werte:** `pending→queued→processing→partitioning→chunking→summarising→vectorization→completed/failed`.
⚠️ Schema-Constraint (`schema.sql:143`) ist veraltet (OQ-ARCH-004).

### 12.6 Feature 3: QUELLEN/SOURCES (Dokumenten-Verwaltung)

**WICHTIG:** Es gibt **keine** separate Quellen-Tabelle. "Quellen" = `project_documents`-Einträge,
auf die der User zugreifen darf (via `accessible_document_ids`).

**Frontend (2 Seiten):**
- `SourcesPage.tsx` (Liste): `GET /api/rbac/sources` (`rbacRoutes.py:215`) filtert über
  `accessible_document_ids`. Visibility-Editor für admin/team_lead (`PUT /api/rbac/sources/{id}/visibility`).
- `SourceViewPage.tsx` (Detail): `GET /api/projects/{pid}/files/{did}/chunks` → zeigt Chunks.
  Route `/source-view/:projectId/:documentId`.

**Zusammenhang Ingestion → Quellen:** Jeder Upload legt einen `project_documents`-Record an. Sobald
der User Zugriffsrechte hat (Eigentümer/global/team/members), taucht er in `/sources` auf.

**⚠️ Lücke:** `SourceViewPage` ist projektorientiert (URL hat `:projectId`), kann globale/team-Quellen
mit `project_id IS NULL` nicht sauber anzeigen (OQ-ARCH-005).

### 12.7 Feature 4: TEAMS & USERS

**Teams** (`TeamsPage.tsx`, Guard `team_lead`): Teams anlegen (nur Admin, `rbacRoutes.py:132`),
Mitglieder verwalten (Admin oder Team-Lead). `GET/POST/DELETE /api/rbac/teams/*`.
**Users** (`UsersPage.tsx`, Guard `admin`): Benutzer-Liste, Promoten, Anlegen. `/api/auth/users`.

**Auswirkung auf Dokument-Zugriff** ist *indirekt*: Tier bestimmt, welche `visibility`-Werte man
setzen darf. Die eigentliche Zugriffsentscheidung läuft über `accessible_document_ids` — unabhängig
von der Tier-Prüfung im Lese-Moment.

### 12.8 Feature 5: CHAT (RAG)

**⚠️ Zwei verschiedene Chat-Konzepte (entkoppelt!):**

1. **Sidebar-Thread-Chats (Primary, läuft):** `useChat` (`hooks/useChat.ts`) arbeitet mit
   localStorage-Threads + `POST /api/v1/rag/query` (Bearer, SSE). **Das ist der aktive Chat.**
2. **Projekt-Chats (Legacy/CRUD):** `ProjectDetailPage` lädt `GET /api/projects/{pid}/chats` und
   verlinkt `/projects/{pid}/chats/{chatId}`. **Aber `ChatPage` liest `:chatId`/`:projectId` NICHT aus
   der URL** (`App.tsx:59` vs. `hooks/useChat.ts:230`) → funktionale Lücke (OQ-ARCH-002).

**Chat-Konfiguration** kommt aus `useSettings()` (localStorage `ws-copilot-settings`):
- Provider/Modell (`llmProvider`, Modell-Name)
- Temperatur, Systemprompt, Knowledge-Mode (`docs_only|docs_plus_model|search`)
- Modell-Auswahl-UI: `ModelSelector` → `useChatModels` → `PUT /api/v1/me/llm-config`

**Sources/Citations** kommen **ausschließlich aus dem SSE-Stream** als Event `type:'sources'`
(`api/chat.ts:358`). Klick auf Quelle → `/source-view/:documentId`.

### 12.9 Feature 6: CONFIG/SETTINGS (ZWEI separate Oberflächen!)

**A) Route `/settings` → `SettingsPage.tsx` (die gerenderte Seite, admin-only):**
Verwaltet **nur** Requesty-Modelle (`/api/admin/models`, Legacy-Cookie-API). Label/model_id/purpose/enabled.
**Keine** Verbindung zu LLM-Providern, API-Keys, Retrieval-Parametern oder Chat-Verhalten.

**B) `SettingsModal` + `features/settings/*` (das "echte" Config-System — UI-ORPHAN!):**
Das riesige Modul (25 Dateien) steuert: API-Keys, LLM-Einstellungen, Embedding, Reranker, HyDE,
Chunking, Custom-Profile, Retrieval-Labor. **Aber `components/SettingsModal.tsx` wird NIRGENDS
eingebaut** (grep findet nur die Definition, keinen Konsumenten). `SettingsContext.openSettings()`
ist ein **toter Schalter** — State wird gesetzt, aber kein UI reagiert.

**Konsequenz:** API-Keys, Retrieval-Lab, Reranker, Embedding sind im Code fertig, aber
**UI-mässig nicht verdrahtet**. Nur Modell-Auswahl im Chat-Input funktioniert.

### 12.10 End-to-End-Flow: "User stellt Frage im Chat"

```
ChatPage → useChat → queryRAGStream → POST /api/v1/rag/query (Bearer, SSE)
   │
   │ [WICHTIG: Endpunkt existiert im Backend aktuell NICHT — CONFLICT-001/OQ-ARCH-001]
   │
   ▼
Backend RAG-Agent (simple/supervisor) → retrieve_context(project_id, query, user_id)
   │ 1. get_effective_settings(project_id) — Defaults bei NULL (ADR-004)
   │ 2. get_accessible_document_ids(user_id) — ZUGRIFFSMENGE (cross-Projekt!)
   │ 3. Strategie: basic|hybrid|multi-query
   ▼
Supabase RPC: vector_search_document_chunks(query_embedding, filter_document_ids, ...)
   │ SQL: WHERE document_id = ANY(filter) AND 1-(embedding<=>query) > threshold
   ▼
build_context → LLM.invoke() → SSE: status → token → done (citations)
   │
   ▼
Frontend: useChat empfängt Tokens + Sources → SourcePanel → /source-view/:documentId
```

**Das Bindeglied ist `accessible_document_ids`:** Derselbe Mechanismus filtert `/sources` UND die
RAG-Suche. Was der User in `/sources` sieht, danach kann der Chat suchen.

### 12.11 Frontend-Routing-Übersicht (`App.tsx`)

| Pfad | Guard | Komponente | Zweck |
|---|---|---|---|
| `/login` `/forgot-password` `/reset-password` `/unauthorized` | öffentlich | jewe. Page | Auth-Flows |
| `/` | AuthGuard | `ChatPage` | Haupt-Chat (Startseite) |
| `/projects` | AuthGuard | `ProjectsPage` | Projektliste |
| `/projects/:projectId` | AuthGuard | `ProjectDetailPage` | Projekt-Detail (Tabs) |
| `/projects/:projectId/chats/:chatId` | AuthGuard | `ChatPage` | **⚠️ entkoppelt** (OQ-ARCH-002) |
| `/token-usage` | AuthGuard | `TokenUsagePage` | Tokenverbrauch (UI-only, `api/admin.ts` gestubbt) |
| `/ingestion` | AuthGuard + `team_lead` | `IngestionPage` | Upload |
| `/sources` | AuthGuard | `SourcesPage` | Quellen-Verwaltung |
| `/teams` | AuthGuard + `team_lead` | `TeamsPage` | Team-Verwaltung |
| `/users` | AuthGuard + `admin` | `UsersPage` | Benutzerverwaltung |
| `/settings` | AuthGuard + `admin` | `SettingsPage` | Requesty-Modelle (nur das!) |
| `/source-view/:projectId/:documentId` | AuthGuard | `SourceViewPage` | Chunk-Detail |

**Totcode:** `ProtectedRoute.tsx` (ungenutzt), `RegisterPage.tsx` (keine Route), `api/streamChat.ts`
(orphan), `api/admin.ts` (gestubbt).

### 12.12 State-Management

**Kein globaler Store** (kein Redux/Zustand). State über Context + localStorage:
- **Auth:** `AuthContext` (Cookie-basiert, `GET /api/auth/me`)
- **Settings:** `SettingsContext` (localStorage `ws-copilot-settings`)
- **Chat-Threads:** localStorage `ws-copilot-chat-threads` + Custom-Events (`CHAT_HISTORY_CHANGED`)
- **Layout/Dialog:** `LayoutContext`/`DialogContext`

**Parallele Token-Session:** `auth/session.ts` verwaltet `ws-copilot-auth-session` (Bearer) — wird
nur von `fetchWithAuth` benutzt, **nicht** von `AuthContext` gepflegt. Das ist die Auth-Lücke (KB-011).

### 12.13 Nächste Schritte (empfohlen)

1. **OQ-ARCH-001** (API/Auth-Konsolidierung) — höchste Priorität. Die zwei Auth-Systeme sind die
   Wurzel der "Not authenticated"-Fehler.
2. **OQ-ARCH-002** (Projekt-Chat-Route) — entweder `ChatPage` an URL-Params binden oder Route entfernen.
3. **OQ-ARCH-006** (SettingsModal verdrahten) — die fertige Config-UI muss erreichbar sein.
4. Schema-Constraint `processing_status` reparieren (OQ-ARCH-004).
5. `SourceViewPage` für projektlose Quellen erweitern (OQ-ARCH-005).
