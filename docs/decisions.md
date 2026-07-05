# Architekturentscheidungen (ADR-Historie)

Verbindliches ADR-Log. Je Eintrag gilt die Vorlage in `docs/adr-template.md`.

---

# ADR-001: Rollen- & Berechtigungsmodell fuer Quellen (Tier-basiert)

- Status: ACCEPTED
- Date: 2026-07-04
- Authors: Architect (Agent)
- Related: Konzept `docs/architecture/role-permission-concept.md`, Diagramm `docs/architecture/role-permission-data-model.mmd`

## Context

Quellen sind heute streng pro Nutzer besitzt (`user_id`-Filter auf allen Routen,
`projectRoutes.py:51`, `projectFilesRoutes.py:44`). Es gibt keine Team-/Firmen-weite
Wissensfreigabe und nur die Rollen `user`/`admin` (`schema.sql:10`). Gefordert ist ein
flexibles Rollenmodell: Admins erstellen globale Quellen, Team Leads verwalten
Quellen+Mitglieder ihres Teams, Mitglieder konsumieren nur zugewiesene Quellen.
Rollen-Titel ("Geschaeftsfuehrer" usw.) muessen konfigurierbar bleiben.

## Decision

**Tier-basiertes Berechtigungsmodell** mit drei Faehigkeits-Tiers
(`admin` / `team_lead` / `member`) als einzigem Anker fuer Checks. Freie Rollen-Titel
werden ueber eine `roles`-Registry auf einen Tier abgebildet. Quellen erhalten eine
Sichtbarkeit (`global` / `team` / `members` / `private`). Zugriff wird zentral ueber
die RPC `accessible_document_ids(user_id)` berechnet und ersetzt alle Streu-Filter.

Neue Tabellen: `roles`, `teams`, `team_members`, `source_members`; `project_documents`
erhaelt `owner_id`, `visibility`, `team_id`.

## Alternatives Considered

1. **Fester Rollen-Enum** (`admin`/`team_lead`/`member` hart codiert) — einfacher,
   aber keine konfigurierbaren Titel wie "Geschaeftsfuehrer" ohne Code-Aenderung.
2. **ACL pro Quelle ohne Tier-Konzept** — maximal flexibel, aber hohes
   Performance-/Komplexitaetsrisiko und schwer auditierbar.
3. **Rollen-Titel als Tier (Tier = Rollenname)** — unmoeglich zu standardisieren,
   jede neue Rolle erfordert neue Check-Pfade.

## Decision Matrix

| Kriterium | Gewicht | Tier-basiert + Registry (gewaehlt) | Fester Enum | ACL pro Quelle |
|---|---:|---:|---:|---:|
| Flexibilitaet (Titel) | 3 | 3 | 1 | 3 |
| Komplexitaet | 3 | 2 | 3 | 1 |
| Sicherheit/Auditierbarkeit | 3 | 3 | 2 | 2 |
| Time-to-market | 2 | 2 | 3 | 1 |

## Consequences

- **Positiv:** Checks an genau drei Tiers; zentrale Zugriffsfunktion verhindert
  vergessene Filter; beliebige Rollen-Titel ohne Code-Aenderung moeglich.
- **Negativ:** Breaking Change fuer alle `user_id`-basierten Routen und die
  `users.role`-Constraint; Initial-Migration + Backfill noetig.
- **Neutral:** `project_documents.user_id` bleibt als Kompatibilitaetsspalte erhalten.

## Cost Estimate

- Startup (<1k MAU): gering — einfache Tabellen + eine RPC.
- Growth (10k MAU): acceptable — Index auf (`visibility`,`team_id`) empfohlen.
- Scale (100k MAU): `accessible_document_ids` ggf. materialisiert cachen.

## Validation Plan

1. Unit-Tests je Tier: `accessible_document_ids` liefert korrekte Mengen fuer
   global/team/members/private.
2. Negativ-Tests: Member kann fremde/team-fremde Quellen NICHT abrufen (HTTP 404).
3. E2E: Team Lead fuegt Mitglied hinzu → Mitglied sieht Team-Quelle sofort; remove →
   Zugriff erlischt.
