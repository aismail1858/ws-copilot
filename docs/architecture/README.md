# architecture

Architektur-Dokumentation: System-Design, Komponenten, Bounded Contexts.

## Verbindliche Regel: Mermaid-Diagramme (.mmd)

In diesem Verzeichnis **müssen** alle Architektur-Diagramme als Mermaid-Dateien (`.mmd`) angelegt werden.

- Jede Architekturansicht (System-Design, Komponenten, Bounded Contexts, Deployment, Sequenzfluss, etc.) wird als eigene `.mmd`-Datei gespeichert.
- Dateinamen sind sprechend und englisch/kebab-case, z.B.:
  - `system-overview.mmd`
  - `component-diagram.mmd`
  - `bounded-contexts.mmd`
  - `deployment-view.mmd`
  - `data-flow.mmd`
- Diagramme sind mit der jeweiligen Task-MD (`docs/tasks/TASK-*.md`) und dem passenden ADR (`docs/decisions.md`) zu verknüpfen.
- Bei jeder Architekturentscheidung wird das zutreffende Diagramm aktualisiert oder neu angelegt — siehe `AGENTS.md` Abschnitt 3.5 und 4.

## Verbindliche Regel: Architektur immer aktuell halten

Die Architektur-Dokumentation muss **immer aktuell** sein und wird **bei jeder relevanten Änderung** zwingend mitgezogen.

Architektur-Änderungen, die eine Aktualisierung auslösen, sind mindestens:

- neue oder entfernte Komponenten / Services
- Änderungen an Schnittstellen, APIs oder Datenflüssen
- neue Bounded Contexts oder Verschiebung von Verantwortlichkeiten
- Deployment- oder Infrastruktur-Änderungen
- neue Abhängigkeiten zwischen Modulen / Services
- Änderungen an Persistenz, Queueing, SSE, RAG-Pfaden
- Entscheidungen aus `docs/decisions.md` (ADR), die sich auf Struktur oder Flow auswirken

Verbindliches Vorgehen bei jeder solchen Änderung:

1. zuständige `.mmd`-Diagramme in diesem Verzeichnis aktualisieren (oder neu anlegen)
2. wenn nötig neuen ADR in `docs/decisions.md` ergänzen
3. Task-MD (`docs/tasks/TASK-*.md`) referenziert die geänderten Diagramme
4. `docs/project-status.md` und ggf. `docs/knowledge-base.md` aktualisieren
5. Fehler-Retrospektive in `docs/error-log.md` (wie in `AGENTS.md` Abschnitt 12)

> Eine Architektur-Änderung ohne Aktualisierung der `.mmd`-Diagramme gilt als **nicht abgeschlossen** (siehe `AGENTS.md` Section 4 und Section 13 Definition of Done).

## Inhaltsuebersicht

| Diagramm | Datei | Beschreibung |
|---|---|---|
| Rollen- & Berechtigungsmodell | `role-permission-data-model.mmd` | ER-Modell: `roles`, `teams`, `team_members`, `source_members` + Sichtbarkeit (`global`/`team`/`members`/`private`) auf `project_documents`. Bezug: ADR-001, Konzept `role-permission-concept.md`. |

> Wenn weitere `.mmd`-Diagramme angelegt werden, diese Tabelle entsprechend pflegen.

