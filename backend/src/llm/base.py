"""Abstract Base Class for LLM Providers."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import AsyncGenerator, NotRequired, TypedDict

from src.config.settings.settings import get_runtime_override, get_settings
from src.llm.constants import DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE
from src.llm.response import LLMResponse, TokenUsage


def _resolve_provider_settings(
    provider_prefix: str,
    overrides: dict[str, str] | None = None,
) -> tuple[str, str]:
    """Resolve API key and model for a given provider.

    Args:
        provider_prefix: e.g. "anthropic", "openai", "google", "ollama", "custom_llm"
        overrides: Optional runtime overrides

    Returns:
        Tuple of (api_key, model)
    """
    settings = get_settings()
    ov = {**get_runtime_override(), **(overrides or {})}

    key_attr = f"{provider_prefix}_api_key"
    model_attr = f"{provider_prefix}_model"

    api_key = ov.get(key_attr) or getattr(settings, key_attr, "")
    model = ov.get(model_attr) or getattr(settings, model_attr, "")

    return api_key, model


def _prepare_messages(messages: list[dict], system: str = "") -> list[dict]:
    """Prepare messages with optional system prompt.

    Args:
        messages: List of message dictionaries with 'role' and 'content'.
        system: Optional system prompt string.

    Returns:
        List of messages with system prompt prepended if provided.
    """
    msgs: list[dict] = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.extend(messages)
    return msgs


def build_anthropic_cacheable_system(system: str, ttl: str | None) -> list[dict] | str:
    """Build Anthropic system content with a cache_control breakpoint.

    Anthropic prompt caching marks stable prefixes via ``cache_control`` on the
    last system text block. Returns the plain string when caching is disabled or
    the system is empty, so callers can pass the result straight to the SDK.
    """
    system = system or ""
    if not system.strip() or not ttl:
        return system
    normalized_ttl = ttl.strip().lower()
    if normalized_ttl not in {"5m", "1h"}:
        return system
    cache_control: dict[str, object] = {"type": "ephemeral"}
    if normalized_ttl == "1h":
        cache_control["ttl"] = "1h"
    return [{"type": "text", "text": system, "cache_control": cache_control}]


class RetrievalImageInput(TypedDict):
    image_bytes: bytes
    mime_type: str
    image_url: NotRequired[str]
    summary: NotRequired[str]
    title: NotRequired[str]


class BaseLLM(ABC):
    """All LLM providers implement this interface."""

    @abstractmethod
    async def stream(
        self,
        messages: list[dict],
        system: str = "",
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        image_inputs: list[RetrievalImageInput] | None = None,
        cache_system_prefix: bool = False,
    ) -> AsyncGenerator[str, None]:
        """Yield response tokens one by one.

        When ``cache_system_prefix`` is True the provider should apply its native
        prompt-caching mechanism to the stable ``system`` prefix (Anthropic
        ``cache_control`` / OpenAI automatic prefix caching).
        """
        ...

    @abstractmethod
    async def complete(
        self,
        messages: list[dict],
        system: str = "",
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        image_inputs: list[RetrievalImageInput] | None = None,
        cache_system_prefix: bool = False,
    ) -> str:
        """Return the full response as a single string."""
        ...

    async def complete_with_usage(
        self,
        messages: list[dict],
        system: str = "",
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        image_inputs: list[RetrievalImageInput] | None = None,
        cache_system_prefix: bool = False,
    ) -> LLMResponse:
        """Complete with token usage and cost data.

        Default implementation calls ``complete()`` and returns empty usage.
        Providers should override this to extract real token counts from
        their SDK responses.
        """
        text = await self.complete(
            messages=messages,
            system=system,
            temperature=temperature,
            max_tokens=max_tokens,
            image_inputs=image_inputs,
            cache_system_prefix=cache_system_prefix,
        )
        return LLMResponse(text=text, usage=TokenUsage(), provider=self.__class__.__name__)

    async def complete_with_tools(
        self,
        messages: list[dict],
        system: str = "",
        tools: list[dict] | None = None,
        tool_choice: dict | None = None,
        temperature: float = 0.0,
        max_tokens: int = 1024,
    ) -> dict | None:
        """Native function/tool calling.

        Returns the first emitted tool call as ``{"name": str, "arguments": dict}``
        or ``None`` when the provider does not support tool-calling or the model
        did not call a tool. The base implementation advertises "not supported"
        (``None``); providers with native function-calling override it.
        """
        return None
