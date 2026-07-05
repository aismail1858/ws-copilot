# Agentic Workflow for Coding

Ein Framework für KI-gestützte, mehrstufige Softwareentwicklung mit spezialisierten Agenten-Rollen.

## Überblick

Dieses Repository definiert einen strukturierten Workflow für die Zusammenarbeit mehrerer KI-Agenten (Orchestrator, Architect, Developer, Reviewer, Tester, DevOps, Product Owner, Security Expert, Skeptic, AI Expert). Jeder Agent hat eine spezifische Rolle mit klaren Verantwortlichkeiten.

### Kernbestandteile

- **10 Agenten-Rollen** mit spezifischen Skills-Definitionen
- **7 Entwicklungsphasen** von Discovery bis Deployment
- **3 Workflows**: Epic-to-Deployment, Feature Development, Hotfix
- **4 Templates**: Task, User Story, ADR, Retrospektive
- **Memory-System**: 4 Gedächtnistypen für konsistenten Projektkontext

### Workflows

| Workflow | Beschreibung |
|---|---|
| [Epic-to-Deployment](workflows/epic-to-deployment.md) | Vollständiger Workflow von der Idee bis zum Deployment |
| [Feature Development](workflows/feature-development.md) | Gezielte Feature-Entwicklung mit Qualitätssicherung |
| [Hotfix](workflows/hotfix.md) | Schnelle Fehlerbehebung im laufenden Betrieb |

## Verzeichnisstruktur

```
├── AGENTS.md              # Verbindliches Arbeitsprotokoll
├── workflows/             # Workflow-Definitionen
├── docs/
│   ├── architecture/      # Architektur-Dokumentation
│   ├── research/          # Markt-, Technologie- und User-Research
│   ├── skills/            # Agenten-Rollen-Skills
│   ├── templates/         # Vorlagen (User Story, Retro)
│   ├── tasks/             # Aktive und abgeschlossene Tasks
│   ├── decision-log.md    # Architekturentscheidungen (ADR)
│   ├── project-status.md  # Aktueller Projektstatus
│   └── error-log.md       # Fehlerhistorie und Lernmuster
└── .opencode/             # OpenCode-Konfiguration
```

## Status

Aktuell in der **Initialisierungsphase**. Das Framework-Grundgerüst steht. Nächstes Ziel: erstes Feature (Workflow Dashboard) implementieren.

Siehe [docs/project-status.md](docs/project-status.md) für den aktuellen Stand.
