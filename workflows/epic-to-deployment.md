# Workflow: Epic-to-Deployment

## Zweck
Vollständiger Workflow von der ersten Idee bis zum produktiven Deployment. Durchläuft alle 7 Phasen.

## Eingaben
- User-Idee / Feature-Wunsch / Anforderung

## Übersicht

```
User-Idee
  │
  ▼
┌─────────────────┐
│ 01: Discovery   │ ← PO, Skeptic, Architect, Orchestrator
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 02: Design      │ ← PO, Architect, AI Expert, Security
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 03: Architecture│ ← Architect, DevOps, Security, Skeptic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 04: Implementation│ ← Developer, Reviewer, Tester
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 05: Testing     │ ← Tester, Developer, Security
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 06: Review      │ ← Reviewer, Security, Architect, Skeptic
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 07: Deployment  │ ← DevOps, Developer, Security, Orchestrator
└────────┬────────┘
         │
         ▼
    Retrospektive
```

## Detaillierte Schritte

### Phase 01: Discovery (1-3 Tage)
**Verantwortlich:** Orchestrator + PO

1. [ ] User-Idee erfassen
2. [ ] Discovery-Report erstellen
3. [ ] Erste User Stories schreiben
4. [ ] Machbarkeits-Check (Skeptic)
5. [ ] Erste ADRs (Architect)
6. [ ] Offene Fragen dokumentieren
7. [ ] **Gate:** Discovery genehmigt? → Ja: Phase 02 / Nein: Klärung

### Phase 02: Design (2-5 Tage)
**Verantwortlich:** PO + Architect

1. [ ] User Journeys erstellen
2. [ ] UI/UX-Design (falls relevant)
3. [ ] Datenmodell definieren
4. [ ] API-Design definieren
5. [ ] Sicherheitsdesign (Security Expert)
6. [ ] Design-Review (Skeptic)
7. [ ] **Gate:** Design genehmigt? → Ja: Phase 03 / Nein: Überarbeitung

### Phase 03: Architecture (2-4 Tage)
**Verantwortlich:** Architect + DevOps

1. [ ] Tech-Stack finalisieren
2. [ ] Komponenten-Design
3. [ ] Infrastruktur-Design
4. [ ] Skalierbarkeits-Design
5. [ ] ADRs finalisieren
6. [ ] Architecture-Review (Skeptic)
7. [ ] **Gate:** Architektur genehmigt? → Ja: Phase 04 / Nein: Überarbeitung

### Phase 04: Implementation (variabel)
**Verantwortlich:** Developer + Reviewer

1. [ ] Tasks erstellen
2. [ ] Worktrees allozieren
3. [ ] Code schreiben (minimal, funktional)
4. [ ] Unit Tests schreiben
5. [ ] Refactoring
6. [ ] Commits mit Conventional Commits
7. [ ] Feature in develop mergen
8. [ ] **Gate:** Code funktioniert? → Ja: Phase 05 / Nein: Bug-Fix

### Phase 05: Testing (1-3 Tage)
**Verantwortlich:** Tester + Developer

1. [ ] Test-Plan erstellen
2. [ ] Unit Tests ausführen
3. [ ] Integration Tests schreiben und ausführen
4. [ ] E2E Tests (falls relevant)
5. [ ] Sicherheitstests
6. [ ] Test-Report erstellen
7. [ ] **Gate:** Alle Tests bestanden? → Ja: Phase 06 / Nein: Bug-Fix

### Phase 06: Review (1-2 Tage)
**Verantwortlich:** Reviewer + Security + Architect

1. [ ] Code Review durchführen
2. [ ] Sicherheits-Review
3. [ ] Architektur-Review
4. [ ] Performance-Review
5. [ ] Review-Report erstellen
6. [ ] Action Items beheben
7. [ ] **Gate:** Review bestanden? → Ja: Phase 07 / Nein: Überarbeitung

### Phase 07: Deployment (0.5-1 Tag)
**Verantwortlich:** DevOps + Developer

1. [ ] CI-Pipeline muss grün sein
2. [ ] Database-Migrationen
3. [ ] Deployment durchführen
4. [ ] Smoke Tests
5. [ ] Monitoring aktivieren
6. [ ] Deployment-Report erstellen
7. [ ] **Gate:** Deployment erfolgreich? → Ja: Retrospektive / Nein: Rollback

### Retrospektive (0.5 Tag)
**Verantwortlich:** Orchestrator + alle

1. [ ] Retrospektive durchführen
2. [ ] Lernmuster in episodic/ übernehmen
3. [ ] Knowledge Base aktualisieren
4. [ ] Nächste Schritte definieren

## Abbruchkriterien (während des Workflows)
- **Jede Phase:** Bei CONFLICT → HALT, Human-Klärung
- **Phase 04:** Bei Architektur-Verstoß → HALT, Architect-Review
- **Phase 05:** Bei kritischen Bugs → HALT, Developer-Fix
- **Phase 06:** Bei Sicherheitslücken → HALT, sofortiger Fix
- **Phase 07:** Bei Deployment-Fehler → HALT, Rollback

## Parallele Arbeit
Bei komplexen Epics können Tasks parallel in separaten Worktrees bearbeitet werden:
- Jeder Task bekommt eigenen Worktree
- Orchestrator koordiniert Abhängigkeiten
- Merge-Reihenfolge wird geplant

## Geschätzte Gesamtdauer
- **Kleines Feature:** 5-10 Tage
- **Mittleres Feature:** 2-4 Wochen
- **Großes Epic:** 1-3 Monate
