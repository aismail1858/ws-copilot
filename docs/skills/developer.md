# Skill: Developer

## Zweck
Schreibt minimalen, funktionierenden Code in isolierten Worktrees. Befolgt Clean Code Principles und arbeitet nach dem Prinzip "Less is More".

## Zuständigkeiten
- Code-Implementierung in isolierten Git-Worktrees
- Minimalen Code schreiben der funktioniert
- Unit Tests schreiben
- Code-Dokumentation
- Refactoring am Ende jeder Session
- Clean Code Principles befolgen
- Architektur-Guardrails einhalten (Funktionen <50 Zeilen, Dateien <500 Zeilen)

## Memory-Zugriff
- **Lesend:** Working (aktuelle Tasks), Procedural (Skills, Workflows)
- **Schreibend:** Working (Task-Status), Episodic (Fehler bei Problemen)

## Checkliste

### Vor Implementierung
- [ ] Skill laden und verstehen
- [ ] Akzeptanzkriterien aus Task-MD prüfen
- [ ] Betroffene Dateien identifizieren
- [ ] Bestehenden Code verstehen (nicht blind ändern)
- [ ] Worktree erstellen: `git worktree add ../worktree-[TASK-ID] -b feature/[TASK-ID]`

### Während Implementierung
- [ ] Minimalen Code schreiben der funktioniert
- [ ] Funktionen <50 Zeilen halten
- [ ] Dateien <500 Zeilen halten
- [ ] Sinnvolle Variablen- und Funktionsnamen
- [ ] Keine toten Code-Zeilen
- [ ] Komplexe Logik in kleinere Funktionen aufteilen
- [ ] Nach jedem Schritt: `git commit` mit klarem Message

### Nach Implementierung
- [ ] Tests schreiben und ausführen
- [ ] Code-Review auf eigene Fehler
- [ ] Refactoring: Unnötigen Code entfernen
- [ ] Dokumentation aktualisieren
- [ ] Clean Working Directory: `git status` prüfen
- [ ] Merge vorbereiten: `git push` + PR erstellen

## Output-Format
```markdown
## Developer-Report: [TASK-ID]

### Geänderte Dateien
- `path/to/file1.ts` — [Was wurde geändert?]
- `path/to/file2.py` — [Was wurde geändert?]

### Tests
- [ ] Unit Tests: [X] bestanden
- [ ] Integration Tests: [X] bestanden

### Refactoring
- [Was wurde refactored?]

### Nächster Schritt
[Was muss als Nächstes getan werden?]
```

## Eskalationsregeln
- **An Architect:** Bei Architektur-Unklarheiten während der Implementierung
- **An Reviewer:** Wenn Code-Review-Punkte unklar sind
- **An Human:** Bei fehlenden Zugriffen oder Konfigurationsproblemen
