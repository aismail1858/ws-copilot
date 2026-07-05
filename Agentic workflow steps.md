# Agentic Workflow Steps

Übersicht der verbindlichen Arbeitsschritte für Codex in diesem Repository.

---

## Phase 1: Session-Start (Pflicht)

1. `docs/project-status.md` lesen
2. `docs/error-log.md` lesen — aktive Fehler und Lernmuster prüfen
3. Aktive Tasks in `docs/tasks/` identifizieren
4. Falls keine aktive Task existiert: neue Task-MD erstellen

---

## Phase 2: Quellen-Review vor Implementierung (Pflicht)

Reihenfolge der Quellenprüfung:

1. `docs/knowledge-base.md`
2. `docs/decisions.md`
3. `docs/project-status.md`
4. `docs/open-questions.md`
5. `docs/risks.md`
6. `docs/error-log.md` ← **Pflicht: bekannte Fehler prüfen**
7. Relevante Fachdokumente (user-stories, prd, project_structure, AGENTS.md)

**Bei Widersprüchen:** In `docs/open-questions.md` als `CONFLICT-XXX` eintragen, dann implementieren.

---

## Phase 3: Task-MD erstellen (Pflicht vor jeder Änderung)

1. Task-Vorlage aus `docs/tasks/TASK-TEMPLATE.md` kopieren
2. Benennung: `TASK-YYYY-MM-DD-<slug>.md`
3. Mindestinhalt ausfüllen:
   - Task-ID, Titel, Status, Owner, Datum
   - Ziel und Scope
   - Konkrete Aufgaben als Checkboxen
   - Akzeptanzkriterien
   - Betroffene Dateien
   - KB-/ADR-Referenzen
   - Risiken, Abhängigkeiten, offene Fragen
   - DoD-Checkliste
   - Bekannte Fehler aus `error-log.md`

4. Task auf `IN_PROGRESS` setzen

---

## Phase 4: Implementierung

1. In kleinen, nachvollziehbaren Schritten arbeiten
2. Nach jedem relevanten Schritt:
   - Task-Status aktualisieren
   - Notwendige Doku aktualisieren
3. Bei Architekturentscheidung: `docs/decisions.md` (ADR) aktualisieren
4. Bei Risikoänderung: `docs/risks.md` aktualisieren

### Fehlerbehandlung (verbindlich)

```
1. Fehler sofort in Task-MD dokumentieren
2. Maximal 2 Retry-Versuche mit anderem Ansatz
3. Falls nach 2 Retries ungelöst:
   → Task auf BLOCKED setzen
   → Fehler in docs/error-log.md eintragen
   → Blocker in docs/open-questions.md eintragen
   → Keine weiteren Implementierungsschritte
4. Falls gelöst:
   → Lösung in docs/error-log.md dokumentieren
```

### Human-Approval Pflicht (Agent pausiert)

- Datenbankmigrationen (pgvector, Schema-Rollout)
- Änderungen an `.env`-Dateien
- Änderungen an CI/CD-Konfigurationen
- Löschen von Dateien oder Verzeichnissen
- Deployment-Aktionen in produktionsnahe Umgebungen

---

## Phase 5: Qualitätssicherung

### Komponentenprüfungen (je Task mindestens 1x)

- `cd backend && pytest`
- `cd webapp && npm run build`
- `cd extension && npm run build`
- `docker compose ps` / relevante Service-Logs

### Architektur-Guardrails

- Funktionen > 50 Zeilen: harter Verstoß
- Funktionen 20-50 Zeilen: Warnbereich
- Dateien > 500 Zeilen: harter Verstoß
- Dateien 300-500 Zeilen: Warnbereich

Ausnahmen müssen in Task-MD begründet werden:
`[SIZE-EXCEPTION: <Begründung>]`

---

## Phase 6: Abschluss nach Implementierung (Pflicht)

1. Task-MD auf `DONE` setzen
2. DoD-Checkliste abhaken
3. Implementierungs-Summary in `docs/implementation-summaries.md` anlegen
4. `docs/project-status.md` aktualisieren
5. KB-Eintrag in `docs/knowledge-base.md` ergänzen (`[KB-XXX]`)
6. Fehler-Retrospektive in `docs/error-log.md` (auch bei kehlerfreien Tasks)

**Ohne diese 6 Punkte gilt die Implementierung als nicht abgeschlossen.**

---

## Phase 7: Next-Step-Empfehlung (Pflicht)

Nach jeder abgeschlossenen Session:

1. Nächste Schritte mit Begründung formulieren
2. Fullstack-Slice sicherstellen (Backend + Frontend/Extension)
3. Ohne Next-Step-Empfehlung gilt Abschlussbericht als unvollständig

---

## Session-Unterbrechung

Bei Unterbrechung mitten in Implementierung:

1. Aktuelle Task-MD sofort aktualisieren:
   - Aktueller Stand
   - Nächster konkreter Schritt
   - Blocker
   - Aufgetretene Fehler
2. `docs/project-status.md` auf neuesten Stand bringen

---

## Fehler-Log System

Jeder Fehler wird in `docs/error-log.md` dokumentiert mit:

- `[ERR-XXX]` Kurztitel
- Datum, Task-Referenz, Komponente, Schwere, Status
- Symptom, Ursache, Kontext
- Lösung / Workaround
- Lernmuster (max. 2 Sätze)
- Präventivmaßnahme

**Fehler-Kategorien:** `#env-config`, `#schema-migration`, `#dependency`, `#assumption-wrong`, `#missing-doc`, `#test-gap`, `#context-overflow`, `#race-condition`, `#size-violation`

**Pflicht-Retrospektive:** Nach jeder Task (auch fehlerfrei) in `docs/error-log.md`
