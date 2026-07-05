# Fehler-Log

> Zentrales Gedächtnis fuer Fehler und Lernmuster.
> Zweck: systematisches Lernen — jeder dokumentierte Fehler verhindert denselben Fehler in zukuenftigen Sessions und Tasks.
> Dies ist **keine** Schuldzuweisung, sondern ein Gedaechnis.

**Pflicht:**
- Agent liest dieses Dokument bei jedem Session-Start.
- Agent schreibt nach jeder Task mindestens einen Eintrag (Fehler oder Retrospektive).
- Beim Aufloesen eines Fehlers wird die Loesung ebenfalls hier dokumentiert (Lerneffekt).

---

## 1. Fehler-Eintrags-Schema

Jeder Fehler folgt diesem Schema:

```markdown
## [ERR-XXX] <Kurztitel>

- **Datum:** YYYY-MM-DD
- **Task-Referenz:** TASK-YYYY-MM-DD-<slug>
- **Komponente:** backend | webapp | extension | infra | docs
- **Schwere:** CRITICAL | HIGH | MEDIUM | LOW
- **Status:** OPEN | RESOLVED | WONT-FIX
- **Tags:** #env-config #schema-migration ...

### Symptom
Was war das beobachtbare Fehlverhalten? (Fehlermeldung, falsches Ergebnis, Timeout, ...)

### Ursache
Was war die eigentliche Ursache? (erst nach Analyse ausfuellen)

### Kontext
Welche Bedingungen haben den Fehler beguenstigt? (z.B. fehlende .env, Race Condition, Annahme war falsch)

### Loesung / Workaround
Was hat das Problem behoben? Falls ungeloest: was wurde versucht?

### Lernmuster
> Kompakte Regel fuer zukuenftige Sessions — max. 2 Saetze.
> Beispiel: "Vor pgvector-Migrationen immer Supabase-Verbindung verifizieren. `.env`-Vollstaendigkeit ist Vorbedingung."

### Praeventivmassnahme
Welche Guardrail, Check oder Doku-Ergaenzung verhindert diesen Fehler kuenftig?
```

---

## 2. Fehler-Kategorien (Tags)

| Tag | Bedeutung |
|---|---|
| `#env-config` | Fehler durch fehlende oder falsche Umgebungsvariablen |
| `#schema-migration` | Fehler bei Datenbankschema-Aenderungen |
| `#dependency` | Fehler durch Abhaengigkeits-Konflikte (npm, pip, docker) |
| `#assumption-wrong` | Fehler weil eine Annahme nicht der Realitaet entsprach |
| `#missing-doc` | Fehler weil Dokumentation fehlte oder veraltet war |
| `#test-gap` | Fehler der durch einen fehlenden Test haette verhindert werden koennen |
| `#context-overflow` | Fehler durch verlorenen oder falschen Kontext im Agent |
| `#race-condition` | Timing-/Reihenfolge-Problem in async Flows |
| `#size-violation` | Code-Qualitaetsfehler durch ueberschrittene Groessengrenzen |

---

## 3. Fehler-Einträge

<!-- Neue Eintraege hier einfuegen, neueste oben. Format: [ERR-XXX] -->

## [ERR-002] Frontend-Build bricht: SidebarLayout/SidebarNavigation (pre-existing, Next.js->Vite-Migration)

- **Datum:** 2026-07-04
- **Task-Referenz:** TASK-2026-07-04-admin-settings-models (gefunden) / TASK-2026-07-04-shadcn-base-ui (geloest)
- **Komponente:** webapp
- **Schwere:** HIGH
- **Status:** RESOLVED
- **Tags:** #dependency #test-gap #assumption-wrong

### Symptom
`cd webapp/frontend && npm run build` (`tsc --noEmit && vite build`) schlaegt mit 2 Fehlern fehl:
- `src/components/layout/SidebarLayout.tsx(25,27)`: Type 'AuthUser | null' is not assignable to type 'User | null' (Property 'display_name' missing).
- `src/components/layout/SidebarNavigation.tsx(8,9)`: Cannot find namespace 'JSX'.

### Ursache
Beide Dateien sind ungetrackte WIP-Dateien der laufenden Next.js->Vite-Migration bzw. rbac-Task.
`SidebarLayout` nutzt noch den alten `User`-Typ (mit `display_name`), waehrend AuthContext auf
`AuthUser` (mit `tier`, `displayName`) umgestellt wurde. `SidebarNavigation` verwendet `JSX.Element`
ohne React-19-kompatiblen Import (TS braucht `React.JSX`).

### Kontext
Repo ist eine grosse in-flight Migration (Next.js App-Router geloescht, Vite neu). Build war bereits
vor dieser Task kaputt; `vite build` kann nicht als E2E-Gate genutzt werden, bis ERR-002 behoben ist.

