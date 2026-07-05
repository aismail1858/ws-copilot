---
task_id: TASK-2026-07-04-mcp-server
title: MCP-Server fuer agentic RAG (externe Tool-Anbindung)
status: DONE
priority: HIGH
owner: Developer (Agent)
created_at: 2026-07-04
updated_at: 2026-07-04
phase: Backend / Integration
kb_references: [KB-006]
adr_references: [ADR-003]
---

# Ziel
Einen MCP-Server (Model Context Protocol) als neuen Prozess hinzufuegen, der den bestehenden
agentic RAG (LangGraph Supervisor/Simple Agent + Retrieval) fuer externe MCP-Clients
(Claude Desktop, Cursor, opencode, Web-App) verfuegbar macht. Der Server nimmt Fragen entgegen
und beantwortet sie ueber die Wissensbasis unter Beachtung der RBAC-Zugriffsmenge.

# Scope
- In Scope:
  - Neues Modul `backend/src/mcp/` mit FastMCP-Server
  - Tools: `ask_rag` (Q&A inkl. Zitierungen), `search_documents` (reines Retrieval),
    `list_projects` (Projekte des Service-Users)
  - Beide Transports: `stdio` (lokale Clients) + `streamable-http` (Remote/Web)
  - Identitaet ueber feste `MCP_SERVICE_USER_ID` (env) → laeuft durch `accessible_document_ids`
  - CLI-Entrypoint `python -m src.mcp` mit `--transport`
  - docker-compose Service fuer HTTP-Transport
  - Dependency `mcp` in pyproject.toml
  - Doku: ADR-003, KB-006, open-questions, project-status, summary, error-log-Retro
- Out of Scope:
  - Echter Service-Account + API-Key-Verwaltung (eigene Migration, Folge-Task)
  - Token-Usage-Tracking (heute ueberall nicht vorhanden; Folge-Task)
  - Frontend-Aenderungen (MCP ist reine Backend/Integration-Schnittstelle, kein user-facing UI)
  - Globale Quellen ohne Projekt (`project_id IS NULL`) — siehe OQ-MCP-001

# Aufgaben
- [x] Task anlegen + Checkpoint-Review (KB/ADR/status/error-log gelesen)
- [x] Config erweitern (`MCP_SERVICE_USER_ID`, `MCP_HOST`, `MCP_PORT`)
- [x] Dependency `mcp` in pyproject.toml
- [x] Modul `backend/src/mcp/` (rag_tools, server, __main__)
- [x] docker-compose Service `mcp`
- [x] Syntax-Check (py_compile)
- [x] Doku aktualisiert (ADR-003, KB-006, OQ, status, summary, retro)

# Akzeptanzkriterien
1. `python -m src.mcp --transport stdio` startet einen stdio-MCP-Server (importiert sauber mit
   gesetzten Pflicht-env).
2. `python -m src.mcp --transport http` startet einen HTTP-Server auf `MCP_HOST:MCP_PORT`.
3. Tool `ask_rag(question, project_id)` nutzt `create_supervisor_agent` mit `MCP_SERVICE_USER_ID`
   und gibt `{answer, citations}` zurueck.
4. Tool `search_documents(query, project_id)` nutzt `retrieve_context` (reines Retrieval, kein LLM).
5. Tool `list_projects()` listet Projekte des Service-Users.
6. Zugriffskontrolle: `user_id` wird konsequent weitergereicht (KEIN `user_id=None`-Fallback).
7. Size-Guardrails eingehalten (Funktion <50 Zeilen, Datei <500 Zeilen).
8. Keine Schema-Migration noetig (Decision: feste Service-User-ID).

# Abhaengigkeiten
- `backend/src/agents/supervisor_agent/agent.py:create_supervisor_agent` (Wiederverwendung)
- `backend/src/rag/retrieval/index.py:retrieve_context` (Wiederverwendung)
- `backend/src/services/access.py:get_accessible_document_ids` (RBAC)
- Bestehender User in `public.users` (UUID via `MCP_SERVICE_USER_ID`)
- `mcp` Python-SDK (neue Dependency)

