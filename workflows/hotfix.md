# Workflow: Hotfix

## Zweck
Schneller Fix für kritische Bugs in Produktion. Minimaler Workflow mit Fokus auf Speed und Sicherheit.

## Eingaben
- Bug-Report / Fehlerbeschreibung
- Betroffene Version

## Übersicht

```
Bug-Report
  │
  ▼
┌─────────────────┐
│ Hotfix Branch   │ ← Developer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Fix + Tests     │ ← Developer, Tester
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Quick Review    │ ← Reviewer
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy Hotfix   │ ← DevOps
└────────┬────────┘
         │
         ▼
    Retrospektive
```

## Detaillierte Schritte

### 1. Hotfix Branch erstellen (5 Minuten)
```bash
# Von main/latest-tag
git checkout main
git pull
git checkout -b hotfix/TASK-XXX
```

### 2. Fix implementieren (variabel)

1. [ ] Bug analysieren
2. [ ] Root Cause identifizieren
3. [ ] Minimalen Fix schreiben
4. [ ] Fix testen
5. [ ] Commit: `fix(scope): Beschreibung`

### 3. Tests (15-30 Minuten)

1. [ ] Regressionstests
2. [ ] Spezifischer Bug-Test
3. [ ] Keine neuen Features einbauen!

### 4. Quick Review (15-30 Minuten)

1. [ ] Code Review (nur kritische Punkte)
2. [ ] Sicherheits-Check (Security Expert)
3. [ ] Genehmigung

### 5. Deployment (15-30 Minuten)

```bash
# Merge in main
git checkout main
git merge hotfix/TASK-XXX
git tag -a HOTFIX-XXX -m "Hotfix: Beschreibung"
git push origin main --tags

# Deploy
docker compose down
docker compose up -d
```

### 6. Post-Hotfix

1. [ ] Smoke Tests
2. [ ] Monitoring prüfen
3. [ ] In develop mergen: `git checkout develop && git merge main`
4. [ ] Bug-Report aktualisieren: RESOLVED

### 7. Retrospektive (optional aber empfohlen)

1. [ ] Was ist passiert?
2. [ ] Warum ist es passiert?
3. [ ] Wie verhindern wir das?
4. [ ] Lernmuster in episodic/

## Regeln für Hotfixes

### DO
- [ ] Minimalen Fix schreiben
- [ ] Nur den Bug beheben
- [ ] Schnell deployen
- [ ] Smoke Tests machen
- [ ] In develop zurückmergen

### DON'T
- [ ] Keine Refactoring-Einbauten
- [ ] Keine neuen Features
- [ [ ] Keine großen Änderungen
- [ ] Keine Experimente

## Abbruchkriterien
- Fix löst Bug nicht → HALT, erneute Analyse
- Fix verursacht neue Bugs → HALT, Rollback
- Sicherheitsproblem → HALT, sofortiger Rollback

## Geschätzte Dauer
- **Einfacher Bug:** 1-2 Stunden
- **Komplexer Bug:** 4-8 Stunden
- **Kritischer Bug:** Sofort, bis behoben

## Eskalation
- **Bei Unsicherheit:** Architect fragen
- **Bei Sicherheit:** Security Expert einschalten
- **Bei kritischen Bugs:** Human informieren
