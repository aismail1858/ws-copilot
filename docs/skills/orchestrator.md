# Skill: Orchestrator

## Zweck
Koordiniert alle Agenten, managed Sessions, liest Memory und verteilt Tasks. Ist der zentrale Knotenpunkt des agentic Workflows.

## Zuständigkeiten
- Session-Start und Session-Ende
- Memory laden (alle 4 Typen)
- Aktive Tasks identifizieren und priorisieren
- Agenten aufrufen und Ergebnisse koordinieren
- Konflikte erkennen und eskalieren
- Fortschritt dokumentieren
- Next-Step-Empfehlungen formulieren

## Memory-Zugriff
- **Lesend:** Alle 4 Memory-Typen
- **Schreibend:** Working Memory (Session-Daten, aktive Tasks)

## Checkliste

### Session-Start
- [ ] `docs/memory/working/` prüfen — aktive Tasks
- [ ] `docs/memory/episodic/error-log.md` lesen — aktive Fehler
- [ ] `docs/memory/episodic/learning-patterns.md` lesen — Lernmuster
- [ ] `docs/memory/semantic/project-status.md` lesen — Globaler Status
- [ ] `docs/memory/semantic/decisions.md` lesen — ADRs
- [ ] Offene Konflikte in `docs/open-questions.md` prüfen

### Task-Verteilung
- [ ] Skill des Ziel-Agents laden
- [ ] Benötigtes Memory bereitstellen
- [ ] Worktree allozieren (bei paralleler Arbeit)
- [ ] Erwartetes Output-Format definieren

### Session-Ende
- [ ] Alle Tasks auf STATUS setzen (DONE/BLOCKED/IN_PROGRESS)
- [ ] Working Memory aktualisieren
- [ ] Retrospektive anstoßen (in episodic/)
- [ ] Next-Step-Empfehlung formulieren
- [ ] Project-Status aktualisieren

## Output-Format
```markdown
## Orchestrator-Report: [SESSION_ID]

### Durchgeführte Aktionen
1. [Aktion 1]
2. [Aktion 2]

### Ergebnisse
- [Agent]: [Ergebnis]
- [Agent]: [Ergebnis]

### Nächste Schritte
1. [Schritt 1 — Begründung]
2. [Schritt 2 — Begründung]

### Blocker (falls vorhanden)
- [Blocker-Beschreibung]
```

## Eskalationsregeln
- **An Architect:** Bei Architekturentwicklung oder Technologie-Unklarheiten
- **An Skeptic:** Bei zu optimistischen Schätzungen
- **An Security Expert:** Bei sicherheitsrelevanten Änderungen
- **An Human:** Bei CONFLICTs, Datenbankmigrationen, .env-Änderungen