### Loesung / Workaround
**RESOLVED (2026-07-04):** Nach `shadcn init` (Dependency-Neuinstallation via npm) laeuft
`npm run build` (`tsc --noEmit && vite build`) komplett sauber (1759 Module, 807ms) — beide Fehler
sind verschwunden. Vermutliche Ursache der Beseitigung: die npm-Dependency-Neuinstallation hat
transitive Types (`@types/*`, React 19-Typauflösung) neu ausgerichtet, sodass der `JSX`-Namespace
und der `AuthUser`/`User`-Typ-Konflikt wieder aufloesten. Kein gezielter Code-Fix noetig gewesen.

### Lernmuster
> Vor Frontend-Arbeit `npm run build` laufen lassen und pre-existing Fehler als Referenz
> festhalten, damit neue Tasks nicht fuer fremde Build-Brueche verantwortlich gemacht werden.

### Praeventivmassnahme
- Verify-Ergebnis je Task dokumentieren (welche Fehler neu vs. pre-existing).
- ERR-002 als Blocker verfolgen bis die Migration/rbac-Task die Typen konsolidiert hat.

---

## [ERR-001] Registrierung schlägt fehl - Port 8000 durch fremde App blockiert + uvicorn --reload Endlosschleife

- **Datum:** 2026-07-03
- **Task-Referenz:** (keine Task-MD; Runtime-Hotfix auf User-Meldung "ich kann mich nicht registrieren")
- **Komponente:** infra | backend
- **Schwere:** HIGH
- **Status:** RESOLVED
- **Tags:** #env-config #assumption-wrong

### Symptom
Registrierung im Frontend schlägt fehl. `POST /api/auth/register` liefert 404; Frontend zeigt "Registration failed".

### Ursache
Port 8000 war durch eine andere App belegt ("Congstar RAG API" statt "Schummulus API"). Der Vite-Proxy (`frontend/vite.config.ts`) leitet `/api` -> `localhost:8000` weiter und traf auf die falsche App, die `/api/auth/*` nicht kennt. Zusaetzlich lief Schummulus-Backend mit `uvicorn src.server:app --reload`, dessen Watcher das vom App-Logger geschriebene `backend/logs/application.log` beobachtet -> permanenter Reload-Loop ("N change detected"), wodurch der Server nie stabil antwortete und zwei konkurrierende uvicorn-Instanzen entstanden.

### Kontext
Lokale Dev-Setup (kein Docker aktiv). Frontend (5173) + Backend (8000) manuell gestartet. Mehrere Projekte auf demselben Rechner nutzen Port 8000. Keine Health-Assertion, welche App tatsaechlich auf 8000 antwortet.

### Loesung / Workaround
1. Verifiziert via `/openapi.json`, welche App auf 8000 antwortet (info.title). Hier: zuerst "Congstar RAG API", nach Wechsel "Schummulus API".
2. Schummulus-Backend laeuft jetzt korrekt auf 8000; `POST /api/auth/register` (direkt und via Vite-Proxy) -> HTTP 200, User wird in Supabase `users`-Tabelle angelegt.
3. Reload-Loop-Fix: uvicorn mit `--reload-exclude logs` starten: `uvicorn src.server:app --reload --reload-exclude logs --port 8000`. Parent-Prozess in User-Terminal muss per Ctrl+C gestoppt werden (--reload respawnt gekillte Worker).

### Lernmuster
> Vor "Login/Registrierung kaputt" immer pruefen, WAS auf dem Backend-Port antwortet (`/openapi.json` -> info.title). Und: `uvicorn --reload` darf nicht auf Verzeichnisse zeigen, in die die App selbst loggt (`logs/`) -> IMMER `--reload-exclude logs`.

### Praeventivmassnahme
- Dev-Start-Anleitung (README/Makefile) um `--reload-exclude logs` ergaenzen oder Logger so konfigurieren, dass er nicht ins Watch-Verzeichnis schreibt.
- Optional: Health-Assertion im Frontend-Startup, die `/openapi.json`-Title gegen Erwartung prueft, um falsches Backend frueh zu erkennen.

---

## 4. Retrospektiven (Pflicht nach jeder Task)

Nach **jeder** abgeschlossenen Task — auch fehlerfreien — wird hier ein Eintrag angelegt.

> **Rollen:** Dieses Schema ist die verbindliche Minimal-Form (Pflicht-Eintrag). Die ausfuehrliche Standalone-Vorlage mit Metriken/Empfehlungen liegt in `docs/templates/RETRO-TEMPLATE.md` — optional, fuer tiefere Retrospektiven.

### Retrospektiven-Schema

