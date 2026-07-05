from __future__ import annotations

import json
import re
from typing import Annotated, Any, Literal

import structlog
from pydantic import Field, field_validator
from pydantic_settings import NoDecode

logger = structlog.get_logger(__name__)


def _normalize_csv_item(value: str) -> str:
    return value.strip().strip('"').strip("'").rstrip("/")


def _split_csv_values(raw: str) -> list[str]:
    text = (raw or "").strip()
    if not text:
        return []

    if text.startswith("[") and text.endswith("]"):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return [_normalize_csv_item(str(item)) for item in parsed if str(item).strip()]
        except Exception as exc:
            logger.warning("settings_csv_json_parse_failed", error=str(exc), raw_preview=text[:160])

    normalized = text.replace(";", ",").replace("\n", ",")
    return [_normalize_csv_item(item) for item in re.split(r"[\s,]+", normalized) if item.strip()]


def _normalize_csv_like_value(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, str):
        return _split_csv_values(value)
    if isinstance(value, list):
        return [_normalize_csv_item(str(item)) for item in value if str(item).strip()]
    normalized = _normalize_csv_item(str(value))
    return [normalized] if normalized else []


def _is_placeholder_secret(value: str) -> bool:
    normalized = (value or "").strip().lower()
    if not normalized:
        return True
    placeholders = {
        "changeme",
        "replace-this-secret",
        "replace-me",
        "dev-only-change-me",
        "admin12345",
    }
    return normalized in placeholders or "..." in normalized


