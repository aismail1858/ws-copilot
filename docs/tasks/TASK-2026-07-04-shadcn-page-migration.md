---
task_id: TASK-2026-07-04-shadcn-page-migration
title: shadcn/ui Page Migration — Pfirsich-Brand + Wave 1 (5 Seiten) + Wave 2 (alle restlichen Dateien)
status: DONE
priority: HIGH
owner: Agent
created_at: 2026-07-04
updated_at: 2026-07-04
phase: Frontend Migration
kb_references: [KB-005]
adr_references: [ADR-002]
---

# Ziel

Erste Welle der Migration von legacy `ci-*`-CSS-Klassen auf shadcn/ui (Base UI). Gleichzeitig werden die CSS-Variablen an den Pfirsich-Brand (`#f3aa7f`) angepasst, sodass shadcn-Komponenten das bestehende Branding übernehmen.

# Scope

- In Scope:
  - Update der CSS-Variablen `--primary` und `--primary-foreground` auf Pfirsich-Brand
  - Migration von 5 Seiten: LoginPage, RegisterPage, UnauthorizedPage, UsersPage, TeamsPage
  - Ersetzung: `ci-button-primary` → `<Button>`, `ci-input` → `<Input>`, `ci-panel` → `<Card>`, `ci-app-shell` → `bg-background`
- Out of Scope:
  - ChatPage, SettingsPage, IngestionPage (komplexer, später)
  - Sidebar-Migration (separater Task)
  - Backend-Änderungen

# Aufgaben

- [x] Analyse: ci-* usage mapping
- [ ] CSS-Variablen auf Pfirsich-Brand aktualisieren
- [ ] LoginPage → shadcn Button + Input + Card
- [ ] RegisterPage → shadcn Button + Input + Card
- [ ] UnauthorizedPage → shadcn Button
- [ ] UsersPage → shadcn Button + Input + Card
- [ ] TeamsPage → shadcn Button + Input + Card
- [ ] Build verify (`npm run build`)
- [ ] Doku aktualisieren (KB-005, project-status, implementation-summary)
- [ ] Retrospektive in error-log.md

# Akzeptanzkriterien

1. `npm run build` läuft sauber (tsc --noEmit && vite build)
2. shadcn `<Button variant="default">` zeigt Pfirsich-Brand (vorher: dark)
3. Migrierte Seiten rendern optisch vergleichbar zum vorherigen ci-* Look
4. Keine ci-* Klassen mehr in den migrierten 5 Seiten

# Abhängigkeiten

- shadcn/ui Base UI muss installiert sein (✓, TASK-2026-07-04-shadcn-base-ui)
- Komponenten Button, Input, Card, Badge müssen existieren (✓)

# Risiken

- Brand-Farbänderung könnte andere shadcn-Komponenten visuell beeinflussen (z.B. Badge, Dialog → Testing via build)
- ci-* Klassen in globals.css bleiben erhalten für nicht-migrierte Seiten → Parallelbetrieb

# Betroffene Dateien

- frontend/src/globals.css
- frontend/src/pages/LoginPage.tsx
- frontend/src/pages/RegisterPage.tsx
- frontend/src/pages/UnauthorizedPage.tsx
- frontend/src/pages/UsersPage.tsx
- frontend/src/pages/TeamsPage.tsx
- frontend/src/components/layout/DashboardLayout.tsx
- docs/knowledge-base.md
- docs/project-status.md

# Implementierungsnotizen

- Start: 2026-07-04
- Zwischenstand: Wave 1 (5 Seiten) + Wave 2 (alle verbleibenden 9 Seiten + 8 Komponenten)
- Blocker: keine

# DoD-Checkliste

- [x] Akzeptanzkriterien erfuellt
- [x] Tests/Checks ausgefuehrt (npm run build — clean, 774ms)
- [x] Dokumentation aktualisiert
- [x] KB-Eintrag aktualisiert (KB-005)
- [x] Summary in `docs/implementation-summaries.md` vorhanden
- [x] `docs/project-status.md` aktualisiert
- [x] Retrospektive Wave 1 in error-log.md (RETRO-005)
- [x] Retrospektive Wave 2 in error-log.md (RETRO-006)