4. Audit-Log: jede Vergabe/Entzug nachvollziehbar (`added_by`/`granted_by`).

---

# ADR-002: UI-Komponenten-Library - shadcn/ui auf Base UI

- Status: ACCEPTED
- Date: 2026-07-04
- Authors: Developer (Agent) + Product Owner
- Related: `docs/tasks/TASK-2026-07-04-shadcn-base-ui.md`, KB-005

## Context
Das Frontend hatte keine UI-Library (nur Tailwind v4 + handgeschriebene `ci-*`-Klassen +
`lucide-react`). Für wachsende UI-Komplexität (Dialoge, Selects, Tabs, Formulare) fehlen
barrierefreie Primitives.抉择 zwischen Chakra UI, Material UI und shadcn/ui.

## Decision
**shadcn/ui mit Base UI** als Primitive-Layer (nicht Radix).
- shadcn baut auf dem bereits vorhandenen Tailwind v4 auf — kein zweites Styling-System (Chakra/MUI
  bringen Emotion mit).
- Komponenten werden als Quellcode nach `components/ui/` kopiert (Copy-Paste, kein Version-Lock-in) —
  passt zum bestehenden "handgeschriebene Komponenten"-Muster.
- **Base UI** (`@base-ui/react`) statt Radix auf ausdrücklichen Wunsch: unstyled Primitives vom
  MUI-Team, shadcn unterstützt Base UI mittlerweile als Default.
- Themebar über CSS-Variablen → bestehender Pfirsich-Brand (`#f3aa7f`) und `ci-*` bleiben erhalten.

## Alternatives Considered
1. **Material UI** — zwingt Material-Design-Look auf, bricht mit Tailwind, schweres Bundle.
2. **Chakra UI** — eigenes Styling-System, dupliziert Tailwind.
3. **Radix als Primitive** (shadcn-Default bisher) — abgelehnt zugunsten Base UI.

## Consequences
- **Positiv:** Barrierefreie Primitives ohne neue Styling-Abhängigkeit; volle Kontrolle durch
  Quellcode-Besitz; Tailwind-first; bestehendes Design bleibt.
- **Negativ:** Zwei parallele Systeme (`ci-*` + shadcn-Tokens) Übergangszeit — bis Seiten migriert sind.
- **Neutral:** `components.json` mit `"style": "base-nova"`, `"baseColor": "neutral"`; shadcn-Tokens in
  oklch, ggfs. später an Pfirsich-Brand anzupassen.

## Validation Plan
1. `npm run build` läuft sauber (TSC + Vite). ✓ (2026-07-04)
2. Beispielkomponenten (button/input/dialog) importieren aus `@base-ui/react`. ✓
3. Bestehende Seiten rendern unverändert (`ci-*` intakt). ✓ (build clean)

---

# ADR-003: MCP-Server fuer agentic RAG (Service-User-ID + dualer Transport)

- Status: ACCEPTED
- Date: 2026-07-04
- Authors: Developer (Agent)
- Related: `docs/tasks/TASK-2026-07-04-mcp-server.md`, KB-006, ADR-001 (RBAC)

## Context

Externe Applikationen und AI-Clients (Claude Desktop, Cursor, opencode, Web-App) sollen den
agentic RAG (LangGraph Supervisor-Agent + Retrieval) nutzen koennen, um Fragen an die
Wissensbasis zu stellen. Der RAG-Pfad ist fuer `(question, project_id, user_id)` effektiv
zustaendslos (`create_supervisor_agent` in `agents/supervisor_agent/agent.py:244`,
`retrieve_context` in `rag/retrieval/index.py:18`). Die Zugriffskontrolle laeuft zentral ueber
`accessible_document_ids(user_id)` (ADR-001) — ohne `user_id` gaebe es einen ungefilterten
Projekt-Fallback (`retrieval/index.py:40`), der die RBAC umgeht. Es gibt bisher **keine**
API-Key-/Service-Account-Auth, nur JWT-Cookie-Auth.

## Decision

1. **Neuer MCP-Server** als eigener Prozess (`backend/src/mcp/`, FastMCP), der die bestehenden
   Agent-/Retrieval-Funktionen **direkt importiert** (kein HTTP-Umweg ueber die FastAPI).
