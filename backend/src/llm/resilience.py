"""
LLM resilience: Retry and Circuit Breaker for provider calls.

Retry uses tenacity with exponential backoff for transient errors.
Circuit Breaker tracks consecutive failures per provider and short-circuits
when a provider is consistently failing.
"""
from __future__ import annotations

import time

import structlog
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log,
)

logger = structlog.get_logger(__name__)

LLM_RETRY_MAX_ATTEMPTS = 3
LLM_RETRY_WAIT_MULTIPLIER = 1.0
LLM_RETRY_WAIT_MIN = 1.0
LLM_RETRY_WAIT_MAX = 10.0

CIRCUIT_BREAKER_FAILURE_THRESHOLD = 5
CIRCUIT_BREAKER_RECOVERY_SECONDS = 60.0


class CircuitOpenError(Exception):
    pass


class _CircuitBreaker:
    def __init__(
        self,
        name: str,
        failure_threshold: int = CIRCUIT_BREAKER_FAILURE_THRESHOLD,
        recovery_seconds: float = CIRCUIT_BREAKER_RECOVERY_SECONDS,
    ) -> None:
        self._name = name
        self._failure_threshold = failure_threshold
        self._recovery_seconds = recovery_seconds
        self._failure_count = 0
        self._last_failure_time: float = 0.0
        self._state: str = "closed"

    @property
    def state(self) -> str:
        if self._state == "open":
            elapsed = time.monotonic() - self._last_failure_time
            if elapsed >= self._recovery_seconds:
                self._state = "half-open"
        return self._state

    def record_success(self) -> None:
        if self._state != "closed":
            logger.info("circuit_breaker_closed", provider=self._name)
        self._failure_count = 0
        self._state = "closed"

    def record_failure(self) -> None:
        self._failure_count += 1
        self._last_failure_time = time.monotonic()
        if self._failure_count >= self._failure_threshold:
            if self._state != "open":
                logger.warning(
                    "circuit_breaker_opened",
                    provider=self._name,
                    failure_count=self._failure_count,
                    recovery_seconds=self._recovery_seconds,
                )
            self._state = "open"

    def check(self) -> None:
        current = self.state
        if current == "open":
            raise CircuitOpenError(
                f"Circuit breaker open for provider '{self._name}'. "
                f"Retry after {self._recovery_seconds}s."
            )
        if current == "half-open":
            logger.info("circuit_breaker_half_open", provider=self._name)


_breakers: dict[str, _CircuitBreaker] = {}


def get_circuit_breaker(provider: str) -> _CircuitBreaker:
    if provider not in _breakers:
        _breakers[provider] = _CircuitBreaker(name=provider)
    return _breakers[provider]


def _is_transient_llm_error(exc: BaseException) -> bool:
    if isinstance(exc, CircuitOpenError):
        return False
    msg = str(exc).lower()
    if any(kw in msg for kw in ("timeout", "timed out", "connectionerror", "connection error", "connectex")):
        return True
    if any(kw in msg for kw in ("500", "502", "503", "504", "internal server error", "bad gateway", "service unavailable", "gateway timeout")):
        return True
    exc_type = type(exc).__name__.lower()
    if any(t in exc_type for t in ("timeout", "connection", "connect")):
        return True
    return False


llm_retry = retry(
    retry=retry_if_exception(_is_transient_llm_error),
    stop=stop_after_attempt(LLM_RETRY_MAX_ATTEMPTS),
    wait=wait_exponential(
        multiplier=LLM_RETRY_WAIT_MULTIPLIER,
        min=LLM_RETRY_WAIT_MIN,
        max=LLM_RETRY_WAIT_MAX,
    ),
    before_sleep=before_sleep_log(logger, 30),
    reraise=True,
)
