# Offene Fragen

Dokumentation aller offenen Fragen und Konflikte. Wird bei jedem Session-Start geprüft.

---

## Offene Fragen

### [OQ-RB-001] Projekt-Scoping fuer geteilte Quellen
- **Erstellt:** 2026-07-04
- **Kontext:** Globale/Team-Quellen muessen fuer alle bzw. ein Team sichtbar sein. Heute ist `project_documents.project_id` NOT NULL und projektgebunden (`schema.sql:42`).
- **Beteiligte:** Product Owner, Architect
- **Status:** GEKLAERT
- **Loesung:** `project_documents.project_id` wird **nullable**. Globale/Team-Quellen erhalten `project_id = NULL`; persoenliche Uploads behalten ihr Projekt. Zugriff laeuft rein ueber `accessible_document_ids(user_id)`, nicht mehr ueber das Projekt.

### [OQ-RB-002] Ein Team Lead pro Team oder mehrere Teams?
- **Erstellt:** 2026-07-04
- **Kontext:** `teams.lead_id` ist 1:1 modelliert. Unklar, ob ein Team Lead mehrere Teams leiten darf.
- **Beteiligte:** Product Owner
- **Status:** GEKLAERT
- **Loesung:** Ein Team Lead darf **mehrere** Teams leiten (1:n — mehrere `teams`-Zeilen koennen denselben `lead_id` haben). Modellierung unterstuetzt das bereits.

### [OQ-RB-003] Duermen Mitglieder eigene private Uploads?
- **Erstellt:** 2026-07-04
- **Kontext:** Mitglieder sind als reine Konsumenten konzipiert. Alternative: duerfen sie eigene `private` Quellen hochladen?
- **Beteiligte:** Product Owner
- **Status:** GEKLAERT
- **Loesung:** **Nein** — Mitglieder (Tier `member`) sind reine Konsumenten. Quellen-Upload/Erstellung nur fuer Tier `admin` und `team_lead`.

### [OQ-RB-004] Team-Querverweis / Sichtbarkeit anderer Teams
- **Erstellt:** 2026-07-04
- **Kontext:** Sieht ein Team Lead die Mitglieder/Namen anderer Teams?
- **Beteiligten:** Product Owner
- **Status:** GEKLAERT
- **Loesung:** Ein Team Lead sieht **nur seine eigenen** Teams + deren Mitglieder. Quer-Einsicht in fremde Teams nur fuer Tier `admin`.

### [OQ-MCP-001] Globale/Team-Quellen ueber MCP-Projekt-Tools
- **Erstellt:** 2026-07-04
- **Kontext:** Seit OQ-RB-001 sind globale/Team-Quellen projektunabhaengig (`project_documents.project_id IS NULL`), Zugriff via `accessible_document_ids(user_id)`. Die MCP-Tools `ask_rag`/`search_documents` sind aber projektbezogen (`project_id`-Parameter). Werden diese Quellen gefunden?
- **Beteiligten:** Architect, Developer
- **Status:** GEKLAERT (Teil)
- **Loesung:** `retrieve_context` berechnet die Zugriffsmenge via `accessible_document_ids(user_id)` unabhaengig vom Projekt — globale/team-sichtbare Quellen **des Service-Users** fliessen also in die Suche ein, auch wenn der Aufruf ein Projekt benennt. `list_projects` listet hingegen nur Projekte mit `owner = Service-User`. Folge-Frage (OFFEN): soll es ein projektunabhaengiges `search_global`-Tool geben?

### [OQ-MCP-002] Echter Service-Account + API-Key statt feste User-ID
- **Erstellt:** 2026-07-04
- **Kontext:** ADR-003 nutzt eine feste `MCP_SERVICE_USER_ID` (Shared-Secret-Charakter). Fuer produktives M2M waere ein eigener Service-Account (neue Rolle) + API-Key mit Rotate/Revoke sauberer.
- **Beteiligten:** Architect, Security Expert
- **Status:** OFFEN (Folge-Task)
- **Loesung:** Folge-Task anlegen: neue Rolle `service` + Tabelle `api_keys` (hash, scope, created/revoked) + Migration (Human-Approval). Bis dahin gilt ADR-003.

---

## Architektur-Fragen (OQ-ARCH-XXX) — aus TASK-2026-07-05-feature-interaction-map

### [OQ-ARCH-001] Zwei parallele API/Auth-Systeme im Frontend konsolidieren

