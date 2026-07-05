# Risiko-Register

Dokumentation aller projektrelevanten Risiken. Wird regelmäßig aktualisiert.

---

## Aktive Risiken

| ID | Risiko | Einfluss | Wahrscheinlichkeit | Gegenmaßnahme | Status |
|----|--------|----------|-------------------|---------------|--------|
| R-001 | *Noch keine Risiken* | - | - | - | - |
| R-RB-001 | Breaking Change an allen `user_id`-basierten Routen durch neues Berechtigungsmodell | HOCH | HOCH | Zugriffsmenge zentral via RPC `accessible_document_ids`; Migration + Backfill + Negativ-Tests pro Route | AKTIV |
| R-RB-002 | Berechtigungs-Bypass, wenn eine Route die zentrale Zugriffsfunktion vergisst | HOCH | MITTEL | Helper `get_current_user_tier()` + verpflichtende Nutzung der RPC; Integrationstests je Tier | AKTIV |
| R-RB-003 | Falsches Backfill `user`->`member` / `admin`->`admin` bei Rollen-Migration | MITTEL | MITTEL | Migration zuerst auf Dev-DB, Stichproben, Rollback-Plan | AKTIV |

---

## Template für neue Risiken

```markdown
### [R-XXX] [Risikobeschreibung]

- **Erstellt:** YYYY-MM-DD
- **Kategorie:** [Technisch | Organisatorisch | Extern]
- **Einfluss:** [HOCH | MITTEL | NIEDRIG]
- **Wahrscheinlichkeit:** [HOCH | MITTEL | NIEDRIG]
- **Risiko-Score:** [Einfluss × Wahrscheinlichkeit]
- **Gegenmaßnahme:** [Was wird getan?]
- **Verantwortlich:** [Wer überwacht?]
- **Status:** [AKTIV | MITIGIERT | EINGETRETEN | ABGESCHLOSSEN]
```

---

## Risiko-Kategorien

### Technische Risiken
- Komplexität
- Integration
- Performance
- Sicherheit
- Skalierbarkeit

### Organisatorische Risiken
- Team-Kenntnisse
- Zeitmangel
- Kommunikation
- Prozesse

### Externe Risiken
- Drittanbieter
- APIs
- Regulation
- Kosten

---

## Risiko-Matrix

```
              Einfluss
              HOCH  MITTEL  NIEDRIG
Wahrscheinl.  ┌─────┬───────┬────────┐
HOCH          │ X   │ X     │ -      │
MITTEL        │ X   │ -     │ -      │
NIEDRIG       │ -   │ -     │ -      │
              └─────┴───────┴────────┘

X = Aktives Risiko
- = Kein Risiko
```

---

## Letzte Aktualisierung

- **Datum:** 2026-06-29
- **Nächste Überprüfung:** Bei jeder Retrospektive
