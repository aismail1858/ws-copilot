"""RAG query streaming endpoint with multi-provider LLM support."""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from src.services.jwtAuth import get_current_user_id
from src.config.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["rag"])


class RuntimeLlmConfig(BaseModel):
    provider: str = "gemini"
    model: str = ""
    anthropicApiKey: Optional[str] = None
    openaiApiKey: Optional[str] = None
    googleApiKey: Optional[str] = None
    customLlmUrl: Optional[str] = None
    customLlmApiKey: Optional[str] = None
    ollamaUrl: Optional[str] = None
    ollamaApiKey: Optional[str] = None


class RagQueryRequest(BaseModel):
    query: str
    conversationHistory: list[dict] = []
    llmConfig: Optional[RuntimeLlmConfig] = None
    promptAddition: Optional[str] = None
    temperature: Optional[float] = None
    knowledgeMode: str = "docs_plus_model"
    knowledgeBaseId: Optional[str] = None
    allowModelKnowledgeFallback: bool = True
    searchMode: Optional[str] = None
    retrievalRoute: str = "auto"


class ChatTitleRequest(BaseModel):
    message: str
    llmConfig: Optional[RuntimeLlmConfig] = None
    temperature: Optional[float] = None


@router.post("/chat/title")
async def generate_chat_title(body: ChatTitleRequest, request: Request):
    user_id = get_current_user_id(request)
    logger.info("chat_title_requested", user_id=user_id, message_length=len(body.message))

    try:
        provider = body.llmConfig.provider if body.llmConfig else "gemini"
        model = body.llmConfig.model if body.llmConfig else ""

        if provider == "gemini":
            import google.generativeai as genai

            api_key = body.llmConfig.googleApiKey if body.llmConfig else None
            if not api_key:
                from src.config.index import appConfig
                api_key = appConfig.get("google_api_key", "")
            genai.configure(api_key=api_key)
            gen_model = genai.GenerativeModel(model or "gemini-2.5-flash")
            resp = await gen_model.generate_content_async(f"Erstelle einen kurzen Titel (max 6 Wörter) für diesen Chat: {body.message}")
            title = resp.text.strip()
        elif provider == "openai":
            from openai import AsyncOpenAI
            api_key = body.llmConfig.openaiApiKey if body.llmConfig else None
            if not api_key:
                from src.config.index import appConfig
                api_key = appConfig.get("openai_api_key", "")
            client = AsyncOpenAI(api_key=api_key)
            resp = await client.chat.completions.create(
                model=model or "gpt-4o",
                messages=[{"role": "user", "content": f"Erstelle einen kurzen Titel (max 6 Wörter) für diesen Chat: {body.message}"}],
            )
            title = resp.choices[0].message.content or ""
        else:
            title = body.message[:50]

        return {"title": title.strip()}
    except Exception as e:
        logger.error("chat_title_error", error=str(e))
        return {"title": body.message[:50]}


@router.post("/rag/query")
async def rag_query(body: RagQueryRequest, request: Request):
    user_id = get_current_user_id(request)
    logger.info(
        "rag_query_started",
        user_id=user_id,
        query_length=len(body.query),
        knowledge_mode=body.knowledgeMode,
        provider=body.llmConfig.provider if body.llmConfig else None,
    )

    async def event_generator():
        try:
            yield {"event": "status", "data": json.dumps({"type": "status", "status": "Suche nach relevanten Dokumenten..."})}

            yield {
                "event": "answer_mode",
                "data": json.dumps({
                    "type": "answer_mode",
                    "answer_mode": "model_fallback",
                    "reason": "no_relevant_context",
                }),
            }

            response = await generate_llm_response(body, user_id)
            for token in response:
                if await request.is_disconnected():
                    break
                yield {"event": "token", "data": json.dumps({"type": "token", "content": token})}

            yield {"event": "done", "data": "[DONE]"}
        except Exception as e:
            logger.error("rag_query_error", error=str(e))
            yield {
                "event": "error",
                "data": json.dumps({"type": "error", "message": str(e)}),
            }

    return EventSourceResponse(event_generator())


async def generate_llm_response(body: RagQueryRequest, user_id: str):
    provider = body.llmConfig.provider if body.llmConfig else "gemini"
    model = body.llmConfig.model if body.llmConfig else ""
    prompt = body.query

    try:
        if provider == "gemini":
            import google.generativeai as genai

            api_key = body.llmConfig.googleApiKey if body.llmConfig else None
            if not api_key:
                from src.config.index import appConfig
                api_key = appConfig.get("google_api_key", "")

            genai.configure(api_key=api_key)
            gen_model = genai.GenerativeModel(model or "gemini-2.5-flash")
            response = await gen_model.generate_content_async(prompt)
            yield response.text

        elif provider == "openai":
            from openai import AsyncOpenAI

            api_key = body.llmConfig.openaiApiKey if body.llmConfig else None
            if not api_key:
                from src.config.index import appConfig
                api_key = appConfig.get("openai_api_key", "")

            client = AsyncOpenAI(api_key=api_key)
            stream = await client.chat.completions.create(
                model=model or "gpt-4o",
                messages=[{"role": "user", "content": prompt}],
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        elif provider == "claude":
            from anthropic import AsyncAnthropic

            api_key = body.llmConfig.anthropicApiKey if body.llmConfig else None
            if not api_key:
                from src.config.index import appConfig
                api_key = appConfig.get("anthropic_api_key", "")

            client = AsyncAnthropic(api_key=api_key)
            async with client.messages.stream(
                model=model or "claude-3-5-sonnet-20241022",
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}],
            ) as stream:
                async for text in stream.text_stream:
                    yield text

        elif provider == "ollama":
            from ollama import AsyncClient

            url = body.llmConfig.ollamaUrl if body.llmConfig else "http://localhost:11434"
            client = AsyncClient(host=url)
            messages = [{"role": "user", "content": prompt}]
            async for part in await client.chat(
                model=model or "llama3.2",
                messages=messages,
                stream=True,
            ):
                if part.message and part.message.content:
                    yield part.message.content

        elif provider == "custom":
            from openai import AsyncOpenAI

            url = body.llmConfig.customLlmUrl if body.llmConfig else ""
            api_key = body.llmConfig.customLlmApiKey if body.llmConfig else ""
            if not url:
                yield "Custom LLM URL nicht konfiguriert."
                return

            client = AsyncOpenAI(api_key=api_key, base_url=url.rstrip("/") + "/v1")
            stream = await client.chat.completions.create(
                model=model or "",
                messages=[{"role": "user", "content": prompt}],
                stream=True,
            )
            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        else:
            yield f"Unbekannter Provider: {provider}"

    except Exception as e:
        logger.error("llm_generation_error", provider=provider, error=str(e))
        yield f"Fehler bei der LLM-Generierung ({provider}): {str(e)}"
