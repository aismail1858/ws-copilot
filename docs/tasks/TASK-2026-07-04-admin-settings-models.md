---
task_id: TASK-2026-07-04-admin-settings-models
title: Admin-Einstellungsseite - Requesty-Modelle verwalten
status: DONE
priority: HIGH
owner: Developer (Agent)
created_at: 2026-07-04
updated_at: 2026-07-04
phase: Backend + Frontend (Fullstack-Slice)
kb_references: []
adr_references: []
---

# Ziel
Admin-Einstellungsseite (`/settings`), ueber die ein Admin die verfuegbaren
**Requesty-Modelle** pflegt: hinzufuegen, entfernen, aktivieren/deaktivieren.
Persistenz im Backend (Supabase). Es gibt ausschliesslich Requesty als
LLM-/Embedding-Gateway (kein Multi-Provider-Setup).

# Scope
- In Scope:
  - DB-Migration: `app_models`-Tabelle (id, label, model_id, purpose, enabled, sort_order)
  - Backend: CRUD-Routen `/api/admin/models` (Admin-Tier) + Lese-Endpunkt `/api/models` (auth)
  - Backend: Router in `server.py` registrieren
  - Frontend: `SettingsPage.tsx` als Admin-UI (Liste + Toggle + Loeschen + Hinzufuegen)
  - Frontend: `/settings`-Route auf Admin beschraenken (RoleGuard)
  - Fullstack-Slice: Admin kann Modell anlegen/aktivieren -> Liste aktualisiert sich
- Out of Scope:
  - Anbindung des Modellkatalogs an die Chat-Modellauswahl (useChatModels liest heute localStorage) -> Folge-Task
  - Umstellung von env-basierten Requesty-Modellen auf DB-Katalog in `services/llm.py` -> Folge-Task
  - Verbrauchs-/Kosten-Statistiken je Modell
  - Reihenfolge-Drag&Drop (nur `sort_order`-Spalte als Grundlage)

# Parallelisierung (AGENTS.md 5.3)
- Task TASK-2026-07-04-rbac-quellen bleibt `IN_PROGRESS`. Diese Task ist ein
  unabhaengiges, explizit angefordertes Feature ohne Abhaengigkeit zu RBAC.
  Beide Tasks beruehren `App.tsx` (hier: RoleGuard an `/settings`) - kein Konflikt,
  da unterschiedliche Routen.

# Aufgaben
- [x] Checkpoint-Review (KB/ADR/Risks/Error-Log) dokumentiert
- [x] DB-Migration `20260704120001_app_models.sql` schreiben (Apply = Human-Approval!)
- [x] Backend: `modelRoutes.py` (GET/POST/PATCH/DELETE) + Pydantic-Modelle
- [x] Backend: Router in `server.py` registrieren (`/api/admin/models`, `/api/models`)
- [x] Frontend: API-Helper + `SettingsPage.tsx` (Admin-UI Modellverwaltung)
- [x] Frontend: `/settings` Route mit TierGuard admin absichern
- [x] Verify: Backend-Import ok (route_count=6, 46 Routen); Frontend-Typecheck meiner Dateien sauber; Human-Approval-Gate Migration dokumentiert
- [x] Summary + Task schliessen

# Akzeptanzkriterien
1. `GET /api/admin/models` liefert alle Modelle (auch deaktivierte); nur Admin (sonst 403).
2. `GET /api/models` liefert nur aktivierte Modelle; fuer authentifizierte Nutzer.
3. Admin kann Modell anlegen (POST), aktivieren/deaktivieren + Label editieren (PATCH), loeschen (DELETE).
4. Nicht-Admin erhält auf Admin-Endpunkte 403; `model_id` ist eindeutig (409 bei Duplikat).
5. Frontend `/settings` nur fuer `role=admin` (sonst Redirect `/unauthorized`).
6. UI: Liste mit Status-Badge + Toggle + Loeschen; Hinzufuegen-Formular; Toast-Feedback.
7. Frontend `npm run build` ohne Fehler; Backend importiert sauber (uvicorn-Start).

# Abhaengigkeiten
- Supabase lokal verfuegbar + Migration angewendet (Human-Approval noetig! AGENTS.md 3.1)
- Bestehende Auth (JWT/Cookie) aus `services/jwtAuth.py`

# Risiken
- R-AM-001 Schema-Migration ohne Freigabe angewendet -> Mitigation: nur Datei erstellen, Apply wartet auf Human-Approval
- R-AM-002 `services/llm.py` liest weiter env-Modelle (lru_cache) -> kein BC, DB-Katalog ist zusaetzlich; Folge-Task fuer Anbindung
- R-AM-003 Duplikat-Check race -> Mitigation: unique constraint auf model_id + 409 im Code

