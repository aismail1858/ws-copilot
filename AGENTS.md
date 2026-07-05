# AGENTS.md - Verbindliches Codex-Arbeitsprotokoll für agentic-workflow-for-coding

Dieses Dokument definiert die operative Arbeitsweise für Codex in diesem Repository.
Ziel: konsistenter Projektstand, saubere Ausführung, lückenlose Dokumentation, sichtbarer Fullstack-Fortschritt und kontinuierliches Lernen aus Fehlern.

---

## 0. Projektkontext (Pflicht)
- Projektname: `<PROJECT_NAME>`
- Architektur: `<ARCHITECTURE_OVERVIEW>`
- Hauptkomponenten:
  - `<COMPONENT_1>`
  - `<COMPONENT_2>`
  - `<COMPONENT_3>`

---

## 1. Verbindliche Quellenreihenfolge

Vor jeder Umsetzung müssen diese Quellen in Reihenfolge geprüft werden:

1. `docs/knowledge-base.md`
2. `docs/decisions.md`
3. `docs/project-status.md`
4. `docs/open-questions.md`
5. `docs/risks.md`
6. `docs/error-log.md` ← **Pflicht: bekannte Fehler und Lernmuster prüfen**
7. relevante Fachdokumente je Task, typischerweise:
   - `docs/user-stories-and-journeys.md`
   - `prd.md`
   - `project_structure.md`
   - `AGENTS.md`

Wenn Widersprüche gefunden werden:
- in `docs/open-questions.md` als `CONFLICT-XXX` eintragen
- im Task kurz einordnen (welcher Stand gilt und warum)
- Implementierung erst fortsetzen, wenn Konflikt dokumentiert ist

---

## 2. Pflicht vor jeder Implementierung: Task-MD

Vor jeder Code-, Infra-, Architektur- oder Prozess-Änderung muss eine Task-Datei existieren.

### 2.1 Pfad und Benennung
- Pfad: `docs/tasks/`
- Name: `TASK-YYYY-MM-DD-<slug>.md`
- Vorlage: `docs/tasks/TASK-TEMPLATE.md`

### 2.2 Mindestinhalt
Jede Task-MD enthält mindestens:
- Task-ID, Titel, Status, Owner, Datum
- Ziel und Scope
- konkrete Aufgaben als Checkboxen
- Akzeptanzkriterien
- betroffene Dateien
- KB-/ADR-Referenzen
- Risiken, Abhängigkeiten, offene Fragen
- DoD-Checkliste
- Feld: **Bekannte Fehler aus `error-log.md`**, die für diesen Task relevant sind (leer lassen wenn keine)

---

## 3. Ausführungsworkflow pro Task

1. Checkpoint-Review der Wissensbasis (Section 1) inkl. `docs/error-log.md`
2. Task-MD erstellen oder auf `IN_PROGRESS` setzen
3. Implementierung in kleinen, nachvollziehbaren Schritten
4. Nach jedem relevanten Schritt:
   - Task-Status aktualisieren
   - notwendige Doku aktualisieren
5. Bei Architekturentscheidung:
   - `docs/decisions.md` (ADR) aktualisieren oder erweitern
6. Bei Risikoänderung:
   - `docs/risks.md` aktualisieren
7. Bei regulatorischer Relevanz:
   - `docs/compliance/` aktualisieren (falls vorhanden, sonst als Follow-up-Task planen)

### 3.1 Fehlerbehandlung während der Ausführung

Wenn ein Check oder eine Aktion scheitert, gilt folgendes Protokoll — verbindlich, keine Ausnahmen:

```
1. Fehler sofort in der Task-MD unter "Aufgetretene Fehler" dokumentieren
   (Fehlermeldung, betroffene Datei/Komponente, Zeitpunkt)
2. Maximal 2 Retry-Versuche mit jeweils anderem Ansatz
3. Falls nach 2 Retries ungelöst:
   → Task auf BLOCKED setzen
   → Fehler in docs/error-log.md als neuen Eintrag anlegen
   → Blocker in docs/open-questions.md eintragen
   → Keine weiteren Implementierungsschritte in dieser Session
4. Falls gelöst:
   → Lösung ebenfalls in docs/error-log.md dokumentieren (Lerneffekt)
```

**Aktionen, die immer Human-Approval erfordern (Agent pausiert und wartet):**
- Datenbankmigrationen (pgvector, Schema-Rollout)
- Änderungen an `.env`-Dateien
- Änderungen an CI/CD-Konfigurationen
- Löschen von Dateien oder Verzeichnissen
- Deployment-Aktionen in produktionsnahe Umgebungen

