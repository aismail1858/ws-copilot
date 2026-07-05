"""LLM Provider Registry - Central configuration for all providers."""
from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Literal

if TYPE_CHECKING:
    from src.llm.base import BaseLLM

_PLACEHOLDERS = frozenset({
    "sk-ant-...",
    "sk-...",
    "aiza...",
    "replace-this-secret",
    "changeme",
    "none",
})


def _has_real_value(value: str) -> bool:
    normalized = str(value or "").strip()
    lowered = normalized.lower()
    return bool(normalized and lowered not in _PLACEHOLDERS and "..." not in lowered)


@dataclass(frozen=True)
class ProviderConfig:
    """Configuration for a single LLM provider."""

    provider_id: str
    model_key: str
    api_key_key: str | None = None
    base_url_key: str | None = None
    completion_model_key: str = ""
    title_model_key: str = ""
    api_key_required: bool = True
    supports_streaming: bool = True
    supports_vision: bool = False

    @property
    def api_key_attr_name(self) -> str | None:
        if self.api_key_key is None:
            return None
        parts = self.api_key_key.split("_")
        return parts[0] + "".join(p.title() for p in parts[1:])

    @property
    def base_url_attr_name(self) -> str | None:
        if self.base_url_key is None:
            return None
        parts = self.base_url_key.split("_")
        return parts[0] + "".join(p.title() for p in parts[1:])


# Single source of truth for all LLM provider configurations
PROVIDER_CONFIGS: dict[str, ProviderConfig] = {
    "claude": ProviderConfig(
        provider_id="claude",
        model_key="anthropic_model",
        api_key_key="anthropic_api_key",
        completion_model_key="anthropic_completion_model",
        title_model_key="anthropic_title_model",
        api_key_required=True,
        supports_streaming=True,
        supports_vision=False,
    ),
    "openai": ProviderConfig(
        provider_id="openai",
        model_key="openai_model",
        api_key_key="openai_api_key",
        completion_model_key="openai_completion_model",
        title_model_key="openai_title_model",
        api_key_required=True,
        supports_streaming=True,
        supports_vision=True,
    ),
    "gemini": ProviderConfig(
        provider_id="gemini",
        model_key="google_model",
        api_key_key="google_api_key",
        completion_model_key="google_completion_model",
        title_model_key="google_title_model",
        api_key_required=True,
        supports_streaming=True,
        supports_vision=True,
    ),
    "ollama": ProviderConfig(
        provider_id="ollama",
        model_key="ollama_model",
        api_key_key="ollama_api_key",
        base_url_key="ollama_url",
        completion_model_key="ollama_completion_model",
        title_model_key="ollama_title_model",
        api_key_required=False,
        supports_streaming=True,
        supports_vision=False,
    ),
    "custom": ProviderConfig(
        provider_id="custom",
        model_key="custom_llm_model",
        api_key_key="custom_llm_api_key",
        base_url_key="custom_llm_url",
        completion_model_key="custom_completion_model",
        title_model_key="custom_title_model",
        api_key_required=True,
        supports_streaming=True,
        supports_vision=False,
    ),
}

VALID_LLM_PROVIDERS: frozenset[str] = frozenset(PROVIDER_CONFIGS.keys())

PROVIDER_FALLBACK_ORDER: tuple[str, ...] = ("gemini", "openai", "claude", "custom", "ollama")


def get_provider_config(provider: str) -> ProviderConfig | None:
    """Get provider configuration by ID.

    Args:
        provider: The provider identifier (e.g., "claude", "openai").

    Returns:
        ProviderConfig if found, None otherwise.
    """
    return PROVIDER_CONFIGS.get(provider)


def list_providers() -> list[str]:
    """List all registered provider IDs."""
    return list(PROVIDER_CONFIGS.keys())


def get_provider_model_key(provider: str) -> str | None:
    """Get the model settings key for a provider."""
    cfg = get_provider_config(provider)
    return cfg.model_key if cfg else None


def get_provider_api_key_key(provider: str) -> str | None:
    """Get the API key settings key for a provider."""
    cfg = get_provider_config(provider)
    return cfg.api_key_key if cfg else None


def get_provider_base_url_key(provider: str) -> str | None:
    """Get the base URL settings key for a provider."""
    cfg = get_provider_config(provider)
    return cfg.base_url_key if cfg else None


def provider_supports_streaming(provider: str) -> bool:
    """Check if a provider supports streaming."""
    cfg = get_provider_config(provider)
    return cfg.supports_streaming if cfg else False