2. **Identitaet ueber feste `MCP_SERVICE_USER_ID`** (env, UUID eines existierenden `public.users`):
   jede Tool-Ausweisung rechnet die Zugriffsmenge dieses Users aus. **Keine** Migration noetig,
   **kein** ungefilterter Fallback (leere ID → Server verweigert den Start).
3. **Dualer Transport**: `stdio` (lokale Clients, Default) + `streamable-http` (`MCP_HOST:MCP_PORT`,
   Remote/Web, docker-compose Service `mcp`). stdout bleibt fuer stdio frei; Logging auf stderr.
4. **Tools**: `ask_rag` (agentic Q&A + Zitierungen), `search_documents` (reines Retrieval),
   `list_projects` (Projekte des Service-Users).

## Alternatives Considered

1. **MCP ruft FastAPI via HTTP + JWT** — doppelter Hop, JWT-Beschaffung noetig,/streaming komplex.
   Abgelehnt: direkter Import ist einfacher und nutzt denselben Code.
2. **Service-Account + API-Key + eigene Migration** — sauberstes M2M-Auth, aber Migration
   (Human-Approval) + neue Tabellen. Aufgeschoben als Folge-Task (OQ-MCP-002).
3. **Client uebergibt `user_id` pro Aufruf** — flexibel, aber Client bestimmt Identitaet → nur in
   vertrauenswuerdigen Umgebungen vertretbar; fuer v1 abgelehnt.

## Consequences

- **Positiv:** Vollstaendige RBAC-Wahrung (Service-User sieht nur seine Zugriffsmenge); kein
  Schema-Change; beide Standard-Transports abgedeckt; Wiederverwendung des getesteten RAG-Cores.
- **Negativ:** Service-User-ID ist ein Shared-Secret-Charakter — kompromittiert → Sichtbarkeit der
  Zugriffsmenge dieses Users. Global-Quellen (`project_id IS NULL`, OQ-RB-001) sind ueber
  projektbezogene Tools nur bedingt erreichbar (siehe OQ-MCP-001).
- **Neutral:** MCP laeuft mit derselben god-mode Supabase-Service-Role wie das Backend;
  Zugriffskontrolle erfolgt in App-Code (wie ueberall). Token-Usage-Tracking fehlt repo-weit
  (Folge-Task).

## Validation Plan

1. Import-Check: `python -m src.mcp --transport stdio` startet (mit gesetzten Pflicht-env).
2. `list_projects` liefert genau die Projekte mit `user_id = MCP_SERVICE_USER_ID`.
3. `ask_rag`/`search_documents` rufen `accessible_document_ids(MCP_SERVICE_USER_ID)`; ein Dokument
   ausserhalb der Zugriffsmenge taucht in Zitierungen/Snippets **nicht** auf.
4. stdio: stdout enthaelt ausschliesslich JSON-RPC (keine Log-Zeilen).

---

# ADR-004: Chat-Architektur — projekt-gebundener MVP, user-private Chats, globales Admin-Embedding (Stufenmodell)

- Status: ACCEPTED
- Date: 2026-07-04
- Authors: Developer (Agent) + User
- Related: `docs/tasks/TASK-2026-07-04-a0-chat-rag-test.md`, `docs/tasks/TASK-2026-07-04-a1-cross-project-chat.md`, CONFLICT-001, ADR-001 (RBAC), KB-007, KB-008

## Context
Frontend und Backend waren zwei verschiedene APIs (CONFLICT-001): Frontend sprach nicht-existente `/api/v1/*`-Endpunkte an und nutzte einen inkompatiblen SSE-Parser. Der Backend-Chat (`/api/projects/{pid}/chats/{cid}/messages/stream`) ist voll funktionsfähig, aber projekt-gebunden. Ziel des Users: sein RAG testen können (Projekt erstellen, ingesten, Fragen stellen). Gewünschtes Endziel: user-private Chats, die über **alle** Projekte mit Zugriff zugleich suchen, globales Embedding-Modell (Admin, `.env`), ephemerale In-Chat-Uploads (ohne DB).

## Decision
**Stufenweises Vorgehen** (sodass der schnellste testbare Slice zuerst kommt; jede Stufe ist strenge Teilmenge der nächsten — keine vergeudete Arbeit):