```markdown
## [RETRO-XXX] Retrospektive: TASK-YYYY-MM-DD-<slug>

- **Datum:** YYYY-MM-DD
- **Fehleranzahl in dieser Task:** N

### Aufgetretene Fehler
- [ERR-XXX] <Kurztitel> (falls vorhanden, Verweis auf Eintrag)
- Keine (falls keine Fehler aufgetreten)

### Was lief gut?
(1-3 Punkte — dokumentiert auch positive Patterns)

### Was wuerde man anders machen?
(1-3 Punkte — auch bei fehlerfreien Tasks reflektieren)

### Abgeleitete Regel fuer zukuenftige Tasks
(Wird in Section 5 "Aktive Lernmuster" uebernommen, falls generisch genug)
```

### Erfasste Retrospektiven

## [RETRO-013] Retrospektive: Chat an echten RAG angebunden (Meilenstein 2)

- **Datum:** 2026-07-05
- **Fehleranzahl in dieser Task:** 0

### Aufgetretene Fehler
- Keine. `tsc --noEmit` nach dem Hook-Rewrite sofort clean (EXIT=0).

### Was lief gut?
- **Referenz vor Implementierung gelesen:** Statt das chatId↔Thread-Binding selbst zu designen,
  wurde `six-figure-rag-web`/`six-figure-rag-api` studiert → das dortige Pattern (Chat existiert vor
  Stream, SSE `event:`/`data:`, `done.aiMessage.citations`) gespiegelt. WS-Copilots `streamChat.ts`
  war bereits die exakte Entsprechung — es fehlte nur die Verdrahtung in `useChat`.
- **User-Korrektur ernst genommen:** „Ingestion gibt es" führte zur Korrektur, dass `/ingestion`
  längst über das echte Backend läuft (`/api/projects/{pid}/files/*`) — keine Neuentwicklung nötig.
- `noUnusedLocals:false` als Sicherheitsnetz: Full-File-Rewrite des Hooks ohne Risiko durch
  ungenutzte Alt-Referenzen.

