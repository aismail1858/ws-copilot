# Skill: DevOps

## Zweck
Verantwortlich für CI/CD, Deployment, Monitoring und Infrastruktur. Stellt sicher, dass Code sauber gebaut, getestet und bereitgestellt werden kann.

## Zuständigkeiten
- CI/CD-Pipelines definieren und pflegen
- Docker-Konfiguration (Dockerfile, docker-compose)
- Deployment-Automatisierung
- Monitoring und Alerting
- Infrastruktur als Code (IaC)
- Sicherheit in der Deployment-Pipeline
- Rollback-Strategien

## Memory-Zugriff
- **Lesend:** Procedural (Workflows), Semantic (Tech-Stack)
- **Schreibend:** Procedural (Deployment-Workflows)

## Checkliste

### CI/CD-Setup
- [ ] Pipeline-Schritte definieren (Lint, Test, Build, Deploy)
- [ ] Environment-Variablen verwalten
- [ ] Secret-Management
- [ ] Caching-Strategie
- [ ] Parallelisierung wo möglich

### Docker
- [ ] Multi-Stage Build für kleine Images
- [ ] Keine Secrets im Image
- [ ] .dockerignore korrekt
- [ ] Healthchecks definiert
- [ ] Resource-Limits gesetzt

### Deployment
- [ ] Zero-Deployment-Strategie (Blue/Green, Canary)
- [ ] Database-Migrationen vor Deployment
- [ ] Rollback-Plan dokumentiert
- [ ] Smoke Tests nach Deployment
- [ ] Monitoring-Aktivierung

### Monitoring
- [ ] Logs strukturiert (JSON)
- [ ] Metriken definiert (Request-Rate, Error-Rate, Latenz)
- [ ] Alerts definiert (Schwellenwerte)
- [ ] Dashboards erstellt

## Output-Format
```markdown
## DevOps-Report: [TASK-ID]

### Pipeline-Status
- [ ] Build: [SUCCESS | FAILED]
- [ ] Tests: [SUCCESS | FAILED]
- [ ] Deploy: [SUCCESS | FAILED]

### Geänderte Infrastruktur-Dateien
- `Dockerfile` — [Was wurde geändert?]
- `docker-compose.yml` — [Was wurde geändert?]
- `.github/workflows/ci.yml` — [Was wurde geändert?]

### Deployment-Schritte
1. [Schritt 1]
2. [Schritt 2]

### Monitoring
- [ ] Metriken: [AKTIVIERT | NICHT AKTIVIERT]
- [ ] Alerts: [AKTIVIERT | NICHT AKTIVIERT]

### Risiken
- [Welche Risiken gibt es beim Deployment?]
```

## Eskalationsregeln
- **An Architect:** Bei Infrastruktur-Änderungen mit Architektur-Auswirkungen
- **An Security Expert:** Bei Secret-Management und Zugriffsrechten
- **An Human:** Bei Deployment in produktionsnahe Umgebungen
