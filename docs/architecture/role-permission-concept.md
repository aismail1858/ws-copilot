# Konzept: Rollen- & Berechtigungsmodell fuer Quellen

- **Status:** ENTWURF (nur Konzept-Doku, keine Code-Aenderung)
- **Datum:** 2026-07-04
- **Verfasser:** Architect (Agent)
- **Bezug:** ADR-001 (siehe `docs/decisions.md`), Diagramm `role-permission-data-model.mmd`

---

## 1. Ziel & Problemstellung

Die Anwendung (WS-Copilot / Schummulus) ist eine MultiModal-RAG-Plattform. Quellen
sind heute streng **pro Nutzer besitzt**: `projects`, `project_documents`, `chats`,
`messages` filtern alle nach `user_id` (z.B. `backend/src/routes/projectRoutes.py:51`,
`backend/src/routes/projectFilesRoutes.py:44`). Es gibt keine Moeglichkeit, Wissen
team- oder firmenweit zu teilen.

**Gefordert** (User-Request): ein flexibles Rollenmodell, in dem

- **Admins** globale Quellen fuer alle Nutzer erstellen koennen,
- **Team Leads** Quellen nur fuer ihr Team verwalten und Mitglieder zu ihrem
  Team-Wissen hinzufuegen/entfernen koennen,
- **Mitglieder (Members)** nur Quellen abfragen koennen, zu denen sie Zugriff haben.

Rollen-Titel wie "Geschaeftsfuehrer", "Abteilungsleiter" usw. sind **Beispiele** und
muessen konfigurierbar sein, nicht fest im Code verdrahtet.

---

## 2. Design-Prinzip: Faehigkeits-Tiers statt fester Rollennamen

Damit Rollen flexibel bleiben, verankern wir die Berechtigungslogik an **drei
Faehigkeits-Tiers (Capability Tiers)**. Beliebige Rollen-Titel werden auf einen
dieser Tiers abgebildet.

| Tier | interne Kennung | Quelle veroeffentlichen fuer ... | Mitglieder-Verwaltung |
|------|-----------------|----------------------------------|------------------------|
| T0 | `admin` | **alle Nutzer** (`global`) | alle Nutzer, alle Teams, Rollen-Zuweisung |
| T1 | `team_lead` | **eigenes Team** (`team`) | Mitglieder **seines** Teams (add/remove) |
| T2 | `member` | — (nur Konsum) | — |

> Die Tiers T0/T1/T2 sind der einzige Anker fuer Berechtigungs-Checks. Der
> angezeigte Rollen-Titel ("Geschaeftsfuehrer", "Teamleiter Sales", ...) ist frei
> konfigurierbar und wird auf genau ein Tier abgebildet.

### 2.1 Rollen-Registry (`roles`)

Neue Tabelle als Nachschlagetabelle fuer Rollen-Titel:

| Spalte | Typ | Beschreibung |
|---|---|---|
| `key` | text PK | stabiler Schluessel, z.B. `admin`, `team_lead`, `member`, `geschaeftsfuehrer` |
| `label` | text | Anzeige-Name |
| `tier` | text (`admin` \| `team_lead` \| `member`) | entscheidender Berechtigungs-Tier |
| `is_system` | boolean | System-Rollen (`admin`, `team_lead`, `member`) nicht loeschbar |

**Default-Eintraege:** `admin`, `team_lead`, `member`. Admins koennen weitere Titel
anlegen (z.B. `geschaeftsfuehrer` → Tier `admin`; `abteilungsleiter` → Tier `team_lead`).

`users.role` referenziert kuenftig `roles.key` (FK). Alte Werte: `user` → `member`,
`admin` → `admin` (siehe Migration, Abschnitt 7).

---

## 3. Sichtbarkeits-Modell fuer Quellen

Eine **Quelle** ist eine Wissenseinheit (heute: eine `project_documents`-Zeile inkl.
ihrer `document_chunks`). Jede Quelle erhaelt eine Sichtbarkeit (`visibility`):

| `visibility` | sichtbar fuer | darf gesetzt werden von |
|---|---|---|
| `global` | **alle** Nutzer | nur Tier `admin` |
| `team` | Mitglieder **eines** Teams (`team_id`) | Tier `admin` und `team_lead` (nur eigenes Team) |
| `members` | nur explizit zugewiesene Nutzer (`source_members`) | Tier `admin` und `team_lead` |
| `private` | nur der Besitzer (`owner_id`) | jeder erstellende Nutzer (Default fuer eigene Uploads) |