class CoreSettingsMixin:
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    google_api_key: str = Field(default="", alias="GOOGLE_API_KEY")
    anthropic_model: str = Field(default="", alias="ANTHROPIC_MODEL")
    openai_model: str = Field(default="", alias="OPENAI_MODEL")
    google_model: str = Field(default="", alias="GOOGLE_MODEL")
    google_embedding_model: str = Field(
        default="",
        alias="GOOGLE_EMBEDDING_MODEL",
    )
    default_llm_provider: Literal["claude", "openai", "gemini", "ollama", "custom"] = Field(
        default="claude",
        alias="DEFAULT_LLM_PROVIDER",
    )
    default_embedding_provider: Literal["gemini", "openai", "ollama", "custom"] = Field(
        default="gemini",
        alias="DEFAULT_EMBEDDING_PROVIDER",
    )
    # WS3: Embedding-Dimension ist jetzt konfigurierbar. Default 3072 fuer
    # gemini-embedding-2 (unterstuetzt 128-3072). Vor WS3 war der Wert hardcoded
    # 1536. Zur Zero-Downtime-Migration kann EMBEDDING_DIMENSION=1536 in der .env
    # bleiben, bis der Cutover auf 3072 erfolgt (siehe ENTERPRISE-RAG-PLAN.md WS3).
    embedding_dimension: int = Field(
        default=3072,
        alias="EMBEDDING_DIMENSION",
        ge=128,
        le=3072,
    )
    runtime_model_configurable: bool = Field(
        default=True,
        alias="RUNTIME_MODEL_CONFIGURABLE",
    )
    anthropic_allowed_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="ANTHROPIC_ALLOWED_MODELS",
    )
    openai_allowed_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="OPENAI_ALLOWED_MODELS",
    )
    google_allowed_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="GOOGLE_ALLOWED_MODELS",
    )
    custom_allowed_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="CUSTOM_ALLOWED_MODELS",
    )
    ollama_allowed_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="OLLAMA_ALLOWED_MODELS",
    )
    openai_allowed_embedding_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="OPENAI_ALLOWED_EMBEDDING_MODELS",
    )
    custom_allowed_embedding_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="CUSTOM_ALLOWED_EMBEDDING_MODELS",
    )
    ollama_allowed_embedding_models: Annotated[list[str], NoDecode] = Field(
        default_factory=list,
        alias="OLLAMA_ALLOWED_EMBEDDING_MODELS",
    )
    custom_llm_url: str = Field(default="", alias="CUSTOM_LLM_URL")
    custom_llm_api_key: str = Field(default="", alias="CUSTOM_LLM_API_KEY")
    custom_llm_model: str = Field(default="", alias="CUSTOM_LLM_MODEL")
    custom_embedding_url: str = Field(default="", alias="CUSTOM_EMBEDDING_URL")
    custom_embedding_api_key: str = Field(default="", alias="CUSTOM_EMBEDDING_API_KEY")
    custom_embedding_model: str = Field(default="", alias="CUSTOM_EMBEDDING_MODEL")
    ollama_url: str = Field(default="http://localhost:11434", alias="OLLAMA_URL")
    ollama_api_key: str = Field(default="", alias="OLLAMA_API_KEY")
    ollama_model: str = Field(default="", alias="OLLAMA_MODEL")
    searxng_url: str = Field(default="http://localhost:8080", alias="SEARXNG_URL")
    web_agent_backend: Literal["loop_v4", "langgraph"] = Field(
        default="langgraph",
        alias="WEB_AGENT_BACKEND",
    )
    rag_live_streaming: bool = Field(
        default=True,
        alias="RAG_LIVE_STREAMING",
    )
    openai_embedding_model: str = Field(
        default="",
        alias="OPENAI_EMBEDDING_MODEL",
    )
    ollama_embedding_model: str = Field(default="", alias="OLLAMA_EMBEDDING_MODEL")
    database_url: str = Field(default="", alias="DATABASE_URL")
    db_pool_min_size: int = Field(default=5, alias="DB_POOL_MIN_SIZE", ge=1)
    db_pool_max_size: int = Field(default=25, alias="DB_POOL_MAX_SIZE", ge=1)
    db_command_timeout: int = Field(default=30, alias="DB_COMMAND_TIMEOUT", ge=1)
    minio_endpoint: str = Field(default="localhost:9000", alias="MINIO_ENDPOINT")
    minio_access_key: str = Field(default="admin", alias="MINIO_ACCESS_KEY")
    minio_secret_key: str = Field(default="changeme", alias="MINIO_SECRET_KEY")
    minio_bucket: str = Field(default="documents", alias="MINIO_BUCKET")
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")
    redis_password: str = Field(default="", alias="REDIS_PASSWORD")
    app_env: Literal["development", "staging", "production"] = Field(
        default="development",
        alias="APP_ENV",
    )
    backend_port: int = Field(default=8000, alias="BACKEND_PORT")
    log_level: Literal["debug", "info", "warning", "error"] = Field(
        default="info",
        alias="LOG_LEVEL",
    )
    cors_allow_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:5173", "http://127.0.0.1:5173"],
        alias="CORS_ALLOW_ORIGINS",
    )
    cors_allow_credentials: bool = Field(default=True, alias="CORS_ALLOW_CREDENTIALS")
    config_persist_allowed: bool = Field(default=False, alias="CONFIG_PERSIST_ALLOWED")
    require_kb_owner_for_access: bool = Field(default=False, alias="REQUIRE_KB_OWNER_FOR_ACCESS")
    auth_jwt_secret: str = Field(default="dev-only-change-me", alias="AUTH_JWT_SECRET")
    auth_user_secrets_encryption_key: str = Field(
        default="",
        alias="AUTH_USER_SECRETS_ENCRYPTION_KEY",
    )
    auth_access_token_days: int = Field(default=7, alias="AUTH_ACCESS_TOKEN_DAYS")
    auth_refresh_token_days: int = Field(default=30, alias="AUTH_REFRESH_TOKEN_DAYS")
    auth_frontend_base_url: str = Field(
        default="http://localhost:5173",
        alias="AUTH_FRONTEND_BASE_URL",
    )
    auth_email_smtp_host: str = Field(default="", alias="AUTH_EMAIL_SMTP_HOST")
    auth_email_smtp_port: int = Field(default=587, alias="AUTH_EMAIL_SMTP_PORT")
    auth_email_smtp_user: str = Field(default="", alias="AUTH_EMAIL_SMTP_USER")
    auth_email_smtp_password: str = Field(default="", alias="AUTH_EMAIL_SMTP_PASSWORD")
    auth_email_from: str = Field(default="", alias="AUTH_EMAIL_FROM")
    auth_email_use_starttls: bool = Field(default=True, alias="AUTH_EMAIL_USE_STARTTLS")
    auth_email_use_ssl: bool = Field(default=False, alias="AUTH_EMAIL_USE_SSL")
    auth_password_setup_token_hours: int = Field(
        default=24,
        alias="AUTH_PASSWORD_SETUP_TOKEN_HOURS",
    )
    auth_password_reset_token_hours: int = Field(
        default=2,
        alias="AUTH_PASSWORD_RESET_TOKEN_HOURS",
    )
    auth_superadmin_email: str = Field(default="", alias="AUTH_SUPERADMIN_EMAIL")
    admin_email: str = Field(default="", alias="ADMIN_EMAIL")
    admin_password: str = Field(default="", alias="ADMIN_PASSWORD")
    admin_display_name: str = Field(default="Administrator", alias="ADMIN_DISPLAY_NAME")

    @field_validator(
        "anthropic_allowed_models",
        "openai_allowed_models",
        "google_allowed_models",
        "custom_allowed_models",
        "ollama_allowed_models",
        "openai_allowed_embedding_models",
        "custom_allowed_embedding_models",
        "ollama_allowed_embedding_models",
        "cors_allow_origins",
        "ingest_url_allowed_hosts",
        mode="before",
    )
    @classmethod
    def _normalize_model_allowlists(cls, value: Any) -> list[str]:
        return _normalize_csv_like_value(value)

    @field_validator("auth_password_setup_token_hours", "auth_password_reset_token_hours")
    @classmethod
    def _validate_password_token_hours(cls, value: int) -> int:
        if value < 1:
            raise ValueError("password token expiry must be at least 1 hour")
        if value > 168:
            raise ValueError("password token expiry must not exceed 168 hours")
        return int(value)
