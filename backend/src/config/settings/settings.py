"""Pydantic Settings - loaded from environment / .env file."""
from __future__ import annotations

from functools import lru_cache
from urllib.parse import urlparse, urlunparse

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from src.config.settings.settings_core import CoreSettingsMixin, _is_placeholder_secret
from src.config.settings.settings_ingestion import IngestionSettingsMixin
# Re-exported for callers that import runtime-override helpers from this module.
from src.config.settings.settings_runtime import (
    get_runtime_override as get_runtime_override,
    set_runtime_override as set_runtime_override,
)


def redis_url_with_password(redis_url: str, password: str) -> str:
    """Inject ``password`` into a Redis URL if not already present.

    ``redis://localhost:6379`` + password ``"secret"`` →
    ``redis://:secret@localhost:6379``. If the URL already has credentials or
    no password is given, returns the URL unchanged.
    """
    if not password or not redis_url:
        return redis_url
    parsed = urlparse(redis_url)
    if parsed.password:
        return redis_url  # already authenticated
    netloc = parsed.hostname or ""
    if parsed.port:
        netloc += f":{parsed.port}"
    if parsed.username:
        netloc = f"{parsed.username}:{password}@{netloc}"
    else:
        netloc = f":{password}@{netloc}"
    return urlunparse(parsed._replace(netloc=netloc))


class Settings(CoreSettingsMixin, IngestionSettingsMixin, BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def _inject_redis_password(self) -> "Settings":
        """When REDIS_PASSWORD is set, inject it into redis_url centrally so
        every consumer (Celery broker, caches, rate-limiter) authenticates
        automatically without each site handling the password separately."""
        if self.redis_password:
            self.redis_url = redis_url_with_password(self.redis_url, self.redis_password)
        return self

    def validate_production_readiness(self) -> list[str]:
        issues: list[str] = []
        if self.app_env != "production":
            return issues

        if _is_placeholder_secret(self.auth_jwt_secret):
            issues.append("AUTH_JWT_SECRET must be a strong non-placeholder secret in production.")
        if not self.auth_user_secrets_encryption_key or _is_placeholder_secret(self.auth_user_secrets_encryption_key):
            issues.append("AUTH_USER_SECRETS_ENCRYPTION_KEY must be set in production (Fernet key).")
        if _is_placeholder_secret(self.minio_secret_key):
            issues.append("MINIO_SECRET_KEY must not use placeholder/default values in production.")
        if self.admin_password and _is_placeholder_secret(self.admin_password):
            issues.append("ADMIN_PASSWORD must not use placeholder/default values in production.")
        if "*" in self.cors_allow_origins:
            issues.append("CORS_ALLOW_ORIGINS must not contain '*' in production.")
        if self.cors_allow_credentials and "*" in self.cors_allow_origins:
            issues.append("CORS wildcard with credentials is not allowed in production.")
        if not self.require_kb_owner_for_access:
            issues.append("REQUIRE_KB_OWNER_FOR_ACCESS must be true in production.")
        if self.ingestion_embedding_failure_policy != "fail":
            issues.append("INGESTION_EMBEDDING_FAILURE_POLICY must be 'fail' in production.")
        if self.reranker_enabled and self.reranker_provider == "cross_encoder":
            issues.append("RERANKER_PROVIDER must be 'http' or 'custom' in production when reranking is enabled.")
        if self.reranker_enabled and self.reranker_provider in {"http", "custom"} and not self.reranker_url:
            issues.append("RERANKER_URL must be set in production when HTTP/custom reranking is enabled.")
        if not self.redis_password:
            issues.append("REDIS_PASSWORD must be set in production (Redis AUTH).")
        return issues


@lru_cache
def get_settings() -> Settings:
    return Settings()
