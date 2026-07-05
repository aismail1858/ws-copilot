---
task_id: TASK-2026-07-04-rbac-quellen
title: Rollen- & Berechtigungsmodell fuer Quellen (Tier-basiert)
status: IN_PROGRESS
priority: HIGH
owner: Architect/Developer (Agent)
created_at: 2026-07-04
updated_at: 2026-07-04
phase: Backend + Frontend (Fullstack-Slice)
kb_references: [KB-001]
adr_references: [ADR-001]
---

# Ziel
Tier-basiertes Berechtigungsmodell (admin/team_lead/member) fuer Quellen umsetzen:
Admins erstellen globale Quellen, Team Leads verwalten Quellen+Mitglieder ihres
Teams, Mitglieder konsumieren nur zugewiesene Quellen. Zugriff zentral ueber
`accessible_document_ids(user_id)`.

# Scope
- In Scope:
  - DB-Migration: roles, teams, team_members, source_members, project_documents-Spalten, RPC
  - Backend: Tier-Auth, Zugriffsmenge in Routes + RAG-Retrieval, Teams/Members/Visibility-Routes
  - Frontend: TierGuard, SourcesPage fuer alle Rollen (zugriffsbasiert), TeamsPage, AuthContext tier
  - Fullstack-Slice: Mitglied sieht/befragt nur zugewiesene Quellen; Admin published global
- Out of Scope:
  - Rollen-Titel Self-Service-UI (nur Seed + set-role Endpunkt)
  - Materialisierte Cache fuer `accessible_document_ids` (Scale)
  - Erweiterte Audit-Logs (nur `added_by`/`granted_by`)

# Aufgaben
- [x] Checkpoint-Review (KB/ADR/Risks/Error-Log) dokumentiert
- [x] Konzept + ADR-001 (ACCEPTED) + Entscheidungen OQ-RB-001..004
- [ ] DB-Migration `20260704000001_rbac_quellen.sql` schreiben (Apply = Human-Approval!)
- [ ] Backend: jwtAuth tier + access service
- [ ] Backend: rbacRoutes (teams, members, visibility, accessible sources, roles)
- [ ] Backend: projectFilesRoutes/projectRoutes/agents/retrieval an Zugriffsmenge anpassen
- [ ] Backend: authRoutes tier + server.py Router
- [ ] Frontend: AuthContext tier + App TierGuard + TeamsPage + SourcesPage Zugriff
- [ ] Verify: Frontend build; Backend Start-Check; Human-Approval-Gate dokumentieren
- [ ] Summary + Task schliessen

# Akzeptanzkriterien
1. Member sieht nur Quellen aus `accessible_document_ids` (global/team/members/eigene); fremde Quellen → 404.
2. Admin kann Quelle auf `visibility=global` setzen → alle sehen sie.
3. Team Lead kann Team+Mitglieder anlegen und Quelle `team`/`members` zuweisen.
4. RAG-Retrieval befragt nur `accessible_document_ids(user)` (auch team/global).
5. Frontend: SourcesPage fuer alle Rollen; admin/team_lead sehen Upload + Visibility-Setzung.
6. Frontend `npm run build` ohne Fehler.

# Abhaengigkeiten
- Supabase lokal verfuegbar + Migration angewendet (Human-Approval noetig!)
- Bestehende Auth (JWT) aus `services/jwtAuth.py`

# Risiken
- R-RB-001 Breaking Change an user_id-Filter → Mitigation: zentrale RPC + Tests
- R-RB-002 Bypass bei vergessener RPC-Nutzung → Mitigation: Helper, alle Routes pruefen
- R-RB-003 Backfill user→member → Mitigation: Dev-DB zuerst, Stichproben

# Betroffene Dateien
- backend/supabase/migrations/20260704000001_rbac_quellen.sql (neu)
- backend/src/services/jwtAuth.py (GEAENDERT), backend/src/services/access.py (neu)
- backend/src/routes/rbacRoutes.py (neu), authRoutes.py (GEAENDERT)
- backend/src/routes/projectFilesRoutes.py (GEAENDERT), projectRoutes.py (GEAENDERT)
- backend/src/agents/*/agent.py (GEAENDERT), backend/src/rag/retrieval/* (GEAENDERT)
- backend/src/server.py (GEAENDERT)
- frontend/src/context/AuthContext.tsx (GEAENDERT), frontend/src/App.tsx (GEAENDERT)
- frontend/src/pages/TeamsPage.tsx (neu), SourcesPage.tsx (GEAENDERT)

# Bekannte Fehler aus error-log.md fuer diesen Task
- LM-001 / ERR-001: Backend-Identitaet via openapi-title verifizieren; uvicorn `--reload` mit `--reload-exclude logs`.

# Implementierungsnotizen
- Start: 2026-07-04 — Konzept + ADR stehen; Umsetzung beginnt mit Migration (nur Datei).
- Zwischenstand: Migration + Code werden geschrieben; Apply der Migration wartet auf Human-Approval.
- Blocker: Schema-Migration darf erst nach Freigabe angewendet werden (AGENTS.md 3.1).

# DoD-Checkliste
- [ ] Akzeptanzkriterien erfuellt
- [ ] Tests/Checks ausgefuehrt oder dokumentiert
- [ ] Dokumentation aktualisiert
- [ ] KB-Eintrag erstellt/aktualisiert
- [ ] Summary in `docs/implementation-summaries.md` vorhanden
- [ ] `docs/project-status.md` aktualisiert
- [ ] testbarer Fullstack-Slice umgesetzt oder als Blocker + Folge-Task dokumentiert
- [ ] Naechste empfohlene Schritte mit Begruendung dokumentiert

# Abschluss-Summary
- Ergebnis: CODE-COMPLETE — blockiert durch ausstehende Schema-Migration (Human-Approval).
- Was wurde geaendert: Migration (nur Datei), Backend-Tier-Auth + Zugriffsmenge in Routes/Retrieval, neue `/api/rbac/*`-Routes, Frontend TierGuard + SourcesPage (alle Rollen) + TeamsPage; Doku (Konzept/ADR/Diagramm/Entscheidungen/Risiken). Siehe `docs/implementation-summaries.md`.
- Offene Restpunkte: Migration anwenden (Human-Approval); E2E-Validierung danach.
- Empfohlene naechste Schritte (mit Begruendung):
  1. Migration `20260704000001_rbac_quellen.sql` freigeben+anwenden — ohne DB-Schema schlagen alle neuen Zugriffe fehl.
  2. E2E: Admin->global, Team-Lead->Team-Quelle, Mitglied sieht nur Zugewiesenes — prueft die zentrale Zugriffsregel (ADR-001).
  3. Negativ-Test: fremde Quelle fuer Mitglied liefert 404 — sichert gegen Bypass (R-RB-002).