- **Erstellt:** 2026-07-05
- **Kontext:** Frontend hat zwei Auth-Subsysteme (KB-011): `/api/v1/*` mit Bearer-Token (localStorage `ws-copilot-auth-session`) vs. `/api/*` mit Cookies. `AuthContext` (cookie) schreibt keinen Bearer-Token → `fetchWithAuth` wirft "Not authenticated" für Chat/Config/Ingestion-v2. Das ist die Wurzel der Console-Fehler, die der User sieht. Zudem existieren viele `/api/v1/*`-Endpunkte im Backend gar nicht (CONFLICT-001).
- **Beteiligte:** Architect, Developer
- **Status:** TEILWEISE GELOST (2026-07-05, TASK-2026-07-05-app-usable, KB-013) — Auth-Teil erledigt; Rest = OQ-ARCH-007
- **Lösung:** Gewählt wurde Variante (2): `fetchWithAuth`/`postFormWithAuthProgress` nutzen jetzt das
  Login-Cookie (`credentials:'include'`/`withCredentials`, Bearer optional, kein hartes Gate mehr).
  Da das Backend `_decode_token` Cookie-vor-Bearer prüft (`jwtAuth.py:54`), authentifiziert die
  Cookie-Session auch alle `/api/v1/*`-Aufrufe. Damit ist Login → Chat → Settings funktional.
  **Offen (→ OQ-ARCH-007):** welche `/api/v1/*`-Endpunkte im Backend fehlen (Ingestion) bzw. nur
  Stub sind (RAG) — das ist kein Auth-, sondern ein API-Problem.

### [OQ-ARCH-002] Projekt-Chat-Route ist funktional entkoppelt

- **Erstellt:** 2026-07-05
- **Kontext:** `App.tsx:59` definiert Route `/projects/:projectId/chats/:chatId` → `ChatPage`. Aber `ChatPage`/`useChat` liest diese URL-Parameter **nicht aus** — es nutzt localStorage-Threads (`hooks/useChat.ts:230`). Klick auf Projekt-Chat-Link zeigt also denselben aktiven Thread, `:chatId` wird ignoriert.
- **Beteiligte:** Developer
- **Status:** OFFEN
- **Lösungsvorschlag:** Entweder `useChat` an `useParams()` binden (Projekt-Chat lädt `GET /api/projects/{pid}/chats/{cid}`) ODER Route entfernen und nur noch projektlosen Chat (ADR-004) unterstützen.

### [OQ-ARCH-003] Sidebar "Ingestion"-Eintrag ist `adminOnly`, Route erlaubt `team_lead`

- **Erstellt:** 2026-07-05
- **Kontext:** `sidebarNavItems.tsx:47` markiert Ingestion als `adminOnly:true` (nur Admin sieht Menüpunkt). Route in `App.tsx:62` erlaubt aber `TierGuard minTier="team_lead"`. Backend (`projectFilesRoutes.py:87`) erlaubt admin+team_lead Upload. Team-Leads können über direkte URL `/ingestion` zugreifen, sehen aber keinen Menüpunkt.
- **Beteiligte:** Product Owner, Developer
- **Status:** GELOST (2026-07-05, TASK-2026-07-05-app-usable)
- **Lösung:** `sidebarNavItems.tsx` — `/ingestion` von `adminOnly:true` auf `minTier:'team_lead'`
  geändert. Menüpunkt jetzt sichtbar für admin + team_lead, konsistent mit Route (`App.tsx:62`) und
  Backend-Policy (`projectFilesRoutes.py`, KB-009).

### [OQ-ARCH-004] Schema-Constraint `processing_status` ist veraltet

- **Erstellt:** 2026-07-05
- **Kontext:** `schema.sql:143` erlaubt `processing_status` nur Werte `('pending','processing','ready','error','uploaded','chunked','embedded')`. Code (`models/index.py:41-50`) + Frontend nutzen aber `('pending','queued','processing','partitioning','chunking','summarising','vectorization','completed','failed')`. Diese Mengen sind disjunkt — Ingestion schreibt z.B. `'completed'` (`ingestion/index.py:58`), was der Constraint ablehnen würde. Potenzieller Insert-Fehler bei aktivem Schema.
- **Beteiligte:** Developer, DBA
- **Status:** GELOST (code-seitig, 2026-07-05, TASK-2026-07-05-app-usable) — Schema-Anwendung auf Supabase durch User noch offen
- **Lösung:** `schema.sql` — Inline-CHECK auf die Code-Werte gebracht (`uploading,pending,queued,
  processing,partitioning,chunking,summarising,vectorization,completed,failed`) + idempotentes
  `DROP/ADD CONSTRAINT project_documents_processing_status_check` für Altbestand. Wirkt, sobald der
  User `schema.sql` im Supabase SQL-Editor ausführt (Human-Approval).

### [OQ-ARCH-005] SourceViewPage kann projektlose Quellen nicht anzeigen