Erweiterung der Tabelle `project_documents` um:

| Spalte | Typ | Beschreibung |
|---|---|---|
| `owner_id` | uuid → `users.id` | Ersteller/Besitzer der Quelle |
| `visibility` | text, default `private` | `global` \| `team` \| `members` \| `private` |
| `team_id` | uuid → `teams.id`, nullable | gesetzt, wenn `visibility = 'team'` |

> `user_id` bleibt rueckkompatibel erhalten; semantisch durch `owner_id` abgeloest.

---

## 4. Team-Struktur

Eine **Quelle vom Team Lead fuer "sein Team"** bedeutet: der Team Lead verwaltet die
Mitgliedschaft seines Teams (hinzufuegen/entfernen) und entscheidet so, wer auf das
Team-Wissen zugreifen darf.

### 4.1 Tabelle `teams`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Anzeige-Name |
| `slug` | text, unique | URL/Tech-Kennung |
| `lead_id` | uuid → `users.id` | Team-Leiter (Tier `team_lead` oder `admin`) |
| `created_at` | timestamptz | |

> **Teams werden von Admins angelegt** und mit einem Team Lead verknuepft. Der Team
> Lead verwaltet anschliessend selbst die Mitglieder seines Teams. (Siehe offene
> Frage OQ-RB-002, falls ein Team Lead mehrere Teams leiten soll.)

### 4.2 Tabelle `team_members`

| Spalte | Typ | Beschreibung |
|---|---|---|
| `team_id` | uuid → `teams.id` | |
| `user_id` | uuid → `users.id` | |
| `added_by` | uuid → `users.id` | Admin oder Team Lead |
| `created_at` | timestamptz | |
| | PK (`team_id`, `user_id`) | |

### 4.3 Tabelle `source_members` (fuer `visibility = 'members'`)

| Spalte | Typ | Beschreibung |
|---|---|---|
| `document_id` | uuid → `project_documents.id` | |
| `user_id` | uuid → `users.id` | |
| `granted_by` | uuid → `users.id` | |
| | PK (`document_id`, `user_id`) | |

---

## 5. Zugriffsberechnung (zentrale Regel)

Die Menge der fuer einen Nutzer `U` **abfragbaren Quellen** (`document_ids`) ergibt
sich ausschliesslich aus:

```
accessible(U) =
    { d | d.visibility = 'global' }                                  -- alle globalen
  ∪ { d | d.visibility = 'team'   AND d.team_id ∈ teams_of(U) }      -- seiner Teams
  ∪ { d | d.visibility = 'members' AND U ∈ source_members(d) }       -- explizit zugewiesen
  ∪ { d | d.owner_id = U OR d.user_id = U }                          -- eigene/private
```

**Diese Regel ersetzt** die heutigen Streu-Filter `.eq("user_id", current_user_id)`
ueber alle Routen (`projectRoutes`, `projectFilesRoutes`, `chatRoutes`).

### 5.1 Zentrale Umsetzung (empfohlen)

Eine Postgres-Funktion buendelt die Logik an einer Stelle, damit keine Route sie
vergessen kann (Sicherheit):

```sql
create or replace function accessible_document_ids(p_user uuid)
returns setof uuid language sql stable as $$
    select id from project_documents d
    where d.visibility = 'global'
       or (d.visibility = 'team'
           and d.team_id in (select team_id from team_members where user_id = p_user))
       or (d.visibility = 'members'
           and d.id in (select document_id from source_members where user_id = p_user))
       or d.owner_id = p_user
       or d.user_id  = p_user;
$$;
```

RAG-Retrieval (`vector_search_document_chunks`, `keyword_search_document_chunks`)
uebergibt dann `filter_document_ids := accessible_document_ids(current_user)` statt
wie heute die project-eigenen Dokuumente. Damit ist der RAG-Pfad automatisch
rollenkonform.

---

## 6. Berechtigungs-Matrix

