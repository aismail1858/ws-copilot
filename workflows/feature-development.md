# Workflow: Feature-Development

## Zweck
Schneller Workflow für ein einzelnes Feature innerhalb eines bestehenden Epics. Springt direkt in Phase 04 (Implementation).

## Eingaben
- User Story mit Akzeptanzkriterien
- Bestehende Architektur
- Feature-Beschreibung

## Übersicht

```
User Story
  │
  ▼
┌─────────────────┐
│ 04: Implementation│ ← Developer, Reviewer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 05: Testing     │ ← Tester, Developer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 06: Review      │ ← Reviewer, Architect
└────────┬────────┘
         │
         ▼
    Integration
```

## Detaillierte Schritte

### Vorbereitung (15 Minuten)
1. [ ] User Story laden und verstehen
2. [ ] Akzeptanzkriterien prüfen
3. [ ] Betroffene Dateien identifizieren
4. [ ] Skill des Developers laden
5. [ ] Worktree erstellen: `git worktree add ../worktree-[TASK-ID] -b feature/[TASK-ID]`

### Phase 04: Implementation (variabel)

1. [ ] Minimalen Code schreiben
2. [ ] Funktionen <50 Zeilen
3. [ ] Dateien <500 Zeilen
4. [ ] Sinnvolle Namen
5. [ ] Nach jedem Schritt: `git commit`
6. [ ] Unit Tests schreiben
7. [ ] Refactoring
8. [ ] `git push`

### Phase 05: Testing (1-2 Stunden)

1. [ ] Unit Tests ausführen
2. [ ] Integration Tests (falls relevant)
3. [ ] Edge Cases testen
4. [ ] Test-Report

### Phase 06: Review (30-60 Minuten)

1. [ ] Code Review (Reviewer)
2. [ ] Architektur-Check (Architect)
3. [ ] Action Items beheben
4. [ ] Final Commit

### Integration (15 Minuten)

1. [ ] Feature-Branch in develop mergen
2. [ ] Merge-Konflikte lösen
3. [ ] CI muss grün sein
4. [ ] Worktree entfernen
5. [ ] Task auf DONE setzen

## Git-Workflow
```bash
# Feature erstellen
git checkout develop
git pull
git checkout -b feature/TASK-XXX

# Commits
git commit -m "feat(scope): Beschreibung"

# Push
git push origin feature/TASK-XXX

# PR erstellen (über GitHub/GitLab)

# Nach Review: Merge
git checkout develop
git merge feature/TASK-XXX
git push

# Worktree entfernen
git worktree remove ../worktree-TASK-XXX
```

## Abbruchkriterien
- Tests fehlgeschlagen → HALT, Bug beheben
- Code-Review negativ → HALT, Änderungen
- Architektur-Verstoß → HALT, Architect-Review

## Geschätzte Dauer
- **Kleines Feature:** 2-4 Stunden
- **Mittleres Feature:** 1-2 Tage
- **Komplexes Feature:** 3-5 Tage
