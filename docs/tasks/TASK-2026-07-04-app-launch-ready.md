---
task_id: TASK-2026-07-04-app-launch-ready
title: "App launch-ready machen: Env, Ingestion-Gate, Dead Code"
status: DONE
priority: HIGH
owner: Agent
created_at: 2026-07-04
updated_at: 2026-07-04
phase: infra + webapp
kb_references: [KB-001, KB-003]
adr_references: [ADR-001, ADR-004]
---

# Ziel
Die Webapp launch-ready machen: Requesty-Konfiguration in `.env` korrigieren,
Ingestion-Seite für Admin + Team-Lead öffnen, Dead Code entfernen.

# Scope
- In Scope:
  - `.env` bereinigen: Gemini-Modelle durch Requesty-Modelle ersetzen
  - Ingestion-Page: TierGuard von `admin` auf `team_lead` (admin+team_lead dürfen uploaden)
  - Dead Code `frontend/src/api/ingestion.ts` löschen (Phantom-Endpunkt `/api/v1/ingestion/upload`)
  - `.env.sample` Duplikat entfernen
  - Build-Verify (frontend + backend)
- Out of Scope:
  - Runtime-E2E (braucht Requesty-Key + Redis + S3 + Migrationen)

# Aufgaben
- [x] Checkpoint-Review (KB/Status/Risiken/Error-Log)
- [x] `.env`: `google/gemma-4-31b-it` → `gpt-4o` / `gpt-4o-mini` / `text-embedding-3-large`
- [x] `App.tsx`: TierGuard `minTier="admin"` → `"team_lead"` für `/ingestion`
- [x] `frontend/src/api/ingestion.ts` löschen (Dead Code)
- [x] `.env.sample`: duplicate `JWT_SECRET` entfernen
- [x] Verify: `npm run build` + Python `py_compile` beider Komponenten
- [x] Doku aktualisieren (KB, Project-Status, Summary)
- [x] Fehler-Retrospektive

# Akzeptanzkriterien
1. `backend/.env` enthält keine Google/Gemini-Referenzen mehr
2. `REQUESTY_CHAT_MODEL` / `REQUESTY_MINI_MODEL` / `REQUESTY_EMBEDDINGS_MODEL` / `REQUESTY_EMBEDDINGS_LLM_MODEL` auf OpenAI-kompatible Modelle gesetzt
3. Ingestion-Seite unter `/ingestion` für admin + team_lead erreichbar (nicht nur admin)
4. `frontend/src/api/ingestion.ts` existiert nicht mehr
5. `npm run build` + Python `py_compile` laufen sauber

# Abhaengigkeiten
- Requesty-API-Key muss vom User nachgetragen werden (`REQUESTY_API_KEY` in `.env`)
- RBAC-Migration `20260704000001_rbac_quellen.sql` muss auf Supabase angewendet werden
- Redis muss laufen (für Ingestion-Celery)

# Risiken
- Ohne `REQUESTY_API_KEY` laufen Chat-LLM und Embeddings nicht → Runtime-Fehler beim Chat/Ingestion
- Ohne Migration schlagen `/auth/me` und alle tier-basierten Guards fehl (roles-Tabelle fehlt)

# Betroffene Dateien
- `backend/.env`
- `backend/.env.sample`
- `frontend/src/App.tsx`
- `frontend/src/api/ingestion.ts` (gelöscht)

# DoD-Checkliste
- [x] Akzeptanzkriterien erfuellt
- [x] Tests/Checks ausgefuehrt (`npm run build`, `py_compile`)
- [x] Dokumentation aktualisiert
- [x] KB-Eintrag aktualisiert
- [x] Summary in `docs/implementation-summaries.md` vorhanden
- [x] `docs/project-status.md` aktualisiert
- [x] Fehler-Retrospektive in `docs/error-log.md`

# Abschluss-Summary
- Ergebnis: App ist code-seitig launch-ready. Frontend Build + Backend Kompilierung sauber.
- Was wurde geaendert:
  1. `.env`: Gemini-Modelle entfernt, Requesty-Modelle auf gpt-4o/gpt-4o-mini/text-embedding-3-large gesetzt
  2. `App.tsx`: Ingestion jetzt für admin + team_lead (minTier="team_lead")
  3. `api/ingestion.ts`: gelöscht (Phantom-Endpunkt `/api/v1/ingestion/upload`)
  4. `.env.sample`: duplicate JWT_SECRET entfernt
- Offene Restpunkte:
  1. User muss `REQUESTY_API_KEY` im `.env` eintragen
  2. Supabase-Migrationen anwenden (RBAC + app_models)
  3. Redis starten für Ingestion-Celery
  4. S3-Verbindung testen
- Empfohlene naechste Schritte:
  1. `REQUESTY_API_KEY` eintragen (wichtigster Einzelfaktor — ohne läuft weder Chat noch Ingestion)
  2. Migration `20260704000001_rbac_quellen.sql` in Supabase SQL-Editor ausführen
  3. `docker run -d -p 6379:6379 redis:7-alpine` für Celery
