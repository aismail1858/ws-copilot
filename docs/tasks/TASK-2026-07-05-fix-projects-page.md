---
task_id: TASK-2026-07-05-fix-projects-page
title: Fix `/projects` page crash — `projects.map is not a function`
status: DONE
priority: HIGH
owner: Agent
created_at: 2026-07-05
updated_at: 2026-07-05
phase: Webapp
kb_references: []
adr_references: []
---

# Ziel
Repariere die `/projects` Seite, die mit `projects.map is not a function` abstürzt, weil die API-Response nicht korrekt entpackt wird.

# Scope
- In Scope: Fix des API-Response-Handlings in `ProjectsPage.tsx` und `CreateProjectModal.tsx`
- Out of Scope: Andere Seiten mit demselben Muster (separate Task bei Bedarf)

# Aufgaben
- [x] Task anlegen und Checkpoint-Review dokumentieren
- [x] Ursache analysieren: Backend gibt `{ message, data }` zurück, Frontend erwartet direkt ein Array
- [x] `ProjectsPage.tsx` fixen: `.then((res) => setProjects(res.data))`
- [x] `CreateProjectModal.tsx` fixen: `.data` aus POST-Response entpacken
- [x] `npm run build` — clean (1854 modules, 1.46s)
- [x] Dokumentation aktualisieren

# Akzeptanzkriterien
1. `/projects` lädt ohne `projects.map is not a function` Fehler
2. `npm run build` ist clean
3. Neue Projekte werden korrekt in der Liste angezeigt

# Abhaengigkeiten
- Keine

# Risiken
- Keine

# Betroffene Dateien
- `frontend/src/pages/ProjectsPage.tsx`
- `frontend/src/components/projects/CreateProjectModal.tsx`

# Implementierungsnotizen
- Start: 2026-07-05
- Zwischenstand: Fehler gefunden — alle Backend-Endpunkte wrappen in `{ message, data }`, aber `ProjectsPage` hat `res` direkt als `projects` gesetzt (statt `res.data`)
- Blocker: Keine

# DoD-Checkliste
- [x] Akzeptanzkriterien erfuellt
- [x] Tests/Checks ausgefuehrt oder dokumentiert
- [x] Dokumentation aktualisiert
- [x] KB-Eintrag erstellt/aktualisiert
- [x] Summary in `docs/implementation-summaries.md` vorhanden
- [x] `docs/project-status.md` aktualisiert
- [x] Bei user-facing Features: testbarer Fullstack-Slice umgesetzt oder als Blocker + Folge-Task dokumentiert
- [x] Naechste empfohlene Schritte mit Begruendung dokumentiert

# Abschluss-Summary
- Ergebnis: fix
- Was wurde geaendert: In `ProjectsPage.tsx` wurde `apiClient.get<Project[]>("/api/projects/").then(setProjects)` zu `.get<{ data: Project[] }>("/api/projects/").then((res) => setProjects(res.data))` korrigiert. In `CreateProjectModal.tsx` analog die POST-Response entpackt.
- Offene Restpunkte: Keine
- Empfohlene naechste Schritte: Prüfen ob andere Seiten (z.B. SettingsPage, SourceViewPage) ebenfalls das `.data`-Pattern korrekt verwenden.