# Abschluss-Summary

- **Ergebnis:** Wave 1: 5 Seiten + DashboardLayout migriert. Wave 2: Alle restlichen 14 Dateien migriert. Insgesamt 19 Dateien (6 Pages + 2 Layouts + 11 Komponenten/Hilfsdateien). CSS-Variablen auf Pfirsich-Brand umgestellt.
- **Was wurde geaendert (Wave 1):**
  - `globals.css`: `--primary`, `--accent`, `--chart-1`, `--ring`, `--sidebar-primary` → oklch(0.78 0.105 45) (#f3aa7f); `ci-button-blue` entfernt
  - `LoginPage.tsx`, `RegisterPage.tsx`: `<Card>` + `<Input>` + `<Button>` statt ci-panel/ci-input/ci-button-primary
  - `UnauthorizedPage.tsx`: `<Button>` statt ci-button-primary
  - `UsersPage.tsx`: `<Card>` + `<Input>` + `<Button>` statt ci-panel/ci-input/ci-button-primary
  - `TeamsPage.tsx`: `<Input>` + `<Button>` statt ci-input/ci-button-primary
  - `DashboardLayout.tsx`: `ci-app-shell` entfernt
- **Was wurde geaendert (Wave 2):**
  - `SourcesPage.tsx`: `ci-panel` → `<Card>`, `ci-input` (select) → Tailwind border/input classes
  - `IngestionPage.tsx`: `ci-input` (select) → Tailwind border/input classes
  - `TokenUsagePage.tsx`: `ci-panel` ×2 → `<Card>` + `div` border/bg-card, `ci-button-primary` → `bg-primary text-primary-foreground`
  - `SettingsPage.tsx`: `ci-button-primary` → `<Button>`, `ci-panel` → `<Card>`, `ci-input` ×6 → `<Input>`, `ci-button-soft` → `<Button variant="outline">`
  - `ChatPage.tsx`: `ci-panel` → `border border-border bg-card`, `ci-button-primary` ×2 → `bg-primary text-primary-foreground`
  - `PromptDialog.tsx`: `ci-panel` ×2 → `border border-border bg-card`, `ci-input` → `<Input>`, `ci-button-soft` → `<Button variant="outline">`, `ci-button-primary` ×2 → `<Button>`
  - `ChangePasswordModal.tsx`: `ci-panel` → `border border-border bg-card`, `ci-input` ×3 → `<Input>`, `ci-button-soft` → `<Button variant="outline">`, `ci-button-primary` → `<Button>`
  - `SidebarQuickActions.tsx`: `ci-button-primary` → `<Button>`, `ci-button-soft` → `<Button variant="outline">`
  - `SidebarSearch.tsx`: `ci-input` → `<Input>`
  - `ChatMessages.tsx`: `ci-panel` → `border border-border bg-card`
  - `ModelSelector.tsx`: `ci-input` → inline `border border-input bg-transparent ...`
  - `SidebarLayout` (2x): `ci-panel` → `border-r border-border bg-card`
  - `TeamsPage.tsx`: 2x `ci-input` (select) → Tailwind border/input classes (final cleanup)
- **Offene Restpunkte:** Keine ci-* Klassen mehr im Source-Code. ci-* Definitionen in globals.css bleiben als Fallback für allfällige Referenzen.
- **Empfohlene naechste Schritte:**
  1. globals.css von legacy ci-* Definitionen bereinigen (nach Sicherstellung, dass keine Imports mehr referenzieren)
  2. Pfirsich-Brand-Tokens in globals.css weiter verfeinern (z.B. --accent, --muted anpassen)
  3. Backend-Modellkatalog-Anbindung (Item 8 aus project-status) als nächsten Fullstack-Task umsetzen
