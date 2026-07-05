---
task_id: TASK-2026-07-05-feature-interaction-map
title: Feature-Interaktions-Karte (Frontend/Backend Zusammenhänge erforschen & dokumentieren)
status: DONE
priority: MEDIUM
owner: Agent
created_at: 2026-07-05
updated_at: 2026-07-05
phase: Doku/Architektur
kb_references: [KB-011, KB-012]
adr_references: [ADR-001, ADR-004]
---

# Ziel
Verstehen und detailliert dokumentieren, wie alle Frontend-Features (Chat, Config, Teams, Projects, Ingestion, Quellen) miteinander interagieren und warum. Ergebnis: umfassende KB-Einträge als lebendes Gedächtnis.

# Scope
- In Scope: Forschung + Doku der Feature-Interaktionen (Frontend+Backend)
- Out of Scope: Code-Änderungen (reine Wissenserfassung)

# Aufgaben
- [x] Frontend-Struktur & Routing erforscht (3 Explore-Agenten parallel)
- [x] Backend-Datenmodell & Entitätsbeziehungen erfasst
- [x] Ingestion→Sources→Teams→RBAC-Flow dokumentiert
- [x] KB-011 (zwei parallele API/Auth-Systeme) geschrieben
- [x] KB-012 (Feature-Interaktions-Karte) geschrieben
- [x] Diskrepanzen als OQ/CONFLICT erfasst
- [x] project-status aktualisiert

# Akzeptanzkriterien
1. KB dokumentiert alle Feature-Interaktionen mit Dateipfaden
2. Architektonische Risiken sind als OQ erfasst
3. Nächste Schritte sind empfohlen

# Betroffene Dateien (Doku)
- `docs/knowledge-base.md` (KB-011, KB-012)
- `docs/open-questions.md` (OQ-ARCH-001..005)
- `docs/project-status.md`
- `docs/implementation-summaries.md`

# Abschluss-Summary
- Ergebnis: Vollständige Interaktions-Karte in KB-011/KB-012. 5 neue OQ für Diskrepanzen.
- Empfohlene nächste Schritte: OQ-ARCH-001 (API/Auth-Konsolidierung) ist der wichtigste Folge-Task — die zwei parallelen Auth-Systeme sind die Wurzel vieler Frontend-Probleme.