- **Erstellt:** 2026-07-05
- **Kontext:** `SourceViewPage` hat Route `/source-view/:projectId/:documentId` und lädt `GET /api/projects/{pid}/files/{did}/chunks`. Globale/team-Quellen mit `project_id IS NULL` (OQ-RB-001) haben kein Projekt → können nicht angezeigt werden, obwohl sie in `/sources` auftauchen und im Chat durchsuchbar sind.
- **Beteiligte:** Developer
- **Status:** OFFEN
- **Lösungsvorschlag:** Route auf `/source-view/:documentId` ändern + Chunks via RBAC-Endpunkt (`GET /api/rbac/sources/{did}/chunks`) laden statt projekt-scoped.

### [OQ-ARCH-006] SettingsModal ist orphaned (Config-UI nicht erreichbar)

- **Erstellt:** 2026-07-05
- **Kontext:** Das umfangreiche Config-System (`features/settings/*`, ~25 Dateien: API-Keys, LLM-Einstellungen, Embedding, Reranker, Retrieval-Lab) ist fertig, aber `components/SettingsModal.tsx` wird **nirgends eingebaut**. `SettingsContext.openSettings()` ist ein toter Schalter. Die `/settings`-Route zeigt nur Requesty-Modelle. Nutzer können API-Keys/Retrieval-Param nicht konfigurieren.
- **Beteiligte:** Developer, Product Owner
- **Status:** OFFEN
- **Lösungsvorschlag:** `SettingsModal` in `DashboardLayout` rendern ( controlled by `SettingsContext.isOpen`) ODER `/settings`-Route erweitern. Vorher klären, ob die `/api/v1/config`/`/api/v1/me/llm-config`-Endpunkte überhaupt im Backend existieren (OQ-ARCH-001).

### [OQ-ARCH-007] Ingestion-Phantom-API + RAG-Stub — welcher Pfad für Meilenstein 2?

- **Erstellt:** 2026-07-05
- **Kontext:** Live-Frontend nutzt `/api/v1/*`-Layer (`useChat`→`queryRAGStream`).
  - **Ingestion (KEIN Blocker):** Die `/ingestion`-Seite (`IngestionPage.tsx`) nutzt `apiClient`
    (Cookie) → `POST /api/projects/{pid}/files/upload-url` + S3 + `/confirm` → Celery `process_document`
    — das ist die **echte, funktionierende** Pipeline (identisch zu `six-figure-rag-api`).
    Nur der **In-Chat-Upload** (`useChatUpload`→`api/ingestion.ts`) spricht Phantom-`/api/v1/documents/*`.
  - **RAG (der echte Rest-Blocker):** Live-Chat (`hooks/useChat.ts`) → `queryRAGStream` →
    `/api/v1/rag/query` (`ragRoutes.py:90`) = **zustandsloser LLM-Stub** (kein `retrieve_context`,
    keine Vektorsuche, keine Requesty-Anbindung). Der Chat plaudert, durchsucht aber NICHT die
    ingestierten `document_chunks`.
  - **Echter RAG existiert bereits**, ist nur nicht an den Live-Chat angebunden:
    `POST /api/chats/{cid}/messages/stream` (`chatRoutes.py:186`) → `chat_streaming.py` →
    `create_supervisor_agent` (macht `retrieve_context` + Vektorsuche über `accessible_document_ids`).
    A0/A1-Clients vorhanden: `streamChat.ts` (`streamChatMessage`, cookie, `event:`-Parse,
    Citation-Mapping), `chatsApi.ts` (`createChat` usw.) — aktuell **orphan** (KB-007/008/011).
- **Beteiligte:** Architect, Developer, Product Owner
- **Status:** GELOST (2026-07-05, RAG-Anbindung umgesetzt — siehe KB-014)
- **Umsetzung (Frontend verdrahten, ehem. Option B):** `hooks/useChat.ts` ruft nicht mehr
  `queryRAGStream` (Stub `/api/v1/rag/query`), sondern `createChat` (create-on-first-send) +
  `streamChatMessage` → `POST /api/chats/{cid}/messages/stream` (echtes RAG über
  `create_supervisor_agent`/`retrieve_context`). Vorbild: `six-figure-rag-web` (Chat existiert vor
  Stream, SSE `event:`/`data:`, `done.aiMessage.citations`). Pro Thread wird die server-chatId in
  localStorage (`ws-copilot-thread-chatids`) gemappt. `tsc --noEmit` clean.
- **Verbleibend (Aufräumarbeit, Human-Approval zum Löschen):** Phantom-/Stub-Dateien sind jetzt
  ungenutzt und zur Entfernung markiert — siehe KB-014.
- **Alternative — Backend anbinden:** `/api/v1/rag/query` an `retrieve_context` + Requesty koppeln,
  damit der Stub zur echten Suche wird. Frontend bleibt.

---