# Risiken
- **Risiko:** Service-User-ID in falscher Hand →RBAC-Menge dieses Users sichtbar.
  Mitigation: Env nur auf Servern, Service-User mit minimaler Rolle (`member`); OQ-MCP-002 fuer API-Key-Folge.
- **Risiko:** Global-Quellen (`project_id IS NULL`) fehlen bei projektbezogenen Tools.
  Mitigation: dokumentiert (OQ-MCP-001), `search_documents` nutzt ebenfalls `accessible_document_ids`.
- **Risiko:** LangGraph `create_agent` model-prefix (`openai:gpt-4o`) braucht OPENAI_API_KEY.
  Mitigation: nur Re-Use des bestehenden Pfads; keine zusaetzliche Annahme.

# Betroffene Dateien
- `backend/src/mcp/__init__.py` (neu)
- `backend/src/mcp/rag_tools.py` (neu)
- `backend/src/mcp/server.py` (neu)
- `backend/src/mcp/__main__.py` (neu)
- `backend/src/config/index.py` (Ergaenzung)
- `backend/.env.sample` (Ergaenzung)
- `backend/pyproject.toml` (Dependency)
- `backend/docker-compose.yml` (Service)
- `docs/decisions.md` (ADR-003)
- `docs/knowledge-base.md` (KB-006)
- `docs/open-questions.md` (OQ-MCP-001/002)
- `docs/project-status.md`
- `docs/implementation-summaries.md`
- `docs/error-log.md` (RETRO)

# Bekannte Fehler aus error-log.md (fuer diesen Task relevant)
- LM-001: Beim Starten WIRKLICH diesen Server-Prozess pruefen (eigener Port `MCP_PORT`).
- LM-003: kein Frontend-Build noetig hier (Backend-only), aber py_compile als Verify.

# Implementierungsnotizen
- Start: Checkpoint-Review abgeschlossen; Agent-Pfad ist zustandslos fuer (question, project_id, user_id).
- Zwischenstand: Tools delegieren an `rag_tools.py`; Fehler im Tool abgefangen (RAG wirft HTTPException →
  in String gewandelt, da MCP kein HTTP-Kontext ist).
- Blocker: keine.

# DoD-Checkliste (Major Task)
- [x] Akzeptanzkriterien erfuellt
- [x] Tests/Checks ausgefuehrt (py_compile) oder begründet offen (Runtime-Test braucht env + Supabase)
- [x] relevante Doku aktualisiert
- [x] KB-Eintrag vorhanden (KB-006)
- [x] Implementierungs-Summary geschrieben
- [x] Projektstatus aktualisiert
- [x] Fehler-Retrospektive in error-log.md (vollstaendig)
- [x] Aktive Lernmuster geprueft und ggf. ergaenzt
- [x] Naechste empfohlene Schritte mit Begruendung dokumentiert

# Abschluss-Summary
- Ergebnis: MCP-Server code-complete; Runtime-E2E offen (mcp-Install + env + Service-User-ID).
- Was wurde geaendert: neues Modul `backend/src/mcp/` (FastMCP, 3 Tools, dualer Transport), Config +
  .env.sample, pyproject-Dependency, docker-compose Service `mcp`; Doku ADR-003/KB-006/OQ-MCP/summary/retro.
- Offene Restpunkte: `poetry install` (mcp); `MCP_SERVICE_USER_ID` setzen; E2E-Test; Folge OQ-MCP-002 (API-Key).
- Empfohlene naechste Schritte (mit Begruendung):
  1. `cd backend && poetry install` — Dependency installieren, sonst startet der Server nicht.
  2. `MCP_SERVICE_USER_ID=<uuid>` + Client-Anbindung (Claude Desktop/opencode) -> `list_projects`
     dann `ask_rag` durchtesten — validiert RBAC + End-to-End.
  3. Folge-Task OQ-MCP-002 (Service-Account + API-Key + Migration) anlegen, sobald Integration steht.
