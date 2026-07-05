---
task_id: TASK-2026-07-04-shadcn-base-ui
title: shadcn/ui (Base UI) in das Frontend integrieren
status: DONE
priority: MEDIUM
owner: Developer (Agent)
created_at: 2026-07-04
updated_at: 2026-07-04
phase: Frontend / Infra
kb_references: []
adr_references: []
---

# Ziel
shadcn/ui in das Vite+React 19+Tailwind v4 Frontend integrieren, explizit mit **Base UI**
(statt Radix) als Primitive-Library. Bestehende Design-Tokens (`ci-*`, Pfirsich-Brand) bleiben erhalten.

# Scope
- In Scope:
  - vite.config.ts: `@`-Alias fuer Runtime-Auflösung (tsconfig.paths existiert bereits)
  - `shadcn init -b base`: components.json, cn-util, Base-UI-Dep, CSS-Variablen
  - globals.css-Integritaet sichern (Backup + Rueckspielen der `ci-*`/`@theme`-Tokens)
  - Basis-Komponenten adden: button, input, label, dialog, card, badge
  - Build-Verify
- Out of Scope:
  - Migration bestehender Seiten auf shadcn-Komponenten (Folge-Task)
  - Dark-Mode-Toggle
  - Weitere Komponenten (select, dropdown, etc.) bei Bedarf spaeter

# Aufgaben
- [x] Pflicht-Quellen geprueft (KB, decisions, error-log)
- [x] globals.css sichern; vite.config.ts `@`-Alias ergaenzen
- [x] `npx shadcn@latest init -b base -p nova -y`
- [x] globals.css pruefen + Manrope als --font-sans wiederhergestellt (Nova hatte Geist gesetzt); Geist-Dep entfernt
- [x] Basis-Komponenten adden: button, input, label, card, badge, dialog (alle Base UI)
- [x] `npm run build` -> CLEAN (tsc + vite, 1759 Module, 807ms); ERR-002 als Side-Effect aufgeloest
- [x] Doku (status, summary, retro, ADR-002, KB-005)

# Akzeptanzkriterien
1. `components.json` existiert, `"base"` als Primitive konfiguriert (kein radix).
2. `@base-ui-components/react` in package.json; `src/lib/utils.ts` mit `cn()`.
3. `ci-*`-Klassen + Pfirsich-Brand in globals.css erhalten.
4. `components/ui/` enthaalt button/input/label/dialog/card/badge (Base UI).
5. `npm run build` ohne neue (durch diese Task verursachte) Fehler.

# Risiken
- R-SH-001 init ueberschreibt globals.css -> Mitigation: Backup, gezielt rueckspielen
- R-SH-002 pre-existing Build-Fehler ERR-002 (SidebarLayout/SidebarNavigation) verdecken Erfolg -> Mitigation: nur NEUE Fehler bewerten
- R-SH-003 Base UI vs Radix-Migration init interaktiv -> Mitigation: `-b base -y` non-interactive

# Betroffene Dateien
- frontend/vite.config.ts (GEAENDERT - @-Alias)
- frontend/components.json (neu)
- frontend/src/lib/utils.ts (neu - cn)
- frontend/src/globals.css (GEAENDERT - shadcn-Tokens, ci-* bleiben)
- frontend/src/components/ui/*.tsx (neu - shadcn-Komponenten)
- frontend/package.json (GEAENDERT - Deps)

# Bekannte Fehler aus error-log.md fuer diesen Task
- ERR-002 / LM-003: pre-existing Build-Fehler (SidebarLayout/SidebarNavigation) nicht dieser Task anlasten.

# DoD-Checkliste
- [x] Akzeptanzkriterien erfuellt
- [x] Tests/Checks ausgefuehrt (npm run build clean)
- [x] Doku aktualisiert
- [x] KB-Eintrag (KB-005) + ADR-002
- [x] Summary + project-status
- [x] Naechste Schritte dokumentiert

# Implementierungsnotizen
- `init -y` ueberspringt NICHT den Preset-Prompt; `-p <name>` (hier `nova`) noetig fuer non-interactive Run.
- Nova-Preset setzt `--font-sans` auf Geist + installiert `@fontsource-variable/geist`. Zurueckgesetzt auf
  Manrope (Projekt-Brand), Geist-Dep entfernt. `ci-*`-Klassen + Pfirsich-Tokens blieben unangetastet.
- components.json `"style": "base-nova"`, `"baseColor": "neutral"`. shadcn-Tokens in `:root`/`.dark` (oklch).
- Side-Effect: Nach `shadcn init` (Dependency-Neuinstallation) ist `npm run build` komplett sauber —
  die pre-existing Fehler ERR-002 (SidebarLayout/SidebarNavigation) sind ebenfalls verschwunden.

# Abschluss-Summary
- Ergebnis: shadcn/ui mit Base UI erfolgreich integriert; Build sauber.
- Was wurde geaendert: vite.config.ts (@-Alias), components.json (neu), src/lib/utils.ts (cn, neu),
  src/globals.css (shadcn-Tokens + Manrope erhalten), src/components/ui/{button,input,label,card,badge,dialog}.tsx (neu, Base UI),
  package.json (+@base-ui/react, cva, clsx, tailwind-merge, tw-animate-css, shadcn).
- Empfohlene naechste Schritte: (1) neue Seiten schrittweise auf shadcn-Komponenten umstellen,
  (2) ggf. `--primary`/`--accent` oklch-Tokens an Pfirsich-Brand (#f3aa7f) anpassen fuer einheitliche shadcn-Optik.
