"""SSE-Streaming fuer den projektlosen, user-scoped Chat (ADR-004 / A1).

Die Dokumenten-Zugriffsmenge wird ueber `accessible_document_ids(user_id)`
(ADR-001) bestimmt -- d.h. die Suche laeuft cross-Projekt ueber alle
zugaenglichen Quellen. `project_id` dient nur als Settings-Anker und darf
None sein (Defaults aus `retrieval.utils.DEFAULT_PROJECT_SETTINGS`).
"""

import json
from typing import Dict, List, Optional

from fastapi.responses import StreamingResponse

from src.services.supabase import supabase
from src.config.logging import get_logger, set_project_id, set_user_id
from src.models.index import MessageRole
from src.rag.retrieval.utils import get_effective_settings
from src.agents.simple_agent.agent import create_simple_rag_agent
from src.agents.supervisor_agent.agent import create_supervisor_agent
from src.services.llm import get_chat_llm

logger = get_logger(__name__)

_SSE_HEADERS = {"Cache-Control": "no-cache", "Connection": "keep-alive"}


def _sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _get_chat_history(chat_id: str, exclude_message_id: Optional[str] = None) -> List[Dict[str, str]]:
    try:
        query = (
            supabase.table("messages")
            .select("id, role, content")
            .eq("chat_id", chat_id)
            .order("created_at", desc=False)
        )
        if exclude_message_id:
            query = query.neq("id", exclude_message_id)
        result = query.execute()
        if not result.data:
            return []
        return [
            {"role": m.get("role", "user"), "content": m.get("content", "")}
            for m in result.data[-10:]
        ]
    except Exception:
        return []


def _resolve_chat_model_id(requested: Optional[str]) -> Optional[str]:
    """Gewähltes Chat-Modell aus app_models auflösen (purpose=chat, enabled).
    requested muss ein aktivierter chat-Eintrag sein; sonst erster aktiver; sonst None (-> Singleton)."""
    try:
        res = (
            supabase.table("app_models")
            .select("model_id")
            .eq("enabled", True)
            .eq("purpose", "chat")
            .order("sort_order")
            .execute()
        )
        enabled = [r["model_id"] for r in (res.data or []) if r.get("model_id")]
    except Exception:
        enabled = []
    if requested and requested in enabled:
        return requested
    return enabled[0] if enabled else None


def _create_agent_for(
    project_id: Optional[str],
    user_id: str,
    chat_history: List[Dict[str, str]],
    chat_model_id: Optional[str] = None,
):
    settings = get_effective_settings(project_id)
    agent_type = settings.get("agent_type", "simple") if isinstance(settings, dict) else "simple"
    model_id = _resolve_chat_model_id(chat_model_id)
    chat_llm = get_chat_llm(model_id) if model_id else None
    common = {
        "project_id": project_id,
        "chat_llm": chat_llm,
        "chat_history": chat_history,
        "user_id": user_id,
    }
    if agent_type == "agentic":
        return create_supervisor_agent(**common)
    return create_simple_rag_agent(**common)


def _insert_user_message(chat_id: str, user_id: str, content: str):
    result = (
        supabase.table("messages")
        .insert(
            {
                "content": content,
                "chat_id": chat_id,
                "user_id": user_id,
                "role": MessageRole.USER.value,
            }
        )
        .execute()
    )
    return result.data[0] if result.data else None


def _insert_ai_message(chat_id: str, user_id: str, content: str, citations: list):
    result = (
        supabase.table("messages")
        .insert(
            {
                "content": content,
                "chat_id": chat_id,
                "user_id": user_id,
                "role": MessageRole.ASSISTANT.value,
                "citations": citations,
            }
        )
        .execute()
    )
    return result.data[0] if result.data else None


async def _run_agent_stream(agent, message_content: str, holder: dict):
    """Async generator: yields SSE-Strings und fuellt holder['full']/['citations']."""
    passed_guardrail = False
    tool_called = False
    is_final_response = False

    async for event in agent.astream_events(
        {"messages": [{"role": "user", "content": message_content}]},
        version="v2",
    ):
        kind = event["event"]
        tags = event.get("tags", [])
        name = event.get("name", "")

        if kind == "on_chain_end" and name == "guardrail":
            output = event.get("data", {}).get("output", {})
            if output.get("guardrail_passed") is False:
                msgs = output.get("messages", [])
                if msgs:
                    rejection = msgs[0].content if hasattr(msgs[0], "content") else str(msgs[0])
                    holder["full"] = rejection
                    yield _sse("token", {"content": rejection})
            else:
                passed_guardrail = True
                yield _sse("status", {"status": "Thinking..."})

        elif kind == "on_tool_start":
            tool_called = True
            if name == "rag_search":
                yield _sse("status", {"status": "Searching documents..."})

        elif kind == "on_tool_end":
            is_final_response = True
            yield _sse("status", {"status": "Generating response..."})

        elif kind == "on_chat_model_stream":
            if passed_guardrail and (is_final_response or not tool_called) and "seq:step:1" in tags:
                chunk = event["data"].get("chunk")
                if chunk:
                    content = chunk.content if hasattr(chunk, "content") else ""
                    if content:
                        holder["full"] += content
                        yield _sse("token", {"content": content})

        elif kind == "on_chain_end" and name == "LangGraph" and tags == []:
            output = event.get("data", {}).get("output", {})
            if isinstance(output, dict) and "citations" in output:
                holder["citations"] = output["citations"]


def stream_chat_response(
    project_id: Optional[str], chat_id: str, user_id: str, message_content: str,
    chat_model_id: Optional[str] = None,
) -> StreamingResponse:
    if project_id:
        set_project_id(project_id)
    set_user_id(user_id)

    async def event_generator():
        try:
            logger.info("sending_message", chat_id=chat_id)
            user_msg_row = _insert_user_message(chat_id, user_id, message_content)
            if not user_msg_row:
                logger.error("message_creation_failed", chat_id=chat_id, reason="no_data_returned")
                yield _sse("error", {"message": "Failed to create message"})
                return
            current_message_id = user_msg_row["id"]
            logger.info("user_message_created", message_id=current_message_id, chat_id=chat_id)

            chat_history = _get_chat_history(chat_id, exclude_message_id=current_message_id)
            agent = _create_agent_for(project_id, user_id, chat_history, chat_model_id)
            logger.info("invoking_agent", chat_id=chat_id)

            holder = {"full": "", "citations": []}
            async for sse in _run_agent_stream(agent, message_content, holder):
                yield sse

            logger.info(
                "agent_invocation_completed",
                chat_id=chat_id,
                response_length=len(holder["full"]),
                citations_count=len(holder["citations"]),
            )

            ai_row = _insert_ai_message(chat_id, user_id, holder["full"], holder["citations"])
            if not ai_row:
                logger.error("ai_response_creation_failed", chat_id=chat_id, reason="no_data_returned")
                yield _sse("error", {"message": "Failed to save AI response"})
                return

            logger.info("message_sent_successfully", chat_id=chat_id, ai_message_id=ai_row["id"])
            yield _sse("done", {"userMessage": user_msg_row, "aiMessage": ai_row})
        except Exception as e:
            logger.error("send_message_error", chat_id=chat_id, error=str(e), exc_info=True)
            yield _sse("error", {"message": str(e)})

    return StreamingResponse(
        event_generator(), media_type="text/event-stream", headers=_SSE_HEADERS
    )