## Konflikte (CONFLICT-XXX)

### [CONFLICT-001] Frontend spricht `/api/v1/*` an, Backend hat nur `/api/auth|projects|chats`

- **Erstellt:** 2026-07-04
- **Widerspruch:** Das Frontend rief primär Phantom-Endpunkte an (`/api/v1/rag/query`, `/api/v1/chat/title`, `/api/v1/me/chat-history`, `/api/v1/ingestion/*`, `/api/feedback`, `/api/auth/change-password`), die im Backend nicht existieren. Zudem nutzt das Frontend einen SSE-Parser, der das `event:`-Feld ignoriert und auf `data.type` dispatcht, während das Backend genau umgekehrt `event:`-basiert sendet und **kein** `type`-Feld im JSON setzt. Citations liefert das Backend im `done`-Event (`aiMessage.citations`), nicht als separates `sources`-Event.
- **Option A:** Backend = Source of Truth; Frontend an echte Endpunkte anpassen. — Quelle: `backend/src/routes/*`, `server.py:38-41`
- **Option B:** Frontend = Source of Truth; Backend um `/api/v1/*` erweitern (RAG/Agenten neu verdrahten). — Quelle: `frontend/src/api/chat.ts`
- **Status:** GELÖST (Hybrid — Teil von Option A + ausgewählte Frontend-Features ins Backend)
- **Entscheidung:** **Hybrid.** Backend bleibt API-Anker. Frontend wird angepasst. Ausgewählte Frontend-Wünsche (`/api/feedback`, `/api/auth/change-password`) werden später ins Backend aufgenommen (Stufe S5). Chats werden user-private + projekt-gebunden (A0) → später cross-Projekt (A1) und RBAC-Sharing (C). Globales Embedding-Modell via `.env`/Admin (eines für alle; Wechsel → Re-Ingestion).
- **Entscheidungsträger:** User (2026-07-04) nach Klärungsrunde.
- **Umsetzung:** TASK-2026-07-04-a0-chat-rag-test (A0-Frontend-Anbindung), ADR-004.

### [CONFLICT-002] `project-status.md` ist stale (ADR-001, OQ-RB)

- **Erstellt:** 2026-07-04
- **Widerspruch:** `project-status.md:34` nennt ADR-001 als nicht-ACCEPTED und OQ-RB-001..004 als offen. Tatsächlich ist ADR-001 ACCEPTED (`decisions.md:9`) und alle OQ-RB geklärt (`open-questions.md`); `accessible_document_ids(user_id)` existiert, Tier-Modell (`admin/team_lead/member`) aktiv in `App.tsx` (TierGuard).
- **Status:** GELÖST
- **Entscheidung:** `project-status.md` wird mit diesem Task korrigiert (ADR-001 = ACCEPTED, RBAC umgesetzt). Status-Dokument künftig synchron zu `decisions.md`/`open-questions.md` halten.
- **Entscheidungsträger:** Agent (Konsistenz-Fix).

---

## Template für neue Fragen

```markdown
### [Q-XXX] [Frage]

- **Erstellt:** YYYY-MM-DD
- **Kontext:** [Warum ist die Frage relevant?]
- **Beteiligte:** [Wer muss klären?]
- **Status:** [OFFEN | IN Bearbeitung | GEKLÄRT]
- **Lösung:** [Wird ausgefüllt nach Klärung]
```

---

## Template für Konflikte

```markdown
### [CONFLICT-XXX] [Beschreibung]

- **Erstellt:** YYYY-MM-DD
- **Widerspruch:** [Was widerspricht sich?]
- **Option A:** [Beschreibung] — Quelle: [Dokument]
- **Option B:** [Beschreibung] — Quelle: [Dokument]
- **Status:** [OFFEN | KLÄRUNG LAUEND | GELÖST]
- **Entscheidung:** [Wird ausgefüllt nach Klärung]
- **Entscheidungsträger:** [Wer hat entschieden?]
```

---

## Gelöste Fragen

| ID | Frage | Lösung | Datum |
|----|-------|--------|-------|
| OQ-RB-001 | Projekt-Scoping geteilter Quellen | `project_id` nullable; Zugriff via `accessible_document_ids` | 2026-07-04 |
| OQ-RB-002 | Team Lead mehrere Teams? | ja, 1:n | 2026-07-04 |
| OQ-RB-003 | Mitglieder eigene Uploads? | nein, reine Konsumenten | 2026-07-04 |
| OQ-RB-004 | Querverweis fremde Teams? | nein, nur eigene (admin sieht alle) | 2026-07-04 |
| OQ-MCP-001 | Globale/Team-Quellen ueber MCP-Projekt-Tools? | ja, via accessible_document_ids (projektunabhaengig) | 2026-07-04 |