---

## 4. Pflicht nach jeder Implementierung

Nach Abschluss einer Task müssen diese Punkte erledigt sein:

1. Task-MD auf `DONE` setzen
2. DoD-Checkliste abhaken
3. Implementierungs-Summary in `docs/implementation-summaries.md` anlegen
4. `docs/project-status.md` aktualisieren
5. KB-Eintrag in `docs/knowledge-base.md` ergänzen (`[KB-XXX]`)
6. **Fehler-Retrospektive in `docs/error-log.md`** (Section 12) — auch wenn keine Fehler aufgetreten sind (dann: `Keine Fehler in dieser Task`)

Ohne diese 6 Punkte gilt die Implementierung als nicht abgeschlossen.

---

## 5. Session-Start und Session-Handoff

### 5.1 Session-Start (Pflicht)
- `docs/project-status.md` lesen
- `docs/error-log.md` lesen — aktive Fehler und offene Patterns prüfen
- aktive Task in `docs/tasks/` identifizieren
- falls keine aktive Task existiert: neue Task-MD erstellen

### 5.2 Unterbrechung mitten in Implementierung
- aktuelle Task-MD sofort aktualisieren:
  - aktueller Stand
  - nächster konkreter Schritt
  - Blocker
  - aufgetretene Fehler (falls vorhanden)
- `docs/project-status.md` auf neuesten Stand bringen

### 5.3 Neue Session
- mit letzter `IN_PROGRESS` Task starten
- keine parallelen neuen Tasks ohne dokumentierte Priorisierung
- wenn letzte Task auf `BLOCKED` steht: zuerst Blocker aus `docs/error-log.md` auflösen oder eskalieren

---

## 6. Projektspezifische Prioritäten (agentic-workflow-for-coding)

> **Hinweis:** Diese Prioritätsliste reflektiert den Stand bei letzter AGENTS.md-Aktualisierung.
> Die jeweils aktuelle Priorisierung steht in `docs/project-status.md` — diese hat im Zweifel Vorrang.

Bei konkurrierenden Themen gilt folgende Basisreihenfolge:

1. End-to-End Funktionsfähigkeit (`webapp` <-> `backend` inkl. SSE/RAG)
2. Ingestion-Pfad inkl. Queue/Worker Stabilität
3. Produktionsreife für Webapp + Backend (Schema-Rollout, `.env`, E2E-Validierung)
4. Dokumentationskonsistenz (KB/ADR/Status/Tasks)
5. VS Code Extension Integration gegen reale API-Endpunkte (erst nach stabilem Webapp+Backend-Stand)

Aktuell bekannte nächste Schwerpunkte laut `docs/project-status.md`:
- E2E-Test mit `docker compose up`
- `.env` Vollständigkeit für Supabase + LLM Keys
- pgvector Schema-Migration in Supabase

---

## 7. Qualitäts- und Testregeln

Tests und Checks werden zusammen mit Code/Doku aktualisiert. Je Task mindestens:
- 1 betroffene Komponentenprüfung (z. B. `backend` oder `webapp`)
- 1 Integrationsprüfung für den betroffenen End-to-End Pfad (wenn technisch möglich)

Typische Checks in diesem Repo:
- `cd backend && pytest`
- `cd webapp && npm run build`
- `cd extension && npm run build`
- `docker compose ps` / relevante Service-Logs bei E2E-Themen

Wenn Checks nicht laufen konnten: Grund in Task-MD dokumentieren und in `docs/error-log.md` erfassen.

### 7.1 Architektur- und Größen-Guardrails für neuen Code

Die im Audit dokumentierten Längengrenzen sind für neuen oder wesentlich erweiterten Produktivcode verbindliche Architekturleitplanken, nicht nur Stilregeln.

- Funktionen `> 50` Zeilen: harter Verstoss
- Funktionen `20-50` Zeilen: Warnbereich
- Dateien `> 500` Zeilen: harter Verstoss
- Dateien `300-500` Zeilen: Warnbereich

**Ausnahmen** sind zulässig, müssen aber in der Task-MD begründet werden:
```
[SIZE-EXCEPTION: <Begründung> — z.B. "generierter Migrationscode, nicht manuell pflegbar"]
```