1. **A0 (DONE):** Projekt-gebundener Chat. Frontend wird an das existierende Backend angebunden (neuer SSE-Client mit `event:`-Dispatch + `done.aiMessage.citations`→`Source[]`; `useChat` mit `projectId` + create-on-first-send). Backend UNVERÄNDERT. In-Chat-Upload & `/ingestion` vorerst ausgeblendet.
2. **A1 (DONE):** `useChat()` projektlos; `streamChat` → `POST /api/chats/{cid}/messages/stream`; `ChatPage` ohne Projekt-Selector. Backend: `services/chat_streaming.py` (NEU, projektlos, nutzt `accessible_document_ids(user_id)` via `retrieve_context`), `chatRoutes` neue Route. `get_effective_settings(None)` für Default-Settings. `chats.project_id` war bereits nullable (`schema.sql:73`) — keine Migration. Keine Änderung an A0-Route.
3. **B:** Ephemerale In-Chat-Uploads (kein DB-Eintrag; temporärer Doc-Kontext pro Chat für RAG).
4. **C:** RBAC-Zugriffsfeld auf Projekten → Chat sucht über alle *zugänglichen* (nicht nur eigenen) Projekte (baut auf ADR-001 / `accessible_document_ids`).

**Globales Embedding-Modell:** genau EIN Modell für das ganze System, in `.env`, vom Admin gesetzt, im Frontend read-only angezeigt. Wechsel → vollständige Re-Ingestion. RAG-Strategie/Agent/Weights analog zentral (`.env`/Admin). Projektspezifische `project_settings` entfällt als RAG-Treiber; Projekt wird zur reinen Knowledge Base.

## Alternatives Considered
1. **Sofort cross-Projekt mit RBAC (A1+C vor A0):** sauberstes Endziel, aber blockt den Test aufs längste. Abgelehnt zugunsten A0-zuerst.
2. **Frontend = Source of Truth, Backend bekommt `/api/v1/*`:** wirft funktionierenden RAG/Agenten-Code weg. Abgelehnt (CONFLICT-001).
3. **Per-Projekt-Embedding belassen:** mit cross-Projekt-Suche technisch unmöglich (Vektoren nicht vergleichbar). Abgelehnt.

## Consequences
- **Positiv:** RAG ist nach A0 testbar; Backend bleibt unangetastet; Inkrementeller Pfad ohne Re-Work; Embedding-Invariante (ein Modell) macht spätere cross-Projekt-Suche sicher.
- **Negativ:** A1 ist code-complete, aber Runtime-E2E steht aus (Phase-1-Infra); ephemerale Uploads & RBAC-Sharing (Stufe B/C) folgen; Dead Code (`api/chat.ts`, `api/chatHistory.ts`, `api/ingestion.ts`) bis S6; zwei Stream-Routen (alt projectRoutes + neu chatRoutes) — Konsolidierung als Folge.
- **Neutral:** `chats.project_id` war bereits nullable (`schema.sql:73`) — keine Migration nötig.

## Validation Plan
1. A0: `npm run build` clean (✓ 2026-07-04); Runtime-E2E nach Phase-1-Infra-Freigabe.
2. A1 (✓ Code DONE 2026-07-04): `py_compile` 5 Dateien + `npm run build` clean. Runtime-E2E: Frage im Chat muss Quellen aus **mehreren Projekten** desselben Users liefern können; `get_effective_settings(None)` liefert Default-Strategie.
3. C: Member sieht nur zugängliche Projekte in der Suche (`accessible_document_ids`).

---

## ADR-Index

| ID | Titel | Status |
|---|---|---|
| ADR-001 | Rollen- & Berechtigungsmodell fuer Quellen (Tier-basiert) | ACCEPTED |
| ADR-002 | UI-Library: shadcn/ui auf Base UI | ACCEPTED |
| ADR-003 | MCP-Server fuer agentic RAG (Service-User-ID + dualer Transport) | ACCEPTED |
| ADR-004 | Chat-Architektur — projekt-gebundener MVP, globales Admin-Embedding (Stufenmodell) | ACCEPTED |