def provider_supports_vision(provider: str) -> bool:
    """Check if a provider supports vision."""
    cfg = get_provider_config(provider)
    return cfg.supports_vision if cfg else False


def get_provider_completion_model_key(provider: str) -> str | None:
    cfg = get_provider_config(provider)
    return cfg.completion_model_key or None if cfg else None


def get_provider_title_model_key(provider: str) -> str | None:
    cfg = get_provider_config(provider)
    return cfg.title_model_key or None if cfg else None


def get_setting_value(key: str, settings: Any, overrides: dict[str, str]) -> str:
    return str(overrides.get(key) or getattr(settings, key, "") or "")


def get_provider_api_key_value(provider: str, settings: Any, overrides: dict[str, str]) -> str:
    cfg = get_provider_config(provider)
    if not cfg or not cfg.api_key_key:
        return ""
    return get_setting_value(cfg.api_key_key, settings, overrides)


def get_provider_model_value(provider: str, settings: Any, overrides: dict[str, str]) -> str:
    cfg = get_provider_config(provider)
    if not cfg:
        return ""
    return get_setting_value(cfg.model_key, settings, overrides)


def provider_has_credentials(provider: str, settings: Any, overrides: dict[str, str]) -> bool:
    """Check if a provider has valid credentials configured (API key and/or URL)."""
    cfg = get_provider_config(provider)
    if not cfg:
        return False
    if cfg.api_key_key and cfg.api_key_required:
        if not _has_real_value(get_setting_value(cfg.api_key_key, settings, overrides)):
            return False
    if cfg.base_url_key:
        url = get_setting_value(cfg.base_url_key, settings, overrides)
        if not url.strip():
            return False
        if cfg.api_key_key and not cfg.api_key_required:
            pass
    return True


def provider_is_ready(provider: str, settings: Any, overrides: dict[str, str]) -> bool:
    """Check if a provider is fully ready (model + credentials)."""
    cfg = get_provider_config(provider)
    if not cfg:
        return False
    model = get_setting_value(cfg.model_key, settings, overrides)
    if not _has_real_value(model):
        return False
    if cfg.api_key_key and cfg.api_key_required:
        if not _has_real_value(get_setting_value(cfg.api_key_key, settings, overrides)):
            return False
    if cfg.base_url_key:
        url = get_setting_value(cfg.base_url_key, settings, overrides)
        if not url.strip():
            return False
    return True


def build_provider_fallback_order(preferred: str) -> list[str]:
    """Build a fallback order starting with preferred, then remaining providers."""
    seen: set[str] = set()
    order: list[str] = []
    for p in [preferred, *PROVIDER_FALLBACK_ORDER]:
        if p not in seen:
            seen.add(p)
            order.append(p)
    return order


def resolve_provider_model_override(provider: str, overrides: dict, *, completion: bool = False, title: bool = False) -> tuple[str, str]:
    """Resolve the model key and model value for a provider from overrides.

    Returns (settings_key, model_value).
    """
    cfg = get_provider_config(provider)
    if not cfg:
        return ("", "")
    if title and cfg.title_model_key:
        key = cfg.title_model_key
        return (key, str(overrides.get(key, "")))
    if completion and cfg.completion_model_key:
        key = cfg.completion_model_key
        val = str(overrides.get(key, ""))
        if val:
            return (key, val)
    key = cfg.model_key
    return (key, str(overrides.get(key, "")))


def get_provider_class(provider: str) -> type[BaseLLM]:
    """Get the provider class by ID.

    This replaces the match statement in get_llm() with a registry-based lookup.

    Args:
        provider: The provider identifier (e.g., "claude", "openai").

    Returns:
        The provider class.

    Raises:
        ValueError: If the provider is unknown.
    """
    provider_classes = {
        "claude": "app.llm.claude.ClaudeLLM",
        "openai": "app.llm.openai.OpenAILLM",
        "gemini": "app.llm.gemini.GeminiLLM",
        "ollama": "app.llm.ollama.OllamaLLM",
        "custom": "app.llm.custom.CustomLLM",
    }

    module_path = provider_classes.get(provider)
    if not module_path:
        raise ValueError(f"Unknown LLM provider: {provider}")

    module_name, class_name = module_path.rsplit(".", 1)
    import importlib

    module = importlib.import_module(module_name)
    return getattr(module, class_name)


# Type alias for provider names
ProviderName = Literal["claude", "openai", "gemini", "ollama", "custom"]