# Betroffene Dateien
- backend/supabase/migrations/20260704120001_app_models.sql (neu)
- backend/src/routes/modelRoutes.py (neu)
- backend/src/server.py (GEAENDERT - Router-Registrierung)
- frontend/src/lib/api/models.ts (neu)
- frontend/src/pages/SettingsPage.tsx (GEAENDERT - Platzhalter -> Admin-UI)
- frontend/src/App.tsx (GEAENDERT - RoleGuard an `/settings`)

# Bekannte Fehler aus error-log.md fuer diesen Task
- LM-001 / ERR-001: Backend-Identitaet via openapi-title verifizieren; uvicorn `--reload` immer mit `--reload-exclude logs`.

# Implementierungsnotizen
- Start: 2026-07-04
- Zweck `purpose` kategorisiert Modelle (chat/mini/embeddings/embeddings_llm) passend zur
  bestehenden 4-Rollen-Struktur in `services/llm.py`. Optional, aber nuetzlich fuer spaetere Anbindung.
- WICHTIG - app.tsx nutzt `TierGuard` (nicht `RoleGuard`): die laufende rbac-Task hat App.tsx
  auf tier-basierte Guards umgestellt. Settings-Route deshalb mit `<TierGuard minTier="admin">`.
- Verify-Ergebnisse:
  - Backend: `from src.server import app` ok, route_count=6, 46 Routen, Server startet.
  - Frontend: `tsc --noEmit` meldet KEINE Fehler in meinen Dateien. Build bricht an 2
    PRE-EXISTING Fehlern in ungetrackten WIP-Dateien ab (SidebarLayout.tsx, SidebarNavigation.tsx)
    - gehoeren zur Next.js->Vite-Migration / rbac-Task, NICHT zu dieser Task.
- Blocker:
  1. Schema-Migration darf erst nach Freigabe angewendet werden (AGENTS.md 3.1) - HUMAN-APPROVAL noetig.
  2. `npm run build` scheitert an pre-existing WIP-Fehlern (siehe error-log ERR-002) - blockiert
     Vite-Build, aber nicht diese Task.

# DoD-Checkliste
- [x] Akzeptanzkriterien erfuellt (Code-Ebene; E2E erst nach Migration+Build-Fix)
- [x] Tests/Checks ausgefuehrt oder dokumentiert (Backend-Import ok; Frontend-Typecheck meiner Dateien clean)
- [x] Dokumentation aktualisiert
- [x] KB-Eintrag erstellt/aktualisiert (KB-001)
- [x] Summary in `docs/implementation-summaries.md` vorhanden
- [x] `docs/project-status.md` aktualisiert
- [x] testbarer Fullstack-Slice umgesetzt (Code); E2E-Blocker dokumentiert (Migration-Approval + ERR-002)
- [x] Naechste empfohlene Schritte mit Begruendung dokumentiert

# Abschluss-Summary
- Ergebnis: Code-complete Fullstack-Slice. Backend CRUD + Frontend Admin-UI stehen und sind
  verifiziert (Import/Typecheck). E2E wartet auf (a) Migration-Freigabe, (b) Behebung der
  pre-existing Build-Fehler aus der Migration/rbac-Task.
- Was wurde geaendert:
  - backend/supabase/migrations/20260704120001_app_models.sql (Tabelle + Seed + Trigger)
  - backend/src/routes/modelRoutes.py (GET/POST/PATCH/DELETE, Admin-Tier via require_tier)
  - backend/src/server.py (modelRoutes registriert, route_count 5->6)
  - frontend/src/lib/api/models.ts (modelsApi) + index.ts (patch-Methode) + types (LlmPurpose)
  - frontend/src/pages/SettingsPage.tsx (Platzhalter -> Admin-UI)
  - frontend/src/App.tsx (`/settings` mit TierGuard admin)
- Offene Restpunkte:
  - Migration anwenden (Human-Approval)
  - pre-existing Build-Fehler ERR-002 loesen (fremde Task)
  - Folge-Task: DB-Katalog an Chat-Auswahl (useChatModels) + services/llm.py anbinden
- Empfohlene naechste Schritte (mit Begruendung):
  1. Migration `20260704120001_app_models.sql` freigeben + anwenden - sonst laufen die Endpunkte auf
     fehlende Tabelle. (AGENTS.md 3.1)
  2. ERR-002 beheben (SidebarLayout/SidebarNavigation) - danach laeuft `npm run build` sauber und
     E2E dieser Task ist testbar.
  3. Folge-Task Anbindung DB-Katalog -> Chat & llm.py, damit Admin-Aenderungen effektiv werden.