Verbindliche Auslegung:
- Neue Logik ist entlang klarer Verantwortungen zu schneiden, bevor sie in Warn- oder Verstossbereiche wächst.
- Architekturgrenzen aus ADR-004 bleiben bindend.
- Frontend- und Extension-Änderungen sollen bei wachsender Komplexität in Hooks, Hilfsmodule, kleinere Komponenten oder Services extrahiert werden.
- Harte Verstösse in neuem Code sind vor Abschluss der Task zu beheben.
- Warnbereiche sind aktiv zu begründen und möglichst im selben Task zu entschärfen.
- Bereits bekannte Altlasten aus dem Audit sind kein Freibrief.

---

## 8. Relevante Standardartefakte

| Artefakt | Pfad | Zweck |
|---|---|---|
| Task-Vorlage | `docs/tasks/TASK-TEMPLATE.md` | Pflichtvorlage |
| Projektstatus | `docs/project-status.md` | aktueller Gesamtstatus |
| Implementierungs-Summaries | `docs/implementation-summaries.md` | Abschlussdokumentation je Task |
| Wissensbasis | `docs/knowledge-base.md` | langlebiges Projektwissen |
| Architekturentscheidungen | `docs/decisions.md` | ADR-Historie |
| Offene Fragen | `docs/open-questions.md` | Fragen und Konflikte |
| Risiken | `docs/risks.md` | aktive Projektrisiken |
| **Fehler-Log** | **`docs/error-log.md`** | **Fehlerhistorie + Lernmuster** ← neu |

---

## 9. Verbindliche Liefer- und Kommunikationsregeln

### 9.1 Next-Step-Empfehlung nach jeder Arbeit (Pflicht)
- Nach jeder abgeschlossenen Session müssen nächste Schritte empfohlen werden.
- Jede Empfehlung enthält eine kurze Begründung.
- Ohne Next-Step-Empfehlung gilt ein Abschlussbericht als unvollständig.

### 9.2 Sichtbarer Fortschritt während des Baus (Pflicht)
Bei jedem user-facing Feature ist ein testbarer Fullstack-Slice zu liefern:
- Backend-Änderung (API/Service/Persistenz)
- Frontend- oder Extension-Änderung, die diese Backend-Funktion direkt nutzbar macht
- nachvollziehbarer E2E-Testpfad

Reine Backend-Abschlüsse für user-facing Features sind nicht zulässig, außer:
- ein Blocker ist dokumentiert und
- ein konkreter Follow-up-Task für UI/Extension angelegt ist.

### 9.3 Session-Kontinuität
- Diese Regeln gelten in jeder neuen Session.
- Beim Session-Start prüfen, ob aktive Task Fullstack-Slice + Next-Step-Pflicht explizit berücksichtigt.

---

## 10. Kontextfenster-Strategie

Bei vollem oder knappem Kontextfenster gilt folgende Ladeprioritätj:

| Priorität | Dokumente | Wann laden |
|---|---|---|
| **Kern (immer)** | `project-status.md`, aktive Task-MD, `error-log.md` | jede Session |
| **Erweitert (bei Bedarf)** | `knowledge-base.md`, `decisions.md`, `risks.md` | bei Task-Relevanz |
| **Referenz (gezielt)** | `user-stories-and-journeys.md`, `prd.md`, `project_structure.md` | nur wenn direkt betroffen |

Wenn das Kontextfenster erschöpft ist:
- Kern-Dokumente haben Vorrang
- Erweiterte Dokumente nur bei direkter Task-Relevanz laden
- Großdateien (> 500 Zeilen) nur in relevanten Abschnitten lesen, nicht vollständig

---

## 11. Optionaler Schnellstart für neue Tasks

Wenn kein Task-Skript vorhanden ist, Task-Datei aus Vorlage kopieren:
- PowerShell: `Copy-Item docs/tasks/TASK-TEMPLATE.md docs/tasks/TASK-YYYY-MM-DD-<slug>.md`

Danach Metadaten und Scope sofort ausfüllen.

---

## 12. Fehler-Log-System (`docs/error-log.md`)

### 12.1 Zweck

`docs/error-log.md` ist das zentrale Gedächtnis für Fehler. Es dient nicht der Schuldzuweisung, sondern dem systematischen Lernen: Jeder dokumentierte Fehler verhindert denselben Fehler in zukünftigen Sessions und Tasks.

Der Agent **liest dieses Dokument bei jedem Session-Start** und **schreibt nach jeder Task** mindestens einen Eintrag.

### 12.2 Struktur eines Fehlereintrags

Jeder Eintrag in `docs/error-log.md` folgt diesem Schema:

