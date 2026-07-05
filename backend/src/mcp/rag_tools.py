"""RAG-Wrapper-Funktionen fuer den MCP-Server.

Jede Funktion stellt sicher, dass die RBAC-Zugriffsmenge ueber die Service-User-ID
(``MCP_SERVICE_USER_ID``) durchgereicht wird — es gibt bewusst KEINEN ``user_id=None``-Fallback,
da dieser die Zugriffskontrolle umgeht (siehe ADR-001, ADR-003, KB-006).

Wiederverwendung ohne HTTP-Umweg:
- ``create_supervisor_agent`` (``agents/supervisor_agent/agent.py:244``) — agentic Q&A.
- ``retrieve_context`` (``rag/retrieval/index.py:18``) — reines Retrieval.
- ``accessible_document_ids`` wird in beiden Pfaden implizit ueber ``user_id`` gezogen.
"""
from typing import Any, Dict, List

from src.agents.supervisor_agent.agent import create_supervisor_agent
from src.config.index import appConfig
from src.config.logging import (
    clear_context,
    get_logger,
    set_project_id,
    set_user_id,
)
from src.rag.retrieval.index import retrieve_context
from src.services.supabase import supabase

logger = get_logger(__name__)


def _require_service_user_id() -> str:
    """Liefert die Service-User-ID oder schlaegt fehl — kein ungefilterter Zugriff."""
    user_id = appConfig.get("mcp_service_user_id", "")
    if not user_id:
        raise RuntimeError(
            "MCP_SERVICE_USER_ID fehlt. Der MCP-Server braucht eine gueltige User-UUID, "
            "um die RBAC-Zugriffsmenge zu berechnen (kein ungefilterter Fallback)."
        )
    return user_id


def ask_rag(question: str, project_id: str) -> Dict[str, Any]:
    """Stelle eine Frage zur Wissensbasis eines Projekts und erhalte eine Antwort
    mit Quellenzitierungen. Nutzt den agentic RAG (Supervisor-Agent mit Guardrail).

    Liefert ``{answer: str, citations: list}`` bzw. ``{error: str}`` bei Misserfolg.
    """
    if not question or not project_id:
        return {"error": "question und project_id sind erforderlich."}
    user_id = _require_service_user_id()
    set_project_id(project_id)
    set_user_id(user_id)
    try:
        logger.info("mcp_ask_rag", project_id=project_id, question_len=len(question))
        agent = create_supervisor_agent(
            project_id=project_id,
            model=appConfig["agent_model_id"],
            chat_history=None,
            user_id=user_id,
        )
        result = agent.invoke(
            {"messages": [{"role": "user", "content": question}]}
        )
        messages = result.get("messages", []) if isinstance(result, dict) else []
        answer = messages[-1].content if messages else ""
        citations = result.get("citations", []) if isinstance(result, dict) else []
        return {"answer": answer, "citations": citations}
    except Exception as exc:
        logger.error("mcp_ask_rag_failed", error=str(exc), exc_info=True)
        return {"error": f"RAG-Anfrage fehlgeschlagen: {exc}"}
    finally:
        clear_context()


def search_documents(query: str, project_id: str, max_snippets: int = 8) -> Dict[str, Any]:
    """Durchsuche die Quellen eines Projekts nach relevanten Textabschnitten
    (reine Vektor-/Hybridsuche, ohne LLM-Antwort). Liefert ``{snippets, count, citations}``.

    Nuetzlich, wenn ein Client erst zelf lesen will, bevor er ask_rag fragt.
    """
    if not query or not project_id:
        return {"error": "query und project_id sind erforderlich."}
    user_id = _require_service_user_id()
    set_project_id(project_id)
    set_user_id(user_id)
    try:
        logger.info("mcp_search_documents", project_id=project_id, query_len=len(query))
        texts, _images, _tables, citations = retrieve_context(project_id, query, user_id)
        return {
            "snippets": texts[:max_snippets],
            "count": len(texts),
            "citations": citations,
        }
    except Exception as exc:
        logger.error("mcp_search_documents_failed", error=str(exc), exc_info=True)
        return {"error": f"Retrieval fehlgeschlagen: {exc}"}
    finally:
        clear_context()


def list_projects() -> List[Dict[str, Any]]:
    """Liste die Projekte des MCP-Service-Users (id, name, description, created_at).

    Erster Schritt, bevor ``ask_rag``/``search_documents`` mit einer ``project_id`` gerufen werden.
    """
    user_id = _require_service_user_id()
    set_user_id(user_id)
    try:
        logger.info("mcp_list_projects")
        resp = (
            supabase.table("projects")
            .select("id, name, description, created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .execute()
        )
        return resp.data or []
    except Exception as exc:
        logger.error("mcp_list_projects_failed", error=str(exc), exc_info=True)
        return [{"error": f"Projektliste fehlgeschlagen: {exc}"}]
    finally:
        clear_context()