| Aktion | `admin` (T0) | `team_lead` (T1) | `member` (T2) |
|---|:--:|:--:|:--:|
| Globale Quelle erstellen (`global`) | ja | nein | nein |
| Team-Quelle erstellen (`team`, eigenes Team) | ja | ja | nein |
| Mitglieder-spezifische Quelle (`members`) | ja | ja (eigenes Team) | nein |
| Eigene private Quelle (`private`) | ja | ja | nein * |
| Team-Mitglieder add/remove (eigenes Team) | ja | ja | nein |
| Quelle Mitgliedern zuweisen (`source_members`) | ja | ja (eigenes Team) | nein |
| Quellen abfragen/konsumieren (eigene Zugriffsmenge) | ja | ja | ja |
| Teams anlegen + Team Lead zuweisen | ja | nein | nein |
| Rollen-Registry pflegen (neue Titel/Tiers) | ja | nein | nein |
| Nutzer anlegen / Rollen aendern | ja | nein | nein |

\* siehe offene Frage OQ-RB-003: ob Mitglieder eigene private Uploads duerfen.
Aktuelle Annahme: **nein** — Mitglieder sind reine Konsumenten.

### 6.1 Backend-Durchsetzung

Heute pruefen Routen z.B. `caller.data[0].get("role") != "admin"`
(`authRoutes.py:110`). Das wird ersetzt durch Tier-Checks (`require_tier("admin")`
bzw. `require_tier_min("team_lead")`) sowie Eigentuemerschafts-Checks (z.B. Team Lead
darf nur Mitglieder **seines** Teams entfernen). Vorschlag: ein
`get_current_user_tier()`-Helper in `services/jwtAuth.py`, ergaenzt um
`tier`/`role_key` im JWT (`create_token`, `jwtAuth.py:16`).

### 6.2 Frontend-Durchsetzung

`RoleGuard` (`App.tsx:30`) akzeptiert aktuell genau eine Rolle. Konzept:
- `RoleGuard` akzeptiert **Tier** statt Rollennamen (z.B. `<TierGuard tier="admin">`)
  oder eine Liste erlaubter Tier.
- `SourcesPage` wird **fuer alle Rollen** sichtbar, zeigt aber nur
  `accessible(U)` (nicht mehr admin-only, `App.tsx:64`).
- `IngestionPage`/Quellen-Erstellung fuer Tier `admin` + `team_lead`.
- Neu: `TeamsPage` (Admin: Teams + Leads verwalten; Team Lead: Mitglieder
  add/remove).

---

## 7. Migrations-Impact (nur Uebersicht, keine Ausfuehrung)

1. `users.role`: Check-Constraint `('user','admin')` (`schema.sql:10`) ersetzen durch
   FK auf `roles.key`. **Backfill:** `user` → `member`, `admin` → `admin`.
2. `roles`-Tabelle anlegen + Default-Eintraege.
3. `teams`, `team_members`, `source_members` anlegen.
4. `project_documents`: `owner_id`, `visibility`, `team_id` ergaenzen;
   `visibility` default `private`; `owner_id` aus `user_id` befuellen.
5. RPC `accessible_document_ids(uuid)` anlegen.
6. Alle Routen: `.eq("user_id", ...)` → Zugriffsmenge via RPC.
7. JWT um `tier`/`role_key` erweitern; Helper `get_current_user_tier()`.

> **Human-Approval-Pflicht** (AGENTS.md 3.1): Schema-Migrationen und `.env`-Aenderungen
> werden erst nach Freigabe ausgefuehrt. Dieses Dokument enthaelt bewusst **keine**
> ausfuehrbare Migration.

---

## 8. Offene Fragen (vor Umsetzung zu klaeren)

Siehe `docs/open-questions.md`:

- **OQ-RB-001** — Projekt-Scoping: bleiben globale/team-Quellen an ein Projekt
  gebunden (`project_id` NOT NULL) oder werden sie projektunabhaengig
  (`project_id` nullable / virtueller "Geteilte Quellen"-Container)?
- **OQ-RB-002** — Kann ein Team Lead mehrere Teams leiten (1:n) oder genau eines?
- **OQ-RB-003** — Duermen Mitglieder eigene private Uploads, oder strikt Konsum-only?
- **OQ-RB-004** — Querverweis: Team Lead Sichtbarkeit auf Mitglieder anderer Teams?

---

## 9._naechste Schritte (Empfehlung)

1. Offene Fragen OQ-RB-001..004 klaeren (Entscheidung durch Product Owner).
2. ADR-001 auf `ACCEPTED` setzen.
3. Task-MD `TASK-2026-07-04-rbac-quellen.md` anlegen und den Fullstack-Slice planen
   (Migration → Backend-Tier-Checks → Frontend-Guards → E2E-Validierung).