```markdown
## [ERR-XXX] <Kurztitel>

- **Datum:** YYYY-MM-DD
- **Task-Referenz:** TASK-YYYY-MM-DD-<slug>
- **Komponente:** backend | webapp | extension | infra | docs
- **Schwere:** CRITICAL | HIGH | MEDIUM | LOW
- **Status:** OPEN | RESOLVED | WONT-FIX

### Symptom
Was war das beobachtbare Fehlverhalten? (Fehlermeldung, falsches Ergebnis, Timeout, ...)

### Ursache
Was war die eigentliche Ursache? (erst nach Analyse ausfüllen)

### Kontext
Welche Bedingungen haben den Fehler begünstigt? (z.B. fehlende .env, Race Condition, Annahme war falsch)

### Lösung / Workaround
Was hat das Problem behoben? Falls ungelöst: was wurde versucht?

### Lernmuster
> Kompakte Regel für zukünftige Sessions — max. 2 Sätze.
> Beispiel: "Vor pgvector-Migrationen immer Supabase-Verbindung verifizieren. `.env`-Vollständigkeit ist Vorbedingung."

### Präventivmaßnahme
Welche Guardrail, Check oder Doku-Ergänzung verhindert diesen Fehler künftig?
```

### 12.3 Fehler-Kategorien (Tags)

Fehler werden mit einem oder mehreren Tags versehen, um Muster sichtbar zu machen:

| Tag | Bedeutung |
|---|---|
| `#env-config` | Fehler durch fehlende oder falsche Umgebungsvariablen |
| `#schema-migration` | Fehler bei Datenbankschema-Änderungen |
| `#dependency` | Fehler durch Abhängigkeits-Konflikte (npm, pip, docker) |
| `#assumption-wrong` | Fehler weil eine Annahme nicht der Realität entsprach |
| `#missing-doc` | Fehler weil Dokumentation fehlte oder veraltet war |
| `#test-gap` | Fehler der durch einen fehlenden Test hätte verhindert werden können |
| `#context-overflow` | Fehler durch verlorenen oder falschen Kontext im Agent |
| `#race-condition` | Timing-/Reihenfolge-Problem in async Flows |
| `#size-violation` | Code-Qualitätsfehler durch überschrittene Größengrenzen |

### 12.4 Pflicht-Retrospektive nach jeder Task

Nach **jeder** abgeschlossenen Task — auch fehlerfreien — wird in `docs/error-log.md` ein Eintrag angelegt:

```markdown
## [RETRO-XXX] Retrospektive: TASK-YYYY-MM-DD-<slug>

- **Datum:** YYYY-MM-DD
- **Fehleranzahl in dieser Task:** N

### Aufgetretene Fehler
- [ERR-XXX] <Kurztitel> (falls vorhanden, Verweis auf Eintrag)
- Keine (falls keine Fehler aufgetreten)

### Was lief gut?
(1-3 Punkte — dokumentiert auch positive Patterns)

### Was würde man anders machen?
(1-3 Punkte — auch bei fehlerfreien Tasks reflektieren)

### Abgeleitete Regel für zukünftige Tasks
(Wird in Section 12.5 "Aktive Lernmuster" übernommen, falls generisch genug)
```

### 12.5 Aktive Lernmuster (lebende Liste)

Dieser Abschnitt in `docs/error-log.md` wird kontinuierlich gepflegt und enthält die destillierten Regeln aus allen bisherigen Fehlern. Er wird bei jedem Session-Start gelesen.

```markdown
## Aktive Lernmuster

| ID | Regel | Quelle |
|---|---|---|
| LM-001 | Vor jeder pgvector-Migration Supabase-Verbindung und .env prüfen | ERR-001 |
| LM-002 | ... | ERR-XXX |
```

---

## 13. Definition of Done (pro Task)

### Minor Task (Bugfix, kleine Anpassung, Doku-Update)
- [ ] Akzeptanzkriterien erfüllt
- [ ] betroffene Komponente geprüft
- [ ] Fehler-Retrospektive in `docs/error-log.md` (Kurzform)
- [ ] `docs/project-status.md` aktualisiert

### Major Task (Feature, Architektur, Infra-Änderung)
- [ ] Akzeptanzkriterien erfüllt
- [ ] relevante Tests/Checks ausgeführt oder begründet offen
- [ ] relevante Doku aktualisiert
- [ ] KB-Eintrag vorhanden (`[KB-XXX]`)
- [ ] Implementierungs-Summary geschrieben
- [ ] Projektstatus aktualisiert
- [ ] Fehler-Retrospektive in `docs/error-log.md` (vollständig)
- [ ] Aktive Lernmuster geprüft und ggf. ergänzt