### Was würde man anders machen?
- Die anfängliche Diagnose („Ingestion → 404 / zwei unüberwindbare Auth-Systeme") war zu pessimistisch
  und teils falsch — Ursache: Doku (KB-011/012) statt Live-Code vertraut. Live-Importkette und
  Backend-`_decode_token` ZUERST lesen, dann urteilen.

### Abgeleitete Regel für zukünftige Tasks
- Siehe LM-014 (neu): Bei „Endpoint existiert nicht"-Aussagen aus Doku: per `grep` über den Live-Code
  verifizieren, bevor als Blocker deklariert. Bei Auth: `_decode_token`/Cookie-vor-Bearer lesen, bevor
  „zwei Systeme" als hartes Hindernis behauptet wird.

---

## [RETRO-012] Retrospektive: TASK-2026-07-05-app-usable (Anwendung nutzbar machen)

- **Datum:** 2026-07-05
- **Fehleranzahl in dieser Task:** 0 (Code); 1 Verify-Einschränkung (Umgebungs-Artefakt, kein Code-Fehler)

### Aufgetretene Fehler
- Keine eigenen Code-Fehler. Verify-Einschränkung: `npm run build` (vite) schlägt in **WSL/Linux**
  fehl, weil `node_modules` Windows-installiert ist und das native `rolldown-binding.linux-x64-gnu.node`
  fehlt. Kein Code-Fehler — `npx tsc --noEmit` (rein-JS) läuft sauber (EXIT=0). Build-Verify muss auf
  Windows (User-Maschine) stattfinden.

### Was lief gut?
- **Code vor Doku:** Statt der Doku ("zwei Auth-Systeme = hard blocker") zu vertrauen, wurde der
  **Live-Pfad** (`App.tsx` → `ChatPage` → `useChat` → `queryRAGStream` → `fetchWithAuth`) und das
  Backend-`_decode_token` (Cookie-vor-Bearer) tatsächlich gelesen → erkannt, dass die Auth-Lücke ein
  **einziges Frontend-Gate** war, nicht zwei unüberwindbare Systeme (KB-013).
- Ehrliche Abgrenzung: Meilenstein 1 (Login+Chat+Settings) geliefert; Meilenstein 2 (Ingestion/RAG)
  als OQ-ARCH-007 sauber getrennt, statt halbfertig zu versprechen.

### Was würde man anders machen?
- KB-012 "12.10" behauptete `/api/v1/rag/query` existiere nicht. Stimmt nicht (ragRoutes.py:90) — nur
  der RAG-**Inhalt** fehlt. Doku-Staleness bei "existiert nicht"-Aussagen durch echtes `grep` ersetzen.

### Abgeleitete Regel für zukünftige Tasks
- Siehe LM-013 (Cookie-vor-Bearer verifizieren, statt "zwei Auth-Systeme" zu glauben; WSL-Build via
  `tsc --noEmit` prüfen, wenn Native-Bindings fehlen).

---

## [RETRO-007] Retrospektive: TASK-2026-07-04-a0-chat-rag-test (A0 Chat-Anbindung)

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 1 (selbst gelöst) + 1 aufgedeckter Docs-Konflikt

### Aufgetretene Fehler
- **Eigen (sofort gelöst):** Nach `useChat`-Rewrite referenzierte `ChatPage` noch `isLoading` im
  `useCallback`-Dependency-Array (`[input, isLoading, chat]`). `tsc --noEmit` fing es beim 1. Build
  (`TS2304: Cannot find name 'isLoading'`). Fix: Dep-Array auf `[input, chat]`. Kein ERR-Eintrag (<1 Retry).
- **Docs-Konflikt aufgedeckt:** `project-status.md` war stale (ADR-001 als nicht-ACCEPTED, OQ-RB als offen),
  tatsächlich aber ACCEPTED & umgesetzt → CONFLICT-002 dokumentiert + Status korrigiert.

### Was lief gut?
- Klärungsrunde (Architektur, Chat-Modell, Embedding) **vor** Code — keine Rekursionen während Implementierung.
- Backend blieb unangetastet (A0 = Frontend-only); Vertrags-Lese (event-Set, Citation-Shape, MessageCreate)
  vor dem Client-Schreiben hat die SSE-Diskrepanz **vor** dem Schreiben aufgeklärt (siehe LM-009).
- `npm run build` als sofortiger Verify fing den `isLoading`-Ref beim ersten Lauf.

### Was wuerde man anders machen?
- Beim Rewrite eines Hooks **alle** Referenzen (inkl. `useCallback`/`useMemo`-Deps) auf alte destrukturierte
  Namen pruefen — nicht nur die Call-Site. Hätte den `isLoading`-Fix vor dem ersten Build eingespart.
- `project-status.md` synchron zu `decisions.md`/`open-questions.md` halten; die Staleness hätte zu
  Fehlannahmen ("RBAC noch konzept-phase") fuehren koennen.

### Abgeleitete Regel fuer zukuenftige Tasks
- Siehe LM-009 (SSE-Dispatch-Vertrag vor Client-Schreiben verifizieren); LM-008 (build nach Edit-Gruppe).

---

## [RETRO-002] Retrospektive: TASK-2026-07-04-rbac-quellen (RBAC Quellen)

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 0 (Laufzeit); 2 vorbestehende TS-Fehler in ungenutzten Duplikatdateien behoben.

### Aufgetretene Fehler
- Keine eigenen Fehler. Beim Verify (`npm run build`) traten 3 **vorbestehende** TS-Fehler auf
  (ungenuetzte Duplikate unter `frontend/src/components/layout/*` plus `IngestionPage`-useRef).
  Behoben: `JSX.Element`->`ReactElement`, `User`/`AuthUser`-Konsistenz, `useRef`-Initialwert.

### Was lief gut?
- Konzept + ADR + Entscheidungen *vor* Code geklaert — keine Rekursionen waehrend der Implementierung.
- Zentrale Zugriffsfunktion (`accessible_document_ids`) als einzelner Anker erspart Streu-Filter.
- `py_compile` + `tsc --noEmit` als schnelle Verify-Schritte griffen sofort.

### Was wuerde man anders machen?
- Vorab pruefen, ob Dateien ueberhaupt importiert sind (die `components/layout/*`-Duplikate sind ungenutzt — solcher Dead Code verstopft den Build).
- Den RAG-Pfad (`create_rag_tool`->`retrieve_context`) mit `user_id` weiterreichen war beruehrt viele Stellen; ein gemeinsames Session-Kontext-Objekt waere robuster.

### Abgeleitete Regel fuer zukuenftige Tasks
- Siehe LM-002: Vor Build-Verify pruefen, ob die fehlerhaften Dateien ueberhaupt im Live-Import-Graph liegen (Dead-Duplikate erkennen).

## [RETRO-001] Retrospektive: Hotfix Registrierung (ERR-001)

- **Datum:** 2026-07-03
- **Fehleranzahl in dieser Task:** 1

### Aufgetretene Fehler
- [ERR-001] Port 8000 durch fremde App blockiert + uvicorn --reload Loop

### Was lief gut?
- Schnelle Eingrenzung durch `/openapi.json`-Title-Check (falsche App erkannt).
- Register-Code (Backend + Frontend) war fehlerfrei; kein Code-Change noetig, nur Runtime/Infra.

### Was wuerde man anders machen?
- Frueher pruefen, WELCHE App auf dem Port antwortet, statt zuerst Code zu lesen.
- Dev-Start-Kommando mit `--reload-exclude logs` dokumentieren, damit der Reload-Loop gar nicht erst entsteht.

### Abgeleitete Regel fuer zukuenftige Tasks
- Siehe LM-001: Backend-Identitaet via openapi-title verifizieren; `--reload` nicht auf Log-Verzeichnis zeigen lassen.

---

## [RETRO-002] Retrospektive: TASK-2026-07-04-admin-settings-models

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 1 (eigener Code-Fix) + 1 fremder Blocker (ERR-002)

### Aufgetretene Fehler
- Eigen: `RoleGuard` in App.tsx verwendet, aber App.tsx nutzt mittlerweile `TierGuard` (rbac-Task).
  → sofort korrigiert auf `<TierGuard minTier="admin">`. (kein ERR-Eintrag, <2 Retries, geloest)
- Fremd: [ERR-002] pre-existing Frontend-Build-Fehler (nicht durch diese Task).

### Was lief gut?
- Konsequente Nutzung der bestehenden Patterns (`require_tier`, `supabase`-Client, `ci-*` Klassen,
  `apiClient`, `react-hot-toast`, lucide-react) — wenig Ueberraschungen.
- Size-Guardrails eingehalten: SettingsPage in kleine Funktionen/Sub-Komponenten zerlegt (<500 Zeilen).
- Verify granular dokumentiert: Backend-Import + isolierter Typecheck der eigenen Dateien.

### Was wuerde man anders machen?
- Vor dem ersten Code-Schreiben App.tsx Guards pruefen (Tier vs Role) — haette den RoleGuard-Fix
  gespart (LM-003).
- Bei Tasks in einem Repo mit in-flight Migration zuerst `npm run build` als Baseline laufen lassen.

### Abgeleitete Regel fuer zukuenftige Tasks
- Siehe LM-002 (Guard-Typ pruefen), LM-003 (pre-existing Build-Fehler als Baseline festhalten).

---

## [RETRO-003] Retrospektive: TASK-2026-07-04-shadcn-base-ui

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 1 (selbst geloest)

### Aufgetretene Fehler
- `shadcn init -y` war dennoch interaktiv (Preset-Prompt). Loesung: `-p nova` explizit angeben.
  (kein ERR-Eintrag, <1 Retry, sofort geloest — siehe LM-004)

### Was lief gut?
- Backup von globals.css vor init → `ci-*`/Brand gezielt erhalten, nur Geist→Manrope Rueckstellung noetig.
- Verify war eindeutig: button.tsx importiert `@base-ui/react` (Base UI bestätigt) + `npm run build` clean.
- Saubere Doku: ADR-002 fuer die Architektur-Entscheidung, KB-005 mit Setup-Fallen fuer Folge-Sessions.

### Was wuerde man anders machen?
- Vor CLI-Aufruf die `-y`-Semantik pruefen (skippt nur Bestaetigung, nicht alle Prompts).
- Side-Effect nicht uebersehen: Dependency-Neuinstallation kann pre-existing Typfehler loesen (ERR-002)
  — das ist ein Gluecksfall, kein verdientes "Build repariert".

### Abgeleitete Regel fuer zukuenftige Tasks
- Siehe LM-004 (shadcn non-interactive Run braucht `-p`).

---

## [RETRO-006] Retrospektive: TASK-2026-07-04-shadcn-page-migration (Wave 2 — Restmigration aller verbleibenden Dateien)

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 1 (Build-Fehler in TokenUsagePage, selbst behoben)

### Aufgetretene Fehler
- **TokenUsagePage.tsx:** `</div>` statt `</Card>` in ModelBreakdown (Zeile 345) nach Wave-1-Card-Refactoring.
  Ursache: Wave 1 hatte `<Card>` gesetzt, aber `</div>` nicht zu `</Card>` geändert. Build brach mit
  `TS17002: Expected corresponding JSX closing tag for 'Card'`.
  Lösung: Präzises edit mit exaktem Whitespace-Matching. Build jetzt sauber (613ms, 1854 modules).
- **Nebeneffekt:** Der erste Edit-Fix traf versehentlich `DistributionBar` (falsche `/* ------ */`-Sektion), nicht `ModelBreakdown`. → zweiter Fix nötig.

### Was lief gut?
- Parallel-Edit von 14 Dateien in einem Durchgang → sehr effizient.
- `npm run build` als sofortiger Verify-Check fing den Card/div-Mismatch sofort.
- Abschluss-Check via `Select-String` über alle Source-Dateien bestätigte: **keine ci-* Klassen mehr**.

### Was würde man anders machen?
- Nach jeder globalen Ersetzung (`</div>` → `</Card>`) den Build-zwischenschritt machen, statt alle 14 Dateien auf einmal. Dann wäre der DistributionBar-Nebeneffekt sofort aufgefallen.
- Build-Muster in AGENTS.md notieren: `npm run build` nutzen statt `tsc --noEmit` allein (Vite build schlägt nicht bei TS-Fehlern fehl, aber `tsc --noEmit` schon).

### Abgeleitete Regel für zukünftige Tasks
- Bei Edit-Wellen in mehreren Dateien: **nach jeder Dateiengruppe build-verify** (oder zumindest nach jeder strukturellen Änderung). Vermeidet kaskadierende Fixes.

---

## [RETRO-005] Retrospektive: TASK-2026-07-04-shadcn-page-migration (shadcn Page Migration Wave 1)

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 0

### Aufgetretene Fehler
- Keine. Build sauber beim ersten Durchlauf.

### Was lief gut?
- Mapping der ci-* Klassen via Task-Agent vorab → klare Planung ohne Rekursion.
- Parallel-Edit von 5 Seiten + CSS in einem Durchgang → zeitsparend.
- `npm run build` sofort sauber (1854 modules, 774ms) — kein Debug-Zyklus nötig.
- Brand-Farbumstellung auf einen Schlag konsistent (--primary, --accent, --ring, --chart-1, --sidebar-primary).

### Was würde man anders machen?
- Card `size="sm"` in LoginPage/RegisterPage führt zu kompakterem Padding als `ci-panel` — könnte visuell anders sein. Optional `size="default"` testen.
- ci-button-blue existiert nirgends im Code → hätte als Aufräum-Kandidat gleich mit entfernt werden können.

### Abgeleitete Regel für zukünftige Tasks
- Bei CSS-Variablen-Änderungen IMMER `npm run build` als Baseline vor und nach der Änderung.

---

## [RETRO-004] Retrospektive: TASK-2026-07-04-mcp-server (MCP-Server fuer agentic RAG)

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 0 (Laufzeit); 1 erkannte Falle prophylaktisch vermieden.

### Aufgetretene Fehler
- Keine eigenen Fehler. Prophylaktisch erkannt: stdio-MCP verbietet jede Ausgabe auf stdout
  (JSON-RPC-Exklusivitaet) → Logging konsequent auf stderr + Datei gelenkt (kein ERR, da vor
  dem ersten Lauf behoben — siehe LM-005).

### Was lief gut?
- Vorab-Klärung der sicherheitsrelevanten Designentscheidungen (Identität/Transport/Tool-Umfang)
  per Frage → keine Rekursionen; ADR-003 + OQ-MCP-001/002 zeitgleich festgehalten.
- Wiederverwendung des RAG-Cores per Direkt-Import statt HTTP-Umweg → wenig neue Fehlerflaeche.
- Verify gestaffelt: `py_compile` (alle Dateien) + `docker compose config` → beide green.

### Was wuerde man anders machen?
- Die `mcp`-SDK-Transport-API (`streamable-http` vs `sse`, Host/Port-Konstruktor-Args) haette per
  Release-Notes der **installierten** Version gespieht werden muessen — jetzt an `>=1.2.0` gepinnt;
  Runtime-E2E steht noch aus.
- Global-Quellen (`project_id IS NULL`) sind durch projektbezogene Tools nur indirekt erreichbar —
  das haette als explizites Tool (`search_global`) gleich mitkommen koennen (OQ-MCP-001).

### Abgeleitete Regel fuer zukuenftige Tasks
- Siehe LM-005: stdio-Server duerfen NIE nach stdout loggen/printen.
- Siehe LM-006 (neu): bei externen SDKs (hier `mcp`) vor Usage die exakte Transport-API der
  installierten Version pruefen, nicht nur die Doku-D defaults.

---

## [RETRO-009] Retrospektive: TASK-2026-07-04-app-launch-ready

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 0

### Aufgetretene Fehler
- Keine. Build (`py_compile` + `npm run build`) beim ersten Durchlauf sauber.

### Was lief gut?
- Task-Konzentration auf 4 kleine Änderungen (env, App.tsx-TierGuard, Dead-Code-Löschung, env.sample-Fix) — kein Scope Creep.
- Build-Check direkt nach allen Änderungen — sofortige Rückmeldung.

### Was würde man anders machen?
- `.env`-Datei vor dem Edit nochmal vollständig lesen (es war bereits teilweise aktualisiert) — hätte den ersten Edit-Versuch gespart.

### Abgeleitete Regel für zukünftige Tasks
- Vor Edit von `.env` immer den kompletten aktuellen Inhalt lesen und prüfen, ob schon Vorarbeiten (menschliche Edits, andere Tasks) existieren.

---

## [RETRO-008] Retrospektive: TASK-2026-07-04-a1-cross-project-chat

- **Datum:** 2026-07-04
- **Fehleranzahl in dieser Task:** 0

### Aufgetretene Fehler
- Keine. Build (`py_compile` 5 Dateien) + Frontend (`npm run build`) beim ersten Durchlauf sauber.

### Was lief gut?
- **Schlüsselerkenntnis vor Implementierung:** `retrieve_context` war bereits user-scoped
  (`get_accessible_document_ids`) → A1 war im Kern nur Frontend-Refaktoring + Projekt-Settings-Default,
  kein neuer Retrieval-Code. Das sparte viel Backend-Arbeit.
- SSE-Vertrag (LM-009) aus A0 bekannt und bewusst identisch gehalten → kein Frontend-Parser-Bruch.
- `get_effective_settings(None)` als elegante Lösung für Settings-Fallback ohne Projektanker.

### Was würde man anders machen?
- Alte projectRoutes-Stream-Route mit dem neuen `chat_streaming.py`-Helper konsolidieren hätte
 早点 passieren können — ist jetzt bewusst aufgeschoben (A0 unangetastet lassen), aber Technical Debt.

### Abgeleitete Regel für zukünftige Tasks
- **LM-010 (neu):** Vor einem Feature-Implement: prüfen ob `retrieve_context` / das betroffene
  Backend-Modell bereits die gesuchte User-Scope-Logik enthält (hier: `user_id` →
  `get_accessible_document_ids`). Oft ist das Feature-Kernstück schon da; die Arbeit
  konzentriert sich dann auf Frontend-Anbindung + Settings-Defaults.

---

## [RETRO-011] Retrospektive: TASK-2026-07-05-feature-interaction-map

- **Datum:** 2026-07-05
- **Fehleranzahl in dieser Task:** 0

### Aufgetretene Fehler
- Keine. Reine Forschungs-/Doku-Task. Ein Explore-Agent (Chat-RAG-Retrieval) wurde vom System abgebrochen, aber Abdeckung war durch die 3 anderen Agenten gegeben.

### Was lief gut?
- **Parallelisierung:** 4 Explore-Agenten gleichzeitig gestartet → schnelle, umfassende Abdeckung von Frontend-Struktur, Backend-Datenmodell, Ingestion/Sources/Teams-Flow.
- **Kritischer Fund:** Die zwei parallelen Auth-Systeme (KB-011) wurden identifiziert — das erklärt die Console-Fehler des Users direkt.
- Befunde sofort als strukturierte KB-Einträge + OQ dokumentiert, nicht nur als flüchtigen Chat-Output.

### Was würde man anders machen?
- Bei 4 parallelen Agenten einen Resilience-Plan haben für Abbrüche (hier: glücklicherweise redundante Abdeckung).
- Die Interaktions-Karte (KB-012) ist sehr lang — später ggf. in eigenständige Architektur-Doku auslagern statt nur KB.

### Abgeleitete Regel für zukünftige Tasks
- Siehe LM-012 (neu): Bei Erkundung mehrerer Subsysteme parallel Explore-Agenten starten; Auth/API-Diskrepanzen als Erstes prüfen, denn sie sind häufig die Wurzel von Runtime-Fehlern.

---

## [RETRO-010] Retrospektive: TASK-2026-07-05-fix-projects-page

- **Datum:** 2026-07-05
- **Fehleranzahl in dieser Task:** 0 (build sofort sauber nach Fix)

### Aufgetretene Fehler
- Keine — Fix wurde direkt beim ersten Durchlauf implementiert und Build war clean.

### Was lief gut?
- Schnelle Analyse der Runtime-Fehler `projects.map is not a function` führte direkt zur Ursache.
- Pattern aus anderen Dateien (`IngestionPage.tsx`, `SourceViewPage.tsx`) bestätigte die `res.data`-Konvention.
- Beide betroffenen Dateien (`ProjectsPage.tsx`, `CreateProjectModal.tsx`) in einem Durchgang gefixt.

### Was würde man anders machen?
- Beim ersten Erstellen einer Seite mit `apiClient.get` direkt das `res.data`-Muster aus bestehenden Seiten übernehmen.
- Einen Lint-Regel oder Type-Helper für Response-Typen in `api/index.ts` ergänzen, damit der Wrapper nicht vergessen wird.

### Abgeleitete Regel für zukünftige Tasks
- Siehe LM-011: `apiClient.get` Response IMMER mit `.data` entpacken.

---

## 5. Aktive Lernmuster

> Lebende Liste — destillierte Regeln aus allen Fehlern.
> Bei jedem Session-Start lesen. Bei jeder Task pruefen und ggf. ergaenzen.

| ID | Regel | Quelle |
|---|---|---|
| LM-001 | Vor "Auth kaputt"-Diagnose pruefen, WELCHE App auf dem Backend-Port antwortet (`/openapi.json` -> info.title). `uvicorn --reload` nie ohne `--reload-exclude logs` starten, wenn die App ins Watch-Verzeichnis loggt. | ERR-001 |
| LM-002 | In `App.tsx` sind Routen-Guards tier-basiert (`TierGuard minTier="..."`), nicht rollen-basiert. Vor dem Absichern einer Route immer TierGuard verwenden und `useAuth().user.tier` nutzen. | RETRO-002 |
| LM-003 | Bei Frontend-Tasks in einem Repo mit aktiver Migration zuerst `npm run build` als Baseline laufen lassen und pre-existing Fehler festhalten — sonst werden neue Tasks zu Unrecht fuer Build-Brueche verantwortlich gemacht. | ERR-002 |
| LM-004 | `shadcn init -y` ist NICHT voll non-interactive (Preset-Prompt bleibt). Fuer nicht-interaktiven Run zusaetzlich `-p <name>` (z. B. `nova`) angeben; `-b base` waehlt Base UI vs Radix. | RETRO-003 |
| LM-005 | Ein **stdio**-MCP-Server darf NIEMALS nach stdout loggen/printen — stdout ist exklusiv fuer das JSON-RPC-Protokoll. Logging IMMER auf stderr (+ Datei). | RETRO-004 |
| LM-006 | Bei externen SDKs (z. B. `mcp`) vor Usage die Transport-API der **installierten** Version pruefen (z. B. `streamable-http` vs `sse`, Konstruktor-Args); Version pinnen. | RETRO-004 |
| LM-007 | Vor Build-Fix: pruefen, ob die fehlerhafte Datei ueberhaupt live importiert wird (Dead-Duplikate erkennen) — verhindert Reparatur von ungenutztem Code und bloesst echte Fehler auf. | RETRO-002 |
| LM-008 | Nach Edit-Wellen in mehreren Dateien: build-verify nach jeder Dateiengruppe, nicht erst am Ende. Verhindert kaskadierende Fixes. | RETRO-006 |
| LM-009 | SSE-Client/Server muessen auf denselben Dispatch-Mechanismus geeinigt sein: Backend nutzt `event:`-Feld + JSON **ohne** `type`; ein Frontend-Parser, der nur `data:` liest und auf `data.type` dispatcht, ignoriert JEDES Backend-Event. Vor Schreiben eines SSE-Clients den genauen Event-Vertrag (Felder + Citation-Ablageort, z.B. `done.aiMessage.citations`) aus dem Backend-Code lesen, nicht raten. | RETRO-007, RETRO-008 |
| LM-010 | Vor einem Feature-Implement: prüfen ob `retrieve_context` / das betroffene Backend-Modell bereits die gesuchte User-Scope-Logik enthält (hier: `user_id` → `get_accessible_document_ids`). Oft ist das Feature-Kernstück schon da; die Arbeit konzentriert sich dann auf Frontend-Anbindung + Settings-Defaults. | RETRO-008 |
| LM-011 | Bei `apiClient.get<T>()` IMMER den Response-Wrapper `{ message, data }` des Backends beachten: `.then((res) => setData(res.data))`, nicht `.then(setData)`. Fehlt das `.data`, bekommt die Komponente ein Objekt statt eines Arrays → `.map is not a function`. | RETRO-010 |
| LM-012 | Bei Erkundung mehrerer Subsysteme parallel Explore-Agenten starten (Frontend, Backend, Datenmodell). Auth/API-Diskrepanzen als Erstes prüfen — sie sind häufig die Wurzel von Runtime-Fehlern (z.B. zwei parallele Auth-Systeme, KB-011). | RETRO-011 |
| LM-013 | "Zwei Auth-Systeme" nicht als harten Blocker glauben, bevor das Backend-`_decode_token` gelesen wurde — Cookie-vor-Bearer bedeutet: ein Login-Cookie authentifiziert oft **alle** Routen. Der echte Break ist meist ein Frontend-Gate (hartes Werfen bei fehlendem Token). Plus: In WSL gegen Windows-`node_modules` ist `vite build` (Native-Bindings) nicht lauffähig → mit `tsc --noEmit` type-checken, Build auf der Ziel-Plattform (Windows) ausführen. | RETRO-012 |
| LM-014 | „Endpoint X existiert nicht / Feature Y kaputt" aus der Doku NIE als Blocker übernehmen, bevor `grep` über den **Live-Code** + die Live-Importkette das bestätigen (KB-Doku war hier 2× stale: `/api/v1/rag/query` existierte doch; Ingestion lief längst echt). Ebenso: Backend-`_decode_token` lesen, bevor „zwei Auth-Systeme = hartes Hindernis" behauptet wird. | RETRO-013 |